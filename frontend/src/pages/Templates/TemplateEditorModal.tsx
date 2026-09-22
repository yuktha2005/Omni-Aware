import { useState, useEffect } from "react";
import type {
  MessageTemplate,
  ChannelType,
  TemplateCategory,
  MultilingualTranslation,
} from "../../types/template";
import {
  SUPPORTED_LANGUAGES,
  templateService,
} from "../../services/templateService";

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: MessageTemplate) => void;
  initialTemplate?: MessageTemplate | null;
}

const COMMON_VARIABLES = [
  "recipient_name",
  "city",
  "state",
  "date",
  "helpline",
  "scheme_name",
  "center_name",
];

const TemplateEditorModal = ({
  isOpen,
  onClose,
  onSave,
  initialTemplate,
}: TemplateEditorModalProps) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<ChannelType>("sms");
  const [category, setCategory] = useState<TemplateCategory>("health");
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");
  const [activeLangTab, setActiveLangTab] = useState<string>("en");
  const [translations, setTranslations] = useState<Record<string, MultilingualTranslation>>({
    en: { languageCode: "en", languageName: "English", content: "" },
  });
  const [emailSubject, setEmailSubject] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialTemplate) {
      setTitle(initialTemplate.title);
      setCode(initialTemplate.code);
      setDescription(initialTemplate.description);
      setChannel(initialTemplate.channel);
      setCategory(initialTemplate.category);
      setStatus(initialTemplate.status);
      setTranslations(initialTemplate.translations);
      setEmailSubject(initialTemplate.translations["en"]?.subject || "");
    } else {
      const randomCode = `TMPL-${category.slice(0, 4).toUpperCase()}-${Math.floor(
        100 + Math.random() * 900
      )}`;
      setTitle("");
      setCode(randomCode);
      setDescription("");
      setChannel("sms");
      setCategory("health");
      setStatus("active");
      setTranslations({
        en: { languageCode: "en", languageName: "English", content: "" },
      });
      setEmailSubject("");
    }
    setActiveLangTab("en");
    setErrorMessage("");
  }, [initialTemplate, isOpen]);

  const handleInsertVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    const currentContent = translations[activeLangTab]?.content || "";
    setTranslations((prev) => ({
      ...prev,
      [activeLangTab]: {
        ...(prev[activeLangTab] || {
          languageCode: activeLangTab,
          languageName:
            SUPPORTED_LANGUAGES.find((l) => l.code === activeLangTab)?.name || "English",
        }),
        content: currentContent + (currentContent.endsWith(" ") ? "" : " ") + placeholder + " ",
      },
    }));
  };

  const handleContentChange = (newContent: string) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLangTab]: {
        ...(prev[activeLangTab] || {
          languageCode: activeLangTab,
          languageName:
            SUPPORTED_LANGUAGES.find((l) => l.code === activeLangTab)?.name || "English",
        }),
        content: newContent,
      },
    }));
  };

  const handleAITranslateAll = () => {
    const baseText = translations["en"]?.content;
    if (!baseText || baseText.trim().length === 0) {
      setErrorMessage("Please enter English base message content first.");
      return;
    }

    setIsTranslating(true);
    setErrorMessage("");

    setTimeout(() => {
      const updatedTranslations = { ...translations };
      for (const lang of SUPPORTED_LANGUAGES) {
        if (lang.code !== "en") {
          updatedTranslations[lang.code] = {
            languageCode: lang.code,
            languageName: lang.name,
            content: templateService.generateAIPlaceholderTranslations(baseText, lang.code),
            subject: emailSubject ? `[${lang.name}] ${emailSubject}` : undefined,
            isVerified: true,
          };
        }
      }
      setTranslations(updatedTranslations);
      setIsTranslating(false);
    }, 450);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please specify a template title.");
      return;
    }
    if (!code.trim()) {
      setErrorMessage("Please provide a template code identifier.");
      return;
    }
    const baseContent = translations["en"]?.content?.trim();
    if (!baseContent) {
      setErrorMessage("Base English message content cannot be empty.");
      return;
    }

    // Extract all dynamic variables used across all translations
    const allVars = new Set<string>();
    Object.values(translations).forEach((t) => {
      templateService.extractVariables(t.content).forEach((v) => allVars.add(v));
    });

    const finalTranslations = { ...translations };
    if (channel === "email" && emailSubject) {
      if (finalTranslations["en"]) {
        finalTranslations["en"].subject = emailSubject;
      }
    }

    const templateToSave: MessageTemplate = {
      id: initialTemplate?.id || `tmpl-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      channel,
      category,
      primaryLanguage: "en",
      variables: Array.from(allVars),
      translations: finalTranslations,
      status,
      createdAt: initialTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: initialTemplate?.usageCount || 0,
    };

    onSave(templateToSave);
    onClose();
  };

  const currentTabContent = translations[activeLangTab]?.content || "";
  const currentCharCount = currentTabContent.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialTemplate ? "Edit Message Template" : "Create New Multilingual Template"}
            </h2>
            <p className="text-xs text-slate-500">
              Configure broadcast message parameters, recipient placeholders, and localized copy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Template Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Pulse Polio Immunization Day Notice"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Template Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. TMPL-HLTH-001"
                required
                className="w-full font-mono rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "draft" | "archived")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="active">Active (Broadcast Ready)</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Channel & Category Selector */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Communication Channel
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "sms", label: "SMS", icon: "💬" },
                  { id: "whatsapp", label: "WhatsApp", icon: "📱" },
                  { id: "email", label: "Email", icon: "✉️" },
                  { id: "voice", label: "Voice IVR", icon: "🎙️" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id as ChannelType)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition text-xs font-semibold ${
                      channel === c.id
                        ? "border-sky-600 bg-sky-50 text-sky-700 shadow-sm ring-2 ring-sky-200"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base mb-0.5">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "health", label: "Public Health" },
                  { id: "disaster", label: "Disaster Alert" },
                  { id: "civic", label: "Civic Advisory" },
                  { id: "welfare", label: "Welfare (DBT)" },
                  { id: "agriculture", label: "Agriculture" },
                  { id: "education", label: "Education" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as TemplateCategory)}
                    className={`rounded-xl border px-2.5 py-2 text-center text-xs font-semibold transition ${
                      category === cat.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-200"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Internal Notes / Campaign Purpose
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sent before immunization drives to notify parents in targeted districts"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-700 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Email Subject line (if channel is email) */}
          {channel === "email" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Subject Line (English)
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Important Notice: Upcoming DBT Disbursement for {{scheme_name}}"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
          )}

          {/* Variable Insertion Toolbar */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
                ⚡ Quick Insert Dynamic Variables:
              </span>
              <span className="text-[11px] text-slate-500">
                Click a tag to insert into current message text
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVariable(v)}
                  className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-mono font-semibold text-sky-700 shadow-xs hover:border-sky-400 hover:bg-sky-50 transition"
                >
                  + &#123;&#123;{v}&#125;&#125;
                </button>
              ))}
            </div>
          </div>

          {/* Multilingual Translation Tabs & AI Trigger */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Multilingual Message Editor
              </label>
              <button
                type="button"
                onClick={handleAITranslateAll}
                disabled={isTranslating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-indigo-700 hover:to-sky-700 transition disabled:opacity-60"
              >
                {isTranslating ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Synthesizing Translations...
                  </>
                ) : (
                  <>
                    <span>✨ AI Generate All Regional Translations</span>
                  </>
                )}
              </button>
            </div>

            {/* Language Selector Bar */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = activeLangTab === lang.code;
                const hasText = Boolean(translations[lang.code]?.content?.trim());
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveLangTab(lang.code)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-sky-600 text-white shadow-xs"
                        : hasText
                        ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className={`text-[10px] ${isActive ? "text-sky-200" : "text-slate-400"}`}>
                      ({lang.code.toUpperCase()})
                    </span>
                    {hasText && (
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-emerald-500"}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Message Body Editor for Active Tab */}
            <div>
              <div className="flex items-center justify-between mb-1 text-xs text-slate-500">
                <span>
                  Editing:{" "}
                  <strong className="text-slate-800">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === activeLangTab)?.name} (
                    {SUPPORTED_LANGUAGES.find((l) => l.code === activeLangTab)?.nativeName})
                  </strong>
                </span>
                <span>
                  {currentCharCount} characters
                  {channel === "sms" && (
                    <span className="ml-1 text-slate-400">
                      ({Math.max(1, Math.ceil(currentCharCount / 160))} SMS segment)
                    </span>
                  )}
                </span>
              </div>
              <textarea
                rows={5}
                value={currentTabContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={
                  activeLangTab === "en"
                    ? "Type your base message in English. Use variables like {{recipient_name}}, {{city}}, {{date}}..."
                    : `Enter localized message in ${
                        SUPPORTED_LANGUAGES.find((l) => l.code === activeLangTab)?.name
                      }...`
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sky-700 transition"
            >
              {initialTemplate ? "Update Template" : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateEditorModal;
