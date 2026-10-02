import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { quizAPI } from "../../services/apiService";
import type { PublicQuiz, QuizSubmissionResult } from "../../types/omni2";
import Button from "../../components/ui/Button";

const CitizenQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();

  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      try {
        setLoading(true);
        const res = await quizAPI.getPublicQuiz(parseInt(quizId, 10));
        setQuiz(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load comprehension quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (questionId: number, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId.toString()]: optionId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz || !quizId) return;

    if (Object.keys(answers).length < quiz.questions.length) {
      alert("Please answer all questions before submitting your response.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await quizAPI.submitQuiz(parseInt(quizId, 10), {
        answers,
        language: quiz.language,
      });
      setResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm font-medium text-gray-600">Loading Public Awareness Check...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border max-w-md w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900">Quiz Unavailable</h2>
          <p className="text-sm text-gray-600">{error || "The requested public quiz could not be found."}</p>
          <Link to="/" className="inline-block text-sm text-indigo-600 font-semibold hover:underline">
            Return to Portal Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-slate-50 to-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider">
            🏛️ Official Public Safety Check
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {quiz.title}
          </h1>
          <p className="text-xs text-gray-500">
            Language: <strong>{quiz.language}</strong> | Complete this 1-minute comprehension check to confirm understanding.
          </p>
        </div>

        {/* Results Card if submitted */}
        {result ? (
          <div className="bg-white rounded-2xl shadow-md border border-indigo-100 p-6 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="text-5xl">{result.passed ? "🎉" : "📋"}</div>
              <h2 className="text-xl font-black text-gray-900">
                {result.passed ? "Thank You for Participating!" : "Review Public Guidelines"}
              </h2>
              <div className="text-3xl font-black text-indigo-600">
                {result.score_percentage}% Score
              </div>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                {result.feedback_message}
              </p>
            </div>

            {/* Answer Explanations */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Question Review & Safety Explanations:
              </h3>
              {result.question_results.map((q, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-sm space-y-1.5 ${
                    q.is_correct ? "bg-emerald-50/40 border-emerald-200" : "bg-rose-50/40 border-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-gray-900">Q{q.order_num}: {q.question_text}</span>
                    <span>{q.is_correct ? "✅ Correct" : "❌ Review Needed"}</span>
                  </div>
                  {q.explanation && (
                    <div className="text-xs text-gray-700 bg-white/80 p-2.5 rounded border border-gray-200 mt-1">
                      <strong>💡 Official Directive:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                🔒 Your response is recorded anonymously for civic awareness telemetry.
              </p>
            </div>
          </div>
        ) : (
          /* Quiz Submission Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {quiz.questions.map((q) => (
              <div
                key={q.id || q.order_num}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <span className="font-black text-indigo-600 text-sm">Q{q.order_num}.</span>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">
                    {q.question_text}
                  </h3>
                </div>

                <div className="space-y-2 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id ? q.id.toString() : q.order_num.toString()] === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id || q.order_num, opt.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 font-semibold"
                            : "bg-gray-50/50 hover:bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full py-3.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
            >
              {submitting ? "Submitting Response..." : "✓ Submit Understanding Feedback"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CitizenQuizPage;
