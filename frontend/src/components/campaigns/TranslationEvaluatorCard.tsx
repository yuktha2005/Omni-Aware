import React, { useState } from "react";
import type { TranslationEvaluationResult } from "../../types/omni2";
import { translationEvaluationAPI } from "../../services/apiService";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

interface TranslationEvaluatorCardProps {
  evaluation: TranslationEvaluationResult;
  contentId?: number;
  onReviewCompleted?: (status: string) => void;
}

export const TranslationEvaluatorCard: React.FC<TranslationEvaluatorCardProps> = ({
  evaluation,
  contentId,
  onReviewCompleted,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(evaluation.translated_text);
  const [currentStatus, setCurrentStatus] = useState(evaluation.status);
  const [loading, setLoading] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  const handleReview = async (reviewStatus: "approved" | "rejected" | "edited") => {
    if (!contentId) return;
    try {
      setLoading(true);
      await translationEvaluationAPI.reviewContent(contentId, {
        review_status: reviewStatus,
        edited_text: reviewStatus === "edited" ? editedText : undefined,
      });
      setCurrentStatus(reviewStatus);
      setIsEditing(false);
      if (onReviewCompleted) onReviewCompleted(reviewStatus);
    } catch (err) {
      console.error("Review action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-sky-100 bg-gradient-to-br from-sky-50/30 to-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <h3 className="text-lg font-bold text-gray-900">
              Multilingual Translation Quality & Entity Preservation Evaluator
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Target Language: <strong>{evaluation.target_language}</strong> | Source: <strong>{evaluation.source_language}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 font-medium">Quality Score</div>
            <div className={`text-2xl font-black ${getScoreColor(evaluation.quality_score)}`}>
              {evaluation.quality_score}
              <span className="text-xs text-gray-400 font-normal">/100</span>
            </div>
          </div>
          <Badge
            variant={
              currentStatus === "approved" || currentStatus === "passed"
                ? "success"
                : currentStatus === "critical_error" || currentStatus === "rejected"
                ? "danger"
                : "warning"
            }
          >
            {currentStatus.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Source Text */}
        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
            <span>Original ({evaluation.source_language})</span>
            <span>Source Copy</span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed font-sans">{evaluation.source_text}</p>
        </div>

        {/* Translated Text */}
        <div className="p-3.5 bg-blue-50/40 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold uppercase tracking-wider mb-2">
            <span>Translated ({evaluation.target_language})</span>
            {isEditing ? (
              <span className="text-amber-600 font-bold">Editing Mode</span>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-indigo-600 hover:text-indigo-800 underline text-xs capitalize"
              >
                ✎ Edit Text
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={4}
                className="w-full text-sm p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedText(evaluation.translated_text);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={loading}
                  onClick={() => handleReview("edited")}
                >
                  Save & Update
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-900 leading-relaxed font-sans font-medium">
              {editedText}
            </p>
          )}
        </div>
      </div>

      {/* Back-Translation & Semantic Fidelity */}
      {evaluation.back_translated_text && (
        <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 text-xs text-gray-700 mb-4">
          <div className="font-semibold text-indigo-900 mb-1 flex items-center gap-1.5">
            <span>🔄 Back-Translation Verification ({evaluation.target_language} → {evaluation.source_language}):</span>
          </div>
          <p className="italic text-gray-600">"{evaluation.back_translated_text}"</p>
        </div>
      )}

      {/* Critical Entity Preservation Tags */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Critical Information Preservation Audit:
        </h4>
        <div className="flex flex-wrap gap-2">
          {evaluation.preservation_details.preserved_items.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
            >
              <span>✓</span> {item}
            </span>
          ))}

          {evaluation.preservation_details.missing_items.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 font-medium"
            >
              <span>⚠️</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Factor Breakdown Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-white rounded-lg border border-gray-100 text-center mb-4">
        <div>
          <div className="text-[11px] text-gray-500">Entity Preserved</div>
          <div className="text-sm font-bold text-gray-900">
            {evaluation.score_breakdown.critical_entity_preservation}/30
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500">Semantic Match</div>
          <div className="text-sm font-bold text-gray-900">
            {evaluation.score_breakdown.semantic_similarity}/30
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500">Completeness</div>
          <div className="text-sm font-bold text-gray-900">
            {evaluation.score_breakdown.completeness_and_length}/20
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500">Terminology</div>
          <div className="text-sm font-bold text-gray-900">
            {evaluation.score_breakdown.terminology_consistency}/10
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500">Readability</div>
          <div className="text-sm font-bold text-gray-900">
            {evaluation.score_breakdown.readability_and_script}/10
          </div>
        </div>
      </div>

      {/* Issues & Warnings */}
      {evaluation.issues && evaluation.issues.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {evaluation.issues.map((iss, idx) => (
            <div
              key={idx}
              className={`text-xs p-2.5 rounded border flex items-start gap-2 ${
                iss.severity === "high"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <span>{iss.severity === "high" ? "🚨" : "⚠️"}</span>
              <div>
                <span className="font-semibold">{iss.message}</span>
                {iss.suggestion && <p className="text-[11px] text-gray-600 mt-0.5">{iss.suggestion}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Human Review Actions */}
      {contentId && (
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {!evaluation.can_auto_approve && (
              <span className="text-rose-600 font-semibold">
                Critical missing information prevents automatic sign-off.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
              disabled={loading}
              onClick={() => handleReview("rejected")}
            >
              Reject Translation
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
              onClick={() => handleReview("approved")}
            >
              ✓ Approve Translation
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
