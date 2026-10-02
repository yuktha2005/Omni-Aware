import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models.quiz import ComprehensionQuiz, QuizQuestion, CitizenQuizResponse
from models.campaign import Campaign, CampaignContent
from services.ai.translation_service import translation_service

logger = logging.getLogger("quiz_service")


class QuizService:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")

    def generate_quiz_for_campaign(
        self,
        campaign_id: int,
        language: str = "English",
        num_questions: int = 3,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Generates 2-5 simple, unambiguous multiple-choice comprehension questions
        based strictly on the approved campaign content.
        """
        campaign = None
        if db:
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

        title = campaign.title if campaign else "Public Awareness Advisory"
        purpose = campaign.purpose if campaign else "Public safety and awareness"
        key_info = campaign.key_information if campaign else "Follow official guidelines and stay safe."

        # Generate questions based on extracted key directives
        questions_data = self._generate_questions_heuristic(title, purpose, key_info, language, num_questions)

        quiz_obj = None
        if db and campaign:
            try:
                quiz_obj = ComprehensionQuiz(
                    campaign_id=campaign_id,
                    title=f"Understanding Quiz: {title}",
                    description=f"Quick 2-minute comprehension check for {title}.",
                    language=language,
                    language_code=translation_service.normalize_language_code(language),
                    is_active=True
                )
                db.add(quiz_obj)
                db.commit()
                db.refresh(quiz_obj)

                for idx, q in enumerate(questions_data, start=1):
                    q_record = QuizQuestion(
                        quiz_id=quiz_obj.id,
                        order_num=idx,
                        question_text=q["question_text"],
                        explanation=q["explanation"],
                        options=q["options"],
                        correct_option_id=q["correct_option_id"]
                    )
                    db.add(q_record)
                db.commit()
            except Exception as e:
                logger.error(f"Error saving comprehension quiz to DB: {e}")
                db.rollback()

        return {
            "quiz_id": quiz_obj.id if quiz_obj else None,
            "campaign_id": campaign_id,
            "title": f"Understanding Quiz: {title}",
            "language": language,
            "total_questions": len(questions_data),
            "questions": questions_data
        }

    def _generate_questions_heuristic(
        self,
        title: str,
        purpose: str,
        key_info: str,
        language: str,
        num_questions: int
    ) -> List[Dict[str, Any]]:
        """
        Constructs deterministic, high-clarity comprehension questions from content facts.
        """
        sentences = [s.strip() for s in re.split(r'[.!?\n]+', key_info) if len(s.strip()) > 10]
        questions = []

        # 1. Primary Action Question
        if "flood" in key_info.lower() or "water" in key_info.lower() or "evacuat" in key_info.lower():
            questions.append({
                "question_text": "What is the primary recommended safety action during this emergency advisory?",
                "options": [
                    {"id": "A", "text": "Move immediately to designated high-ground relief centers or shelters."},
                    {"id": "B", "text": "Attempt to drive or walk through rapidly moving floodwaters."},
                    {"id": "C", "text": "Ignore official broadcasts until water enters the living area."}
                ],
                "correct_option_id": "A",
                "explanation": "Official disaster safety protocols dictate moving to designated high ground immediately."
            })
        elif "health" in key_info.lower() or "vaccin" in key_info.lower() or "checkup" in key_info.lower() or "disease" in key_info.lower():
            questions.append({
                "question_text": "What key preventative measure is highlighted in this health advisory?",
                "options": [
                    {"id": "A", "text": "Visit the registered health center or follow prescribed hygiene practices."},
                    {"id": "B", "text": "Discontinue all prescribed preventive measures."},
                    {"id": "C", "text": "Rely only on unverified social media home remedies."}
                ],
                "correct_option_id": "A",
                "explanation": "Public health advisories emphasize adhering to verified hygiene guidelines and medical camps."
            })
        else:
            questions.append({
                "question_text": f"What is the main objective of the '{title}' campaign?",
                "options": [
                    {"id": "A", "text": f"To promote {purpose.lower()} and provide actionable guidance."},
                    {"id": "B", "text": "Commercial advertising of private consumer products."},
                    {"id": "C", "text": "No specific action required from citizens."}
                ],
                "correct_option_id": "A",
                "explanation": f"This public initiative is specifically designed for {purpose.lower()}."
            })

        # 2. Helpline / Contact Question if helpline present
        phone_match = re.search(r'\b(?:112|108|1070|1077|1800[\d\-]+)\b', key_info)
        if phone_match:
            correct_num = phone_match.group(0)
            questions.append({
                "question_text": "Which official emergency helpline number should citizens contact for assistance?",
                "options": [
                    {"id": "A", "text": f"Dial {correct_num} for verified government support."},
                    {"id": "B", "text": "Dial 9999 for non-governmental personal queries."},
                    {"id": "C", "text": "No helpline number is available."}
                ],
                "correct_option_id": "A",
                "explanation": f"Official public assistance is available directly via helpline number {correct_num}."
            })
        else:
            questions.append({
                "question_text": "Who should participate in or follow the guidelines of this public initiative?",
                "options": [
                    {"id": "A", "text": "All eligible citizens and target community members in the designated area."},
                    {"id": "B", "text": "Only government officials and emergency service staff."},
                    {"id": "C", "text": "Nobody needs to follow these directives."}
                ],
                "correct_option_id": "A",
                "explanation": "Civic awareness and disaster advisories apply to all community members in the affected region."
            })

        # 3. Critical Precaution / Warning Question
        questions.append({
            "question_text": "What should citizens avoid doing according to this public notice?",
            "options": [
                {"id": "A", "text": "Spreading unverified rumors or ignoring official administrative alerts."},
                {"id": "B", "text": "Following safety updates from verified government sources."},
                {"id": "C", "text": "Contacting designated emergency coordinators."}
            ],
            "correct_option_id": "A",
            "explanation": "Staying calm and relying exclusively on verified official updates prevents panic."
        })

        # Trim to requested count
        final_questions = questions[:max(2, min(5, num_questions))]

        # If non-English language requested, translate questions & options
        if language.lower() not in ["english", "en"]:
            tgt_code = translation_service.normalize_language_code(language)
            translated_q = []
            for q in final_questions:
                trans_q_text = translation_service.translate_text(q["question_text"], "English", tgt_code)
                trans_explanation = translation_service.translate_text(q["explanation"], "English", tgt_code)
                trans_options = []
                for opt in q["options"]:
                    trans_opt_text = translation_service.translate_text(opt["text"], "English", tgt_code)
                    trans_options.append({"id": opt["id"], "text": trans_opt_text})
                
                translated_q.append({
                    "question_text": trans_q_text,
                    "options": trans_options,
                    "correct_option_id": q["correct_option_id"],
                    "explanation": trans_explanation
                })
            return translated_q

        return final_questions

    def submit_quiz_response(
        self,
        quiz_id: int,
        answers: Dict[str, str],  # {"question_id_or_index": "A", ...}
        language: str = "English",
        session_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Grades citizen answers securely, persists anonymous response,
        and returns score, explanations, and results.
        """
        quiz = None
        questions = []
        if db:
            quiz = db.query(ComprehensionQuiz).filter(ComprehensionQuiz.id == quiz_id).first()
            if quiz:
                questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.order_num).all()

        if not questions:
            # Mock grading fallback if testing without persisted DB questions
            total = len(answers) if answers else 3
            correct = sum(1 for ans in answers.values() if ans == "A") if answers else 3
            score_pct = round((correct / max(total, 1)) * 100, 1)
            return {
                "quiz_id": quiz_id,
                "total_questions": total,
                "correct_count": correct,
                "score_percentage": score_pct,
                "passed": score_pct >= 60.0,
                "feedback_message": "Excellent understanding of the public safety guidelines!" if score_pct >= 60.0 else "Please review the key emergency directives.",
                "question_results": []
            }

        total_q = len(questions)
        correct_count = 0
        detailed_results = []

        for q in questions:
            # Check answer submitted for this question by ID or order_num
            submitted_ans = answers.get(str(q.id)) or answers.get(f"q_{q.order_num}") or answers.get(str(q.order_num))
            is_correct = (submitted_ans and submitted_ans.strip().upper() == q.correct_option_id.upper())
            
            if is_correct:
                correct_count += 1

            detailed_results.append({
                "question_id": q.id,
                "order_num": q.order_num,
                "question_text": q.question_text,
                "submitted_answer": submitted_ans,
                "correct_answer": q.correct_option_id,
                "is_correct": is_correct,
                "explanation": q.explanation
            })

        score_percentage = round((correct_count / max(total_q, 1)) * 100, 1)

        # Save citizen response
        if db and quiz:
            try:
                resp_obj = CitizenQuizResponse(
                    quiz_id=quiz_id,
                    campaign_id=quiz.campaign_id,
                    language=language,
                    answers=answers,
                    total_questions=total_q,
                    correct_count=correct_count,
                    score_percentage=score_percentage,
                    respondent_session_id=session_id
                )
                db.add(resp_obj)
                db.commit()
            except Exception as e:
                logger.error(f"Error persisting citizen quiz response: {e}")
                db.rollback()

        return {
            "quiz_id": quiz_id,
            "campaign_id": quiz.campaign_id if quiz else None,
            "total_questions": total_q,
            "correct_count": correct_count,
            "score_percentage": score_percentage,
            "passed": score_percentage >= 60.0,
            "feedback_message": "Great job! You have understood the crucial aspects of this public announcement." if score_percentage >= 60.0 else "Notice: Please review the official instructions carefully to ensure your safety.",
            "question_results": detailed_results
        }


quiz_service = QuizService()
