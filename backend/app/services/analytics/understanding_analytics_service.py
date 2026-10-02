import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.quiz import ComprehensionQuiz, QuizQuestion, CitizenQuizResponse
from models.campaign import Campaign

logger = logging.getLogger("understanding_analytics_service")


class UnderstandingAnalyticsService:
    def __init__(self):
        pass

    def get_campaign_understanding_metrics(self, campaign_id: int, db: Session) -> Dict[str, Any]:
        """
        Calculates authoritative comprehension and understanding analytics for a campaign:
        - Understanding Rate = (Total Correct Answers / Total Answered Questions) * 100
        - Question-wise accuracy breakdown
        - Language-wise comprehension rates
        - Actionable AI Campaign Improvement Recommendations based on actual data.
        """
        responses = db.query(CitizenQuizResponse).filter(CitizenQuizResponse.campaign_id == campaign_id).all()
        quizzes = db.query(ComprehensionQuiz).filter(ComprehensionQuiz.campaign_id == campaign_id).all()

        total_participants = len(responses)

        if total_participants == 0:
            return {
                "campaign_id": campaign_id,
                "has_data": False,
                "total_participants": 0,
                "overall_understanding_rate": 0.0,
                "correct_response_percentage": 0.0,
                "incorrect_response_percentage": 0.0,
                "question_performance": [],
                "language_performance": [],
                "improvement_recommendations": [
                    {
                        "priority": "info",
                        "title": "Awaiting Citizen Quiz Responses",
                        "description": "Distribute the comprehension quiz link to citizens to gather real-time understanding feedback.",
                        "action": "Copy and broadcast the citizen comprehension quiz URL."
                    }
                ]
            }

        total_questions_answered = sum(r.total_questions for r in responses)
        total_correct_answers = sum(r.correct_count for r in responses)

        # Understanding Rate = (Correct Answers / Total Answered Questions) * 100
        overall_understanding_rate = round(
            (total_correct_answers / max(total_questions_answered, 1)) * 100, 1
        )
        incorrect_percentage = round(100.0 - overall_understanding_rate, 1)

        # 1. Question-wise Analysis
        all_quiz_ids = [q.id for q in quizzes]
        questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id.in_(all_quiz_ids)).all() if all_quiz_ids else []
        
        question_stats: Dict[int, Dict[str, Any]] = {}
        for q in questions:
            question_stats[q.id] = {
                "question_id": q.id,
                "order_num": q.order_num,
                "question_text": q.question_text,
                "explanation": q.explanation,
                "total_attempts": 0,
                "correct_attempts": 0
            }

        for r in responses:
            if isinstance(r.answers, dict):
                for q_key, ans_val in r.answers.items():
                    for q in questions:
                        if str(q.id) == str(q_key) or f"q_{q.order_num}" == str(q_key) or str(q.order_num) == str(q_key):
                            question_stats[q.id]["total_attempts"] += 1
                            if ans_val and ans_val.strip().upper() == q.correct_option_id.upper():
                                question_stats[q.id]["correct_attempts"] += 1

        question_performance = []
        low_accuracy_topics = []

        for q_id, data in question_stats.items():
            attempts = data["total_attempts"]
            correct = data["correct_attempts"]
            acc_rate = round((correct / max(attempts, 1)) * 100, 1) if attempts > 0 else 0.0
            
            question_performance.append({
                "question_id": q_id,
                "order_num": data["order_num"],
                "question_text": data["question_text"],
                "total_attempts": attempts,
                "correct_attempts": correct,
                "accuracy_rate": acc_rate,
                "is_low_accuracy": acc_rate < 70.0 and attempts >= 3
            })

            if acc_rate < 70.0 and attempts >= 3:
                low_accuracy_topics.append(data["question_text"])

        # 2. Language-wise Analysis
        lang_stats: Dict[str, Dict[str, int]] = {}
        for r in responses:
            lang = r.language or "English"
            if lang not in lang_stats:
                lang_stats[lang] = {"total_q": 0, "correct_q": 0, "participants": 0}
            lang_stats[lang]["total_q"] += r.total_questions
            lang_stats[lang]["correct_q"] += r.correct_count
            lang_stats[lang]["participants"] += 1

        language_performance = []
        for lang, s in lang_stats.items():
            lang_rate = round((s["correct_q"] / max(s["total_q"], 1)) * 100, 1)
            language_performance.append({
                "language": lang,
                "participants": s["participants"],
                "understanding_rate": lang_rate
            })

        # 3. Actionable Campaign Improvement Recommendations
        recommendations = []

        if overall_understanding_rate < 60.0:
            recommendations.append({
                "priority": "critical",
                "title": "High Citizen Confusion Detected",
                "description": f"The overall understanding rate is {overall_understanding_rate}%. The campaign vocabulary or instructions may be too complex.",
                "action": "Simplify sentences, remove technical jargon, and consider issuing an illustrative audio/video bulletin."
            })
        elif overall_understanding_rate < 80.0:
            recommendations.append({
                "priority": "medium",
                "title": "Moderate Knowledge Gaps Identified",
                "description": f"Citizens achieved a {overall_understanding_rate}% understanding rate. Certain safety instructions require clarification.",
                "action": "Broadcast an FAQ follow-up highlighting key emergency helplines and action steps."
            })
        else:
            recommendations.append({
                "priority": "success",
                "title": "Strong Public Comprehension",
                "description": f"Outstanding {overall_understanding_rate}% comprehension rate across surveyed citizen cohorts.",
                "action": "Maintain current messaging cadence and monitor regional delivery rates."
            })

        if low_accuracy_topics:
            recommendations.append({
                "priority": "high",
                "title": "Targeted Revision for High-Error Questions",
                "description": f"Significant errors detected in questions related to: '{low_accuracy_topics[0][:80]}...'",
                "action": "Send a targeted 1-line SMS / WhatsApp alert emphasizing the correct helpline or evacuation procedure."
            })

        # Check for language disparities
        if len(language_performance) > 1:
            rates = [l["understanding_rate"] for l in language_performance if l["participants"] >= 2]
            if rates and (max(rates) - min(rates) >= 25.0):
                lowest_lang = min(language_performance, key=lambda x: x["understanding_rate"])
                recommendations.append({
                    "priority": "medium",
                    "title": f"Regional Translation Disparity in {lowest_lang['language']}",
                    "description": f"Understanding in {lowest_lang['language']} is {lowest_lang['understanding_rate']}%, significantly lower than other languages.",
                    "action": f"Review and refine the {lowest_lang['language']} vernacular translation and phrasing with a native language auditor."
                })

        return {
            "campaign_id": campaign_id,
            "has_data": True,
            "total_participants": total_participants,
            "total_questions_answered": total_questions_answered,
            "total_correct_answers": total_correct_answers,
            "overall_understanding_rate": overall_understanding_rate,
            "correct_response_percentage": overall_understanding_rate,
            "incorrect_response_percentage": incorrect_percentage,
            "question_performance": question_performance,
            "language_performance": language_performance,
            "improvement_recommendations": recommendations
        }


understanding_analytics_service = UnderstandingAnalyticsService()
