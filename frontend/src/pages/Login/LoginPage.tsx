import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import type { LoginRequest } from "../../types/auth";

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
      showToast("success", "Login successful!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Invalid email or password";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(135deg,_#f8fbff_0%,_#eef4fb_100%)] p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm lg:grid-cols-[1.1fr_1fr]">
        <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              Secure access
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">
              Multilingual
              <span className="mt-2 block text-sky-300">Communication Platform</span>
            </h1>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="font-medium text-white">Operational overview</p>
              <p className="mt-2 text-slate-300">
                Monitor recipient health, audience segments, and public communication workflows in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Admin portal
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue managing outreach programs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field-input"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field-input"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="primary-button w-full">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="-ml-1 mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Need an account?{" "}
            <a href="/register" className="font-semibold text-sky-600 hover:text-sky-700 underline">
              Register Team Member
            </a>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            By signing in, you agree to the platform governance and compliance terms.
          </p>
        </div>
      </div>

      <ToastManager toast={toast} />
    </div>
  );
};

export default LoginPage;
