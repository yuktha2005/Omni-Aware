import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import type { LoginRequest } from "../../types/auth";
import { ShieldCheckIcon, GlobeIcon, RadioIcon } from "../../components/ui/Icons";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast, showToast } = useToast();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("TestPassword123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleFillDemo = () => {
    setEmail("admin@example.com");
    setPassword("TestPassword123!");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Dynamic ambient radial lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(6,182,212,0.1),transparent)]" />

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-classic lg:grid-cols-12">
        {/* Left Col: Executive Brand & Security Pane (5 cols) */}
        <div className="relative hidden bg-gradient-to-br from-[#070c18] via-[#0d162f] to-[#070c18] p-8 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-900/50 ring-1 ring-white/20">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                  <path d="M12 2a10 10 0 0 1 10 10h-10V2z" fill="currentColor" fillOpacity={0.25} />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-400">
                  Government & Enterprise
                </p>
                <h1 className="font-display text-base font-extrabold text-white tracking-tight">
                  OmniAware <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
                </h1>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                National Broadcast Platform
              </span>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-white leading-snug">
                Multilingual Mass Communication Cloud
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Centralized broadcast orchestration across SMS, WhatsApp, Regional Voice IVR, and Mass Email with verified citizen delivery telemetry.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-3.5 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/30">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="font-medium">RBAC Security & Immutable Audit Logs</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/10 border border-brand-500/30">
                <GlobeIcon className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <span className="font-medium">22 Official Languages with Contextual AI</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/30">
                <RadioIcon className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="font-medium">TRAI DLT Verified High-Throughput Relays</span>
            </div>
          </div>
        </div>

        {/* Right Col: Sign-in Form (7 cols) */}
        <div className="p-8 sm:p-10 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Identity & Access Governance
              </span>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900">
                Sign In to Console
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Enter your administrative credentials to access operational broadcast channels.
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
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    Load Demo Credentials
                  </button>
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

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full py-2.5 mt-2"
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
                    Authenticating Session...
                  </span>
                ) : (
                  "Authenticate & Sign In"
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Enterprise SLA 99.98%</span>
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
