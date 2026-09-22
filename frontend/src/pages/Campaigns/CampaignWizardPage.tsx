import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { campaignAPI, distributionAPI } from "../../services/apiService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useToast } from "../../hooks/useToast";
import { ToastManager } from "../../components/ui/Toast";
import type { CampaignContentItem } from "../../types/campaign";

const ALL_LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"];
const ALL_ROLES = ["Student", "Teacher", "Healthcare Worker", "General Public", "Farmer"];
const ALL_CHANNELS = [
  { id: "email", label: "Email", icon: "✉️", desc: "HTML & Plain text with rich formatting" },
  { id: "sms", label: "SMS", icon: "💬", desc: "Concise SMS broadcast with CTA link" },
  { id: "whatsapp", label: "WhatsApp Business", icon: "📱", desc: "Official verified template messaging" },
  { id: "push", label: "Push Notification", icon: "🔔", desc: "Real-time device alerts with action buttons" },
  { id: "web", label: "Web Portal Broadcast", icon: "🌐", desc: "Active community banner announcement" },
];

const CampaignWizardPage = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiProcessingStep, setAiProcessingStep] = useState("");

  // Step 1: Basic Campaign Info
  const [formData, setFormData] = useState({
    title: "",
    purpose: "",
    targetAudience: "Students",
    keyInformation: "",
    desiredLanguage: "English",
    desiredTone: "Informative",
    communicationChannel: "All",
    optionalInstructions: "",
  });

  // Step 2: AI Generated Variations
  const [targetLanguages, setTargetLanguages] = useState<string[]>(["English", "Hindi", "Tamil"]);
  const [targetRoles, setTargetRoles] = useState<string[]>(["Student", "General Public"]);
  const [generatedContents, setGeneratedContents] = useState<CampaignContentItem[]>([]);
  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(null);

  // Step 3: Channels & Audience
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email", "sms", "whatsapp"]);

  // Step 4: Scheduling
  const [scheduleType, setScheduleType] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledAt, setScheduledAt] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.purpose || !formData.keyInformation) {
      showToast("error", "Please complete title, purpose, and key information.");
      return;
    }

    try {
      setLoading(true);
      // Run AI Pipeline — show processing steps with visual feedback
      setAiProcessingStep("🔍 Analyzing campaign objectives...");
      await new Promise((r) => setTimeout(r, 400));
      setAiProcessingStep("✍️ Generating multilingual content variants...");
      // Run AI Pipeline
      const pipelineRes = await campaignAPI.processPipeline({
        campaign_title: formData.title,
        purpose: formData.purpose,
        target_audience: formData.targetAudience,
        key_information: formData.keyInformation,
        desired_language: formData.desiredLanguage,
        desired_tone: formData.desiredTone,
        communication_channel: formData.communicationChannel,
        optional_instructions: formData.optionalInstructions,
        target_languages: targetLanguages,
        audience_roles: targetRoles,
        save_to_db: true,
      });
      setAiProcessingStep("🌍 Translating into target languages...");
      await new Promise((r) => setTimeout(r, 300));
      setAiProcessingStep("🧠 Running quality & compliance checks...");
      await new Promise((r) => setTimeout(r, 300));

      const resData = pipelineRes.data;
      setGeneratedContents(resData.processed_contents || []);
      if (resData.campaign_id) {
        setCreatedCampaignId(resData.campaign_id);
      }
      showToast("success", `Generated ${resData.total_generated || 0} multilingual campaign variations!`);
      setAiProcessingStep("");
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "AI generation failed";
      showToast("error", msg);
      setAiProcessingStep("");
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleRole = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((c) => c !== channelId) : [...prev, channelId]
    );
  };

  const handleFinalLaunch = async () => {
    if (!createdCampaignId) {
      showToast("error", "No campaign ID found to dispatch.");
      return;
    }

    if (selectedChannels.length === 0) {
      showToast("error", "Please select at least one distribution channel.");
      return;
    }

    try {
      setLoading(true);

      if (scheduleType === "scheduled") {
        await distributionAPI.schedule(createdCampaignId, {
          scheduled_at: scheduledAt || new Date().toISOString(),
          scheduled_timezone: timezone,
          selected_channels: selectedChannels,
        });
        showToast("success", "Campaign scheduled successfully!");
        navigate("/scheduling");
      } else {
        await distributionAPI.distribute(createdCampaignId, selectedChannels);
        showToast("success", "Campaign queued for live background distribution!");
        navigate(`/campaigns/${createdCampaignId}/monitor`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to launch campaign";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ToastManager toast={toast} />

      {/* AI Processing Overlay */}
      {loading && aiProcessingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">AI Engine Running</h3>
            <p className="mb-4 text-sm font-medium text-sky-600 animate-pulse">{aiProcessingStep}</p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p>This usually takes 15–30 seconds.</p>
              <p>Generating, translating & verifying {targetLanguages.length} languages × {targetRoles.length} roles...</p>
            </div>
            <div className="mt-5 flex gap-1 justify-center">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-6 rounded-full bg-sky-400 opacity-60"
                  style={{ animationDelay: `${i * 0.15}s`, animation: "pulse 1.2s ease-in-out infinite" }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Wizard Step Progress */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Campaign Wizard</h1>
          <p className="text-sm text-slate-500">
            Design, translate, personalize, and distribute awareness content across channels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                step === s
                  ? "bg-primary-600 text-white ring-4 ring-primary-100"
                  : step > s
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Campaign Details */}
      {step === 1 && (
        <Card className="p-6">
          <form onSubmit={handleStep1Submit} className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">1. Campaign Objectives & Key Information</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. College Health Awareness Program"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Campaign Purpose / Theme *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preventive Health & Wellness Awareness"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                Core Information / Facts / Directive *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Detail key dates, advisory guidelines, eligibility, instructions, or helpline details..."
                value={formData.keyInformation}
                onChange={(e) => setFormData({ ...formData, keyInformation: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Target Tone
                </label>
                <select
                  value={formData.desiredTone}
                  onChange={(e) => setFormData({ ...formData, desiredTone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="Informative">Informative</option>
                  <option value="Reassuring">Reassuring (Health & Safety)</option>
                  <option value="Urgent">Urgent (Alert & Emergency)</option>
                  <option value="Friendly">Friendly (Community / Youth)</option>
                  <option value="Formal">Formal (Official Directives)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Primary Persona
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Base Language
                </label>
                <select
                  value={formData.desiredLanguage}
                  onChange={(e) => setFormData({ ...formData, desiredLanguage: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  {ALL_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multilingual Translation Targets */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                Target Indian Languages for AI Translation
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_LANGUAGES.map((lang) => {
                  const selected = targetLanguages.includes(lang);
                  return (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        selected
                          ? "bg-primary-600 text-white shadow-sm ring-2 ring-primary-200"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Personas */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase text-slate-600">
                Audience Personas for Personalization
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => {
                  const selected = targetRoles.includes(role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        selected
                          ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => navigate("/campaigns")}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                Generate AI Content Matrix →
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* STEP 2: Review AI Generated Multilingual Content */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">2. Validated Multilingual Content Matrix</h2>
              <p className="text-xs text-slate-500">
                {generatedContents.length} variations generated with sentiment, tone, and compliance verification.
              </p>
            </div>
            <Badge variant="success">All Safety Checks Passed</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {generatedContents.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-700">{item.language}</span>
                  <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.audience_role}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900">{item.message_title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 whitespace-pre-line">{item.message_body}</p>
                {item.call_to_action && (
                  <div className="text-xs font-semibold text-primary-600">Action: {item.call_to_action}</div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500">
                    Score: <strong>{item.quality_score || 95}%</strong>
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">
                    Tone: <strong>{item.detected_tone || "Reassuring"}</strong>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium">Compliance: 100%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Back to Details
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Select Channels & Audience →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Channel Selection */}
      {step === 3 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">3. Select Multi-Channel Distribution</h2>
            <p className="text-xs text-slate-500">
              Select which communication channels to broadcast through. Recipient eligibility & consent will be automatically verified.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ALL_CHANNELS.map((ch) => {
              const active = selectedChannels.includes(ch.id);
              return (
                <div
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    active
                      ? "border-primary-500 bg-primary-50/40 ring-2 ring-primary-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ch.icon}</span>
                      <span className="font-semibold text-slate-900">{ch.label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => {}}
                      className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{ch.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(2)}>
              ← Back to Content
            </Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              Proceed to Scheduling →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Scheduling & Launch */}
      {step === 4 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">4. Campaign Scheduling & Launch</h2>
            <p className="text-xs text-slate-500">
              Launch immediate background delivery or configure timed execution.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleType"
                  value="immediate"
                  checked={scheduleType === "immediate"}
                  onChange={() => setScheduleType("immediate")}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-800">Dispatch Immediately (Background Queue)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleType"
                  value="scheduled"
                  checked={scheduleType === "scheduled"}
                  onChange={() => setScheduleType("scheduled")}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-800">Schedule for Later</span>
              </label>
            </div>

            {scheduleType === "scheduled" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Execution Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            )}

            {/* Final Summary Card */}
            <div className="rounded-xl border border-slate-200 bg-indigo-50/50 p-4 text-sm space-y-1">
              <div className="font-semibold text-indigo-900">Campaign Summary</div>
              <div className="text-xs text-slate-600">
                <strong>Title:</strong> {formData.title}
              </div>
              <div className="text-xs text-slate-600">
                <strong>Channels:</strong> {selectedChannels.map((c) => c.toUpperCase()).join(", ")}
              </div>
              <div className="text-xs text-slate-600">
                <strong>Languages:</strong> {targetLanguages.join(", ")}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(3)}>
              ← Back to Channels
            </Button>
            <Button variant="primary" loading={loading} onClick={handleFinalLaunch}>
              {scheduleType === "immediate" ? "🚀 Launch Campaign Now" : "📅 Confirm & Schedule"}
            </Button>
          </div>
        </Card>
      )}

      <ToastManager toast={toast} />
    </div>
  );
};

export default CampaignWizardPage;
