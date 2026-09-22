import { useState, useMemo } from "react";
import type { MessageTemplate } from "../../types/template";
import { SUPPORTED_LANGUAGES, templateService } from "../../services/templateService";

interface TemplateSimulatorModalProps {
  template: MessageTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_RECIPIENTS = [
  {
    name: "Manoj Prasad",
    city: "Madurai",
    state: "Tamil Nadu",
    date: "15-Sep-2026",
    helpline: "1800-11-2026",
    scheme_name: "PM Kisan Samman Nidhi",
    center_name: "Urban PHC Anna Nagar",
  },
  {
    name: "Deepa Menon",
    city: "Bengaluru",
    state: "Karnataka",
    date: "18-Sep-2026",
    helpline: "112 / 1077",
    scheme_name: "National Health Mission",
    center_name: "Jayanagar General Hospital",
  },
  {
    name: "Suresh Singh",
    city: "Kochi",
    state: "Kerala",
    date: "20-Sep-2026",
    helpline: "1070 (Disaster Control)",
    scheme_name: "Pradhan Mantri Awas Yojana",
    center_name: "Civil Station Relief Hub",
  },
];

const TemplateSimulatorModal = ({
  template,
  isOpen,
  onClose,
}: TemplateSimulatorModalProps) => {
  if (!isOpen || !template) return null;

  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({
    recipient_name: "Manoj Prasad",
    city: "Madurai",
    state: "Tamil Nadu",
    date: "15-Sep-2026",
    helpline: "1800-11-2026",
    scheme_name: "PM Welfare Initiative",
    center_name: "Primary Health Center #4",
  });

  // Extract variables present in this template
  const activeVariables = useMemo(() => {
    return template.variables && template.variables.length > 0
      ? template.variables
      : templateService.extractVariables(template.translations["en"]?.content || "");
  }, [template]);

  const activeTranslation = useMemo(() => {
    return (
      template.translations[selectedLang] ||
      template.translations["en"] || {
        languageCode: selectedLang,
        languageName: "English",
        content: "No translation available for this language.",
      }
    );
  }, [template, selectedLang]);

  const interpolatedContent = useMemo(() => {
    return templateService.interpolate(activeTranslation.content, testVariables);
  }, [activeTranslation, testVariables]);

  const interpolatedSubject = useMemo(() => {
    if (!activeTranslation.subject) return "";
    return templateService.interpolate(activeTranslation.subject, testVariables);
  }, [activeTranslation, testVariables]);

  const handleApplySampleRecipient = (sampleIndex: number) => {
    const sample = SAMPLE_RECIPIENTS[sampleIndex];
    setTestVariables({
      recipient_name: sample.name,
      city: sample.city,
      state: sample.state,
      date: sample.date,
      helpline: sample.helpline,
      scheme_name: sample.scheme_name,
      center_name: sample.center_name,
    });
  };

  const handleSimulateVoice = () => {
    if ("speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(interpolatedContent);
        utterance.rate = speechRate;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const smsCharacterCount = interpolatedContent.length;
  const smsSegments = Math.max(1, Math.ceil(smsCharacterCount / 160));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{template.title}</h2>
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">
                  {template.code}
                </span>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-sky-800">
                  {template.channel}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Interactive Multi-Device Broadcast Simulator with Live Variable Injection
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body: Split into Controls & Device Preview */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Left Column: Language selector & Test Variable Controls */}
          <div className="flex flex-col border-b border-slate-200 p-6 lg:col-span-5 lg:border-b-0 lg:border-r">
            {/* Language Switcher */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Broadcast Language
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const hasTranslation = Boolean(template.translations[lang.code]);
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLang(lang.code)}
                      className={`relative flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                        isSelected
                          ? "border-sky-500 bg-sky-50/80 text-sky-800 shadow-sm ring-2 ring-sky-300"
                          : hasTranslation
                          ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          : "border-dashed border-slate-200 bg-slate-50 text-slate-400 opacity-60"
                      }`}
                    >
                      <span className="text-xs font-bold">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-500">{lang.name}</span>
                      {hasTranslation && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Fill With Sample Recipient
                </label>
                <span className="text-[11px] text-sky-600 font-medium">Quick Test</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_RECIPIENTS.map((rec, i) => (
                  <button
                    key={rec.name}
                    onClick={() => handleApplySampleRecipient(i)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:border-sky-400 hover:bg-sky-50 transition"
                  >
                    👤 {rec.name} ({rec.city})
                  </button>
                ))}
              </div>
            </div>

            {/* Variable Inputs */}
            <div className="flex-1 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Dynamic Recipient Variables ({activeVariables.length})
              </label>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {activeVariables.map((variableKey) => (
                  <div key={variableKey} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-semibold text-sky-700">
                        {`{{${variableKey}}}`}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={testVariables[variableKey] || ""}
                      onChange={(e) =>
                        setTestVariables((prev) => ({
                          ...prev,
                          [variableKey]: e.target.value,
                        }))
                      }
                      placeholder={`Value for ${variableKey}`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Metrics / Summary */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Message Character Count:</span>
                <span className="font-bold text-slate-900">{smsCharacterCount} chars</span>
              </div>
              {template.channel === "sms" && (
                <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                  <span>Estimated SMS Segments:</span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 font-bold text-sky-800">
                    {smsSegments} Segment{smsSegments > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                <span>Target Language:</span>
                <span className="font-bold text-slate-800">
                  {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.name} ({selectedLang.toUpperCase()})
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Device Screen Simulator */}
          <div className="flex flex-col items-center justify-center bg-slate-100/70 p-6 lg:col-span-7">
            {/* Phone Shell */}
            <div className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-[40px] border-[8px] border-slate-800 bg-white shadow-2xl ring-1 ring-slate-900/10">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 z-20 h-5 w-36 -translate-x-1/2 rounded-b-2xl bg-slate-800">
                <div className="absolute top-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-slate-700" />
                <div className="absolute top-1 right-8 h-2 w-2 rounded-full bg-slate-700" />
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between bg-slate-900 px-6 pt-6 pb-2 text-[11px] font-semibold text-white">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="h-2 w-4 rounded-sm border border-white p-0.5">
                    <div className="h-full w-2.5 bg-white" />
                  </div>
                </div>
              </div>

              {/* WHATSAPP SIMULATION */}
              {template.channel === "whatsapp" && (
                <div className="flex flex-col h-[520px] bg-[#efeae2]">
                  {/* WhatsApp Top Bar */}
                  <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-[#075e54]">
                      Gov
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold leading-none">Public Awareness India</p>
                        <svg className="h-3.5 w-3.5 text-sky-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-[10px] text-emerald-200">Official Mass Outreach</p>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="mx-auto rounded-lg bg-emerald-100/90 px-2.5 py-1 text-center text-[10px] text-emerald-900 shadow-xs">
                      🔒 Official Broadcast: End-to-end verified
                    </div>
                    <div className="max-w-[88%] rounded-2xl rounded-tl-none bg-white p-3.5 shadow-sm">
                      <p className="whitespace-pre-wrap text-xs text-slate-800 leading-relaxed font-sans">
                        {interpolatedContent}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                        <span>09:42 AM</span>
                        <svg className="h-3.5 w-3.5 text-sky-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS SIMULATION */}
              {template.channel === "sms" && (
                <div className="flex flex-col h-[520px] bg-slate-50">
                  <div className="border-b border-slate-200 bg-white px-4 py-3 text-center shadow-xs">
                    <p className="text-xs font-bold text-slate-800">VK-GOVALERT</p>
                    <p className="text-[10px] text-slate-400">Government Broadcast Service</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="mx-auto text-center text-[10px] text-slate-400">Today 9:41 AM</div>
                    <div className="max-w-[90%] rounded-2xl rounded-tl-none bg-sky-600 p-3.5 text-white shadow-sm">
                      <p className="whitespace-pre-wrap text-xs leading-relaxed font-sans">
                        {interpolatedContent}
                      </p>
                      <span className="mt-1 block text-right text-[9px] text-sky-200">Delivered</span>
                    </div>
                  </div>
                </div>
              )}

              {/* EMAIL SIMULATION */}
              {template.channel === "email" && (
                <div className="flex flex-col h-[520px] bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-bold text-slate-700">
                      Subject: {interpolatedSubject || template.title}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>From: alerts@gov.awareness.in</span>
                      <span>To: {testVariables.recipient_name || "Beneficiary"}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                      <div className="mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                          GOV
                        </div>
                        <span className="text-xs font-bold text-slate-800">Public Advisory Bureau</span>
                      </div>
                      <p className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-sans">
                        {interpolatedContent}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* VOICE IVR SIMULATION */}
              {template.channel === "voice" && (
                <div className="flex flex-col h-[520px] bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 justify-between">
                  <div className="text-center pt-4">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 ring-4 ring-amber-500/30">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-white">Emergency IVR Caller</p>
                    <p className="text-xs text-amber-300/90 font-mono">1800-GOV-ALERT</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Language: {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.name}
                    </p>
                  </div>

                  {/* Audio Waveform Graphic */}
                  <div className="flex items-center justify-center gap-1.5 py-4">
                    {[40, 65, 30, 85, 95, 50, 70, 90, 45, 60, 80, 35].map((height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isPlayingAudio ? "bg-amber-400 animate-pulse" : "bg-slate-700"
                        }`}
                        style={{ height: isPlayingAudio ? `${height}%` : "16px" }}
                      />
                    ))}
                  </div>

                  {/* Voice Script Teleprompter */}
                  <div className="max-h-36 overflow-y-auto rounded-xl bg-slate-800/80 p-3 text-[11px] text-slate-300 leading-relaxed border border-slate-700/60">
                    <p className="font-semibold text-amber-400 mb-1">Synthesizer Text:</p>
                    <p className="italic">"{interpolatedContent}"</p>
                  </div>

                  {/* Audio Controls */}
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={handleSimulateVoice}
                      className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition shadow-lg ${
                        isPlayingAudio
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                          Stop Playback
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Test Voice Call (TTS)
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Speed:</span>
                      {[0.8, 1, 1.2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setSpeechRate(rate)}
                          className={`rounded px-1.5 py-0.5 ${
                            speechRate === rate ? "bg-slate-700 text-amber-300" : "text-slate-500"
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSimulatorModal;
