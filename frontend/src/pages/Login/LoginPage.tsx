import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import type { LoginRequest } from "../../types/auth";
import { ShieldCheckIcon, GlobeIcon, RadioIcon } from "../../components/ui/Icons";
import AnimatedTranslationScene from "../../components/auth/AnimatedTranslationScene";

const TRANSLATION_DEMO_PHRASES = [
  {
    lang: "English",
    code: "EN",
    title: "Flood Evacuation Alert",
    body: "River water levels have reached safety threshold. Move immediately to high-ground relief centers.",
    score: "99.2% BLEU",
  },
  {
    lang: "हिन्दी (Hindi)",
    code: "HI",
    title: "बाढ़ राहत एवं निकासी चेतावनी",
    body: "नदी का जलस्तर खतरे के निशान को पार कर चुका है। कृपया तुरंत उच्च भूमि पर बने राहत शिविरों में जाएं।",
    score: "98.9% BLEU",
  },
  {
    lang: "தமிழ் (Tamil)",
    code: "TA",
    title: "வெள்ளப் பெருக்கு அவசர எச்சரிக்கை",
    body: "ஆற்றின் நீர்மட்டம் அபாய அளவைத் தாண்டியுள்ளது. உடனடியாக பாதுகாப்பான நிவாரண முகாம்களுக்குச் செல்லவும்.",
    score: "98.5% BLEU",
  },
  {
    lang: "తెలుగు (Telugu)",
    code: "TE",
    title: "వరద ముంపు హెచ్చరిక & సురక్షిత తరలింపు",
    body: "నది నీటిమట్టం ప్రమాదకర స్థాయికి చేరింది. తక్షణమే సమీపంలోని సహాయక పునరావాస కేంద్రాలకు వెళ్లండి.",
    score: "99.1% BLEU",
  },
  {
    lang: "বাংলা (Bengali)",
    code: "BN",
    title: "বন্যা সতর্কতা ও নিরাপদ স্থানান্তরণ",
    body: "নদীর জলস্তর বিপদসীমা অতিক্রম করেছে। অনুগ্রহ করে অবিলম্বে নিকটস্থ ত্রাণ কেন্দ্রে আশ্রয় নিন।",
    score: "98.7% BLEU",
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast, showToast } = useToast();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("TestPassword123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Live Multilingual Translation Switcher in Brand Card
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTranslating(true);
      setTimeout(() => {
        setPhraseIdx((prev) => (prev + 1) % TRANSLATION_DEMO_PHRASES.length);
        setIsTranslating(false);
      }, 400);
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const activePhrase = TRANSLATION_DEMO_PHRASES[phraseIdx];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data: LoginRequest = { email, password };

    try {
      await login(data);
      showToast("success", "Authentication verified. Access granted.");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Invalid credentials. Please verify your email and password.";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("TestPassword123!");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-slate-950">
      {/* Animated Multilingual Translation Background Scene */}
      <AnimatedTranslationScene />

      {/* Main Glassmorphic Login Container */}
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80 shadow-[0_20px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl lg:grid-cols-12">
        {/* Left Col: Executive Brand & Live Translation Telemetry (5 cols) */}
        <div className="relative hidden bg-gradient-to-br from-[#060c1d] via-[#0b1531] to-[#050914] p-8 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between border-r border-slate-800/80">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/30">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                  <path d="M12 2a10 10 0 0 1 10 10h-10V2z" fill="currentColor" fillOpacity={0.25} />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-cyan-400">
                  Gov-Cloud • Mass Aware
                </p>
                <h1 className="font-display text-lg font-extrabold text-white tracking-tight">
                  OmniAware <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">AI 2.0</span>
                </h1>
              </div>
            </div>

            {/* Title & Purpose */}
            <div className="mt-8 space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                Live Multilingual AI Pipeline
              </span>
              <h2 className="font-display text-2xl font-black tracking-tight text-white leading-tight">
                AI-Powered Public Awareness & Broadcast Platform
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Centralized national orchestration across SMS, WhatsApp, Regional Voice IVR, and Web Push with real-time fact-checking and translation quality validation.
              </p>
            </div>

            {/* Live Simulated Translation Radar Box */}
            <div className="mt-6 rounded-2xl border border-indigo-500/30 bg-slate-950/70 p-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs">
                    🔄
                  </span>
                  <span className="text-[11px] font-bold text-indigo-300">
                    Live Neural Translation
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                    {activePhrase.score}
                  </span>
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                    {activePhrase.code}
                  </span>
                </div>
              </div>

              <div className={`mt-3 space-y-1.5 transition-all duration-300 ${isTranslating ? "opacity-30 scale-95" : "opacity-100 scale-100"}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {activePhrase.lang}
                </p>
                <h4 className="text-xs font-extrabold text-white">
                  {activePhrase.title}
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  "{activePhrase.body}"
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Fact-Checked & Grounded
                </span>
                <span className="font-mono text-cyan-400">22 Languages Ready</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Credentials Summary */}
          <div className="mt-6 space-y-2.5 border-t border-slate-800/80 pt-5">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Role-Based Governance (Admin • Manager • Comm Team)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <GlobeIcon className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Automated BLEU / Semantic Quality Evaluator</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <RadioIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Multi-Channel Broadcast Engine with Geofencing</span>
            </div>
          </div>
        </div>

        {/* Right Col: Sign-in Form (7 cols) */}
        <div className="p-8 sm:p-10 lg:col-span-7 flex flex-col justify-between bg-white/95 backdrop-blur-md">
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                  Console Access Gate
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  System Online
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-slate-900">
                Sign In to Platform
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Access your multilingual awareness console, campaign approvals, and broadcast channels.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="field-input"
                  placeholder="name@agency.gov.in"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="field-input"
                  placeholder="••••••••••••"
                />
              </div>

              {/* Quick Role Fill Buttons for Demonstration */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Quick Load Demo Credentials:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemo("admin@example.com")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      email === "admin@example.com"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    👑 Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo("manager@example.com")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      email === "manager@example.com"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🎯 Campaign Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo("commteam@example.com")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      email === "commteam@example.com"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ✍️ Comm Team
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full py-3 mt-1 text-sm font-bold tracking-wide"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating Security Session...
                  </span>
                ) : (
                  "Authenticate & Sign In →"
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Enterprise SLA 99.98% • SHA-256 Encrypted</span>
            <Link
              to="/register"
              className="font-bold text-brand-600 hover:text-brand-800 transition-colors"
            >
              Request Access →
            </Link>
          </div>
        </div>
      </div>

      <ToastManager toast={toast} />
    </div>
  );
};

export default LoginPage;
