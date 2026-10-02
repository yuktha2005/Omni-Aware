from sqlalchemy import Column, BigInteger, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database.connection import Base


class ComprehensionQuiz(Base):
    __tablename__ = "comprehension_quizzes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String(50), default="English", nullable=False)
    language_code = Column(String(20), default="en", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    campaign = relationship("Campaign", backref="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order_num")
    responses = relationship("CitizenQuizResponse", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    quiz_id = Column(BigInteger, ForeignKey("comprehension_quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    order_num = Column(Integer, default=1, nullable=False)
    question_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    
    # Options stored as list of dicts: [{"id": "A", "text": "Option 1"}, {"id": "B", "text": "Option 2"}, ...]
    options = Column(JSONB, nullable=False)
    correct_option_id = Column(String(10), nullable=False)
    
    quiz = relationship("ComprehensionQuiz", back_populates="questions")


class CitizenQuizResponse(Base):
    __tablename__ = "citizen_quiz_responses"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    quiz_id = Column(BigInteger, ForeignKey("comprehension_quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    language = Column(String(50), default="English")
    
    # Answer map e.g. {"question_id_1": "A", "question_id_2": "B"}
    answers = Column(JSONB, nullable=False)
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    
    # Anonymous hash / tracking ID to prevent duplicate submissions without storing PII
    respondent_session_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    quiz = relationship("ComprehensionQuiz", back_populates="responses")
    campaign = relationship("Campaign", backref="quiz_responses")
