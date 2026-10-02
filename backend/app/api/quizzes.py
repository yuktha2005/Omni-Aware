from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.quiz import ComprehensionQuiz, QuizQuestion, CitizenQuizResponse
from models.admin import Admin
from schemas.omni2 import (
    GenerateQuizRequest, PublicQuizResponse, QuizQuestionItem, QuizOption,
    QuizSubmissionRequest, QuizSubmissionResult, UnderstandingAnalyticsResponse
)
from services.ai.quiz_service import quiz_service
from services.analytics.understanding_analytics_service import understanding_analytics_service
from services.auth_service import get_current_admin

router = APIRouter(
    prefix="/api/quizzes",
    tags=["Citizen Understanding & Comprehension Quizzes"]
)


@router.post("/generate/{campaign_id}")
def generate_campaign_quiz(
    campaign_id: int,
    request: GenerateQuizRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Generates 2-5 multiple-choice questions grounded strictly in the campaign's approved advisory content.
    """
    result = quiz_service.generate_quiz_for_campaign(
        campaign_id=campaign_id,
        language=request.language,
        num_questions=request.num_questions,
        db=db
    )
    return result


@router.get("/campaign/{campaign_id}")
def get_campaign_quizzes(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieves all comprehension quizzes created for a specific campaign.
    """
    quizzes = db.query(ComprehensionQuiz).filter(
        ComprehensionQuiz.campaign_id == campaign_id
    ).order_by(ComprehensionQuiz.id.desc()).all()

    result = []
    for q in quizzes:
        questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == q.id).order_by(QuizQuestion.order_num).all()
        result.append({
            "id": q.id,
            "campaign_id": q.campaign_id,
            "title": q.title,
            "description": q.description,
            "language": q.language,
            "language_code": q.language_code,
            "is_active": q.is_active,
            "total_questions": len(questions),
            "created_at": q.created_at.isoformat() if q.created_at else None
        })
    return result


@router.get("/{quiz_id}", response_model=PublicQuizResponse)
def get_public_quiz(
    quiz_id: int,
    db: Session = Depends(get_db)
):
    """
    Public Citizen Endpoint: Fetches comprehension quiz questions and choices without exposing answer keys.
    """
    quiz = db.query(ComprehensionQuiz).filter(ComprehensionQuiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comprehension quiz with ID {quiz_id} not found."
        )

    questions = db.query(QuizQuestion).filter(
        QuizQuestion.quiz_id == quiz.id
    ).order_by(QuizQuestion.order_num.asc()).all()

    formatted_q = []
    for q in questions:
        raw_options = q.options if isinstance(q.options, list) else []
        options = [
            QuizOption(id=opt.get("id", "A"), text=opt.get("text", ""))
            for opt in raw_options
        ]
        formatted_q.append(
            QuizQuestionItem(
                id=q.id,
                order_num=q.order_num,
                question_text=q.question_text,
                options=options,
                explanation=None,  # Do not leak explanation before submit
                correct_option_id=None  # Do not leak correct option before submit
            )
        )

    return PublicQuizResponse(
        id=quiz.id,
        campaign_id=quiz.campaign_id,
        title=quiz.title,
        description=quiz.description,
        language=quiz.language,
        questions=formatted_q
    )


@router.post("/{quiz_id}/submit", response_model=QuizSubmissionResult)
def submit_citizen_quiz(
    quiz_id: int,
    request: QuizSubmissionRequest,
    db: Session = Depends(get_db)
):
    """
    Public Citizen Endpoint: Submits citizen quiz answers, grades them securely,
    and returns score percentage with educational explanations.
    """
    result = quiz_service.submit_quiz_response(
        quiz_id=quiz_id,
        answers=request.answers,
        language=request.language,
        session_id=request.session_id,
        db=db
    )
    return result


@router.get("/campaign/{campaign_id}/analytics", response_model=UnderstandingAnalyticsResponse)
def get_campaign_understanding_analytics(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns authoritative Citizen Understanding Metrics:
    Understanding Rate % = (Correct Answers / Total Answered Questions) * 100,
    Question-by-Question breakdown, and real AI Campaign Improvement Recommendations.
    """
    result = understanding_analytics_service.get_campaign_understanding_metrics(
        campaign_id=campaign_id,
        db=db
    )
    return result
