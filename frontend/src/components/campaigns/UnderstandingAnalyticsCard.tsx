import React, { useState, useEffect } from "react";
import type { UnderstandingAnalytics } from "../../types/omni2";
import { quizAPI } from "../../services/apiService";
import Button from "../ui/Button";
import Card from "../ui/Card";

interface UnderstandingAnalyticsCardProps {
  campaignId: number;
  campaignTitle?: string;
}

export const UnderstandingAnalyticsCard: React.FC<UnderstandingAnalyticsCardProps> = ({
  campaignId,
  campaignTitle,
}) => {
  const [data, setData] = useState<UnderstandingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await quizAPI.getUnderstandingAnalytics(campaignId);
      setData(res.data);

      const qRes = await quizAPI.getCampaignQuizzes(campaignId);
      if (qRes.data && qRes.data.length > 0) {
        setQuizId(qRes.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load understanding analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) fetchAnalytics();
  }, [campaignId]);

  const handleGenerateQuiz = async () => {
    try {
      setGeneratingQuiz(true);
      const res = await quizAPI.generate(campaignId, { language: "English", num_questions: 3 });
      setQuizId(res.data.quiz_id);
      await fetchAnalytics();
    } catch (err) {
      console.error("Failed to generate quiz:", err);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const copyQuizLink = () => {
    if (!quizId) return;
    const url = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <Card className="p-6 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
        Loading Citizen Understanding Score & Comprehension Telemetry...
      </Card>
    );
  }

  return (
    <Card className="border-purple-100 bg-gradient-to-br from-purple-50/30 to-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <h3 className="text-lg font-bold text-gray-900">
              {campaignTitle ? `Citizen Understanding Score: ${campaignTitle}` : "Citizen Understanding Score & Feedback Analytics"}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time metric evaluating whether citizens accurately understand critical directives.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {quizId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={copyQuizLink}
              className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {copied ? "✓ Copied Quiz Link!" : "📋 Copy Citizen Quiz URL"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              disabled={generatingQuiz}
              onClick={handleGenerateQuiz}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              {generatingQuiz ? "Generating..." : "✨ Generate Citizen Quiz"}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Understanding Rate
          </div>
          <div className="text-3xl font-black text-purple-600">
            {data?.overall_understanding_rate || 0}%
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            (Correct Answers / Total Answered Questions)
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Citizen Participants
          </div>
          <div className="text-3xl font-black text-blue-600">
            {data?.total_participants || 0}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Distinct respondent sessions
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total Questions Answered
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {data?.total_questions_answered || 0}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {data?.total_correct_answers || 0} answered correctly
          </div>
        </div>
      </div>

      {/* Question-wise Accuracy Breakdown */}
      {data?.question_performance && data.question_performance.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            Question-by-Question Comprehension Performance:
          </h4>
          <div className="space-y-2.5">
            {data.question_performance.map((q, idx) => (
              <div
                key={q.question_id || idx}
                className="p-3 bg-white rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">Q{q.order_num}:</span>
                    <span className="text-gray-700">{q.question_text}</span>
                  </div>
                  {q.is_low_accuracy && (
                    <span className="inline-block text-[11px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                      ⚠️ High Citizen Error Rate ({100 - q.accuracy_rate}% incorrect)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        q.accuracy_rate >= 80
                          ? "bg-emerald-500"
                          : q.accuracy_rate >= 60
                          ? "bg-blue-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${q.accuracy_rate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-10 text-right">
                    {q.accuracy_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language-wise Performance */}
      {data?.language_performance && data.language_performance.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            Language-wise Understanding Rates:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.language_performance.map((lang, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                <div className="text-xs font-bold text-gray-800">{lang.language}</div>
                <div className="text-lg font-black text-indigo-600 mt-1">
                  {lang.understanding_rate}%
                </div>
                <div className="text-[11px] text-gray-400">
                  {lang.participants} respondents
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable AI Campaign Improvement Recommendations */}
      {data?.improvement_recommendations && data.improvement_recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            Targeted Campaign Improvement Recommendations:
          </h4>
          <div className="space-y-2">
            {data.improvement_recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  rec.priority === "critical"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : rec.priority === "high"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : rec.priority === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                <span className="text-base">
                  {rec.priority === "critical" ? "🚨" : rec.priority === "high" ? "💡" : rec.priority === "success" ? "🎉" : "ℹ️"}
                </span>
                <div className="space-y-1">
                  <div className="font-bold text-sm">{rec.title}</div>
                  <p className="text-gray-700">{rec.description}</p>
                  <p className="font-semibold text-indigo-800 mt-1">👉 Action: {rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
