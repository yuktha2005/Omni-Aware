import React, { useState } from "react";
import type { FactVerificationResult, FactClaimItem } from "../../types/omni2";
import { factVerificationAPI } from "../../services/apiService";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

interface FactVerificationCardProps {
  verificationResult: FactVerificationResult;
  onClaimReviewed?: (claimId: number, decision: string) => void;
  showReviewControls?: boolean;
}

export const FactVerificationCard: React.FC<FactVerificationCardProps> = ({
  verificationResult,
  onClaimReviewed,
  showReviewControls = true,
}) => {
  const [claims, setClaims] = useState<FactClaimItem[]>(verificationResult.claims || []);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Supported":
        return <Badge variant="success">✅ Supported</Badge>;
      case "Contradicted":
        return <Badge variant="danger">❌ Contradicted</Badge>;
      case "Needs Human Review":
        return <Badge variant="warning">⚠️ Needs Human Review</Badge>;
      case "Insufficient Evidence":
        return <Badge variant="neutral">❓ Insufficient Evidence</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleReview = async (claimId: number, decision: "Approved" | "Rejected") => {
    try {
      setReviewingId(claimId);
      await factVerificationAPI.reviewClaim(claimId, { decision });
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? {
                ...c,
                status: decision === "Approved" ? "Supported" : "Contradicted",
                reviewer_decision: decision,
                requires_human_review: false,
              }
            : c
        )
      );
      if (onClaimReviewed) onClaimReviewed(claimId, decision);
    } catch (err) {
      console.error("Failed to review claim:", err);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h3 className="text-lg font-bold text-gray-900">
              AI Fact Verification & Source Corroboration Engine
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Grounded against official government registries (NDMA, MoHFW, IMD, Official Helplines).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span>Supported:</span>
            <span className="font-bold">{verificationResult.supported_count}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
            <span>Needs Review:</span>
            <span className="font-bold">{verificationResult.needs_review_count}</span>
          </div>
          {verificationResult.contradicted_count > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              <span>Contradicted:</span>
              <span className="font-bold">{verificationResult.contradicted_count}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {claims.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No extracted factual claims detected.</p>
        ) : (
          claims.map((claim, idx) => (
            <div
              key={claim.id || idx}
              className={`p-3.5 rounded-lg border text-sm transition-all ${
                claim.status === "Supported"
                  ? "bg-emerald-50/30 border-emerald-200"
                  : claim.status === "Contradicted"
                  ? "bg-rose-50/40 border-rose-200"
                  : "bg-amber-50/30 border-amber-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {claim.claim_category}
                    </span>
                    {getStatusBadge(claim.status)}
                    <span className="text-xs text-gray-500">
                      Confidence: <strong>{claim.confidence_score}%</strong>
                    </span>
                  </div>

                  <p className="font-medium text-gray-900 leading-relaxed">
                    "{claim.claim_text}"
                  </p>

                  {claim.evidence_summary && (
                    <div className="text-xs text-gray-600 bg-white/80 p-2.5 rounded border border-gray-200 mt-2 space-y-1">
                      <div className="font-semibold text-gray-700 flex items-center gap-1">
                        <span>🏛️ Evidence:</span>
                      </div>
                      <p>{claim.evidence_summary}</p>
                      {claim.source_url && (
                        <a
                          href={claim.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline inline-block text-[11px] pt-1"
                        >
                          Source: {claim.source_name || claim.source_url} ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {showReviewControls && claim.id && claim.requires_human_review && (
                  <div className="flex sm:flex-col gap-1.5 shrink-0 pt-2 sm:pt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 py-1 px-2.5"
                      disabled={reviewingId === claim.id}
                      onClick={() => handleReview(claim.id!, "Approved")}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-300 py-1 px-2.5"
                      disabled={reviewingId === claim.id}
                      onClick={() => handleReview(claim.id!, "Rejected")}
                    >
                      ✗ Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          🔒 Strict Protocol: Emergency, helpline & medical directives require human verification before broadcast.
        </span>
        <span className={`font-semibold ${verificationResult.can_auto_publish ? "text-emerald-600" : "text-amber-600"}`}>
          {verificationResult.can_auto_publish ? "Ready for Approval" : "Human Approval Pending"}
        </span>
      </div>
    </Card>
  );
};
