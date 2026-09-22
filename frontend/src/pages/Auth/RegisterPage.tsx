import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import type { RegisterRequest, UserRole } from "../../types/auth";

const roleCards: Array<{
  role: UserRole;
  title: string;
  badge: string;
  icon: string;
  description: string;
}> = [
  {
    role: "admin",
    title: "Administrator",
    badge: "Full Governance",
    icon: "👑",
    description: "Complete platform control, user governance, master data, imports, and system settings.",
  },
  {
    role: "campaign_manager",
    title: "Campaign Manager",
    badge: "Outreach Lead",
    icon: "🎯",
    description: "Audience segmentation, campaign wizard, multi-channel dispatch, scheduling & monitoring.",
  },
  {
    role: "communication_team",
    title: "Communication Team",
    badge: "Content Specialist",
    icon: "📢",
    description: "Multilingual AI generation across 6 Indian languages, tone reviews, and sentiment analysis.",
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast, showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("communication_team");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      showToast("error", "Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      showToast("error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    const data: RegisterRequest = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      organization: organization.trim() || undefined,
      phone: phone.trim() || undefined,
    };

    try {
      await register(data);
      showToast("success", "Account created successfully! Welcome to the platform.");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Registration failed. Please check your information.";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(135deg,_#f8fbff_0%,_#eef4fb_100%)] p-4 sm:p-6 lg:p-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-md lg:grid-cols-[1fr_1.4fr]">
        
        {/* Left Branding / Overview */}
        <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              Team Onboarding
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Join the Public Awareness
              <span className="mt-2 block text-sky-400">Communication Platform</span>
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              Create an account with role-tailored workflows for Administrators, Campaign Managers, and Multilingual Communication Teams.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="font-semibold text-white">🔒 Role-Based Access Control</p>
              <p className="mt-1 text-slate-400">
                Each role receives specialized toolsets — from governance to mass multi-channel distribution and AI translation engines.
              </p>
            </div>
            <p className="text-center text-slate-500">
              Need help? Contact system administration.
            </p>
          </div>
        </div>

        {/* Right Form */}
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Account Registration
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Create Your Account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select your role and enter your details below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {roleCards.map((rc) => {
                  const isSelected = role === rc.role;
                  return (
                    <button
                      type="button"
                      key={rc.role}
                      onClick={() => setRole(rc.role)}
                      className={`flex flex-col text-left rounded-xl p-3 border transition-all ${
                        isSelected
                          ? "border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{rc.icon}</span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-sky-600" />
                        )}
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-900">{rc.title}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{rc.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="field-input"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="field-input"
                  placeholder="priya@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Department
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="field-input"
                  placeholder="e.g. State Health Bureau"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field-input"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="field-input"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="field-input"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="primary-button w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Complete Registration & Enter Platform"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>

      <ToastManager toast={toast} />
    </div>
  );
};

export default RegisterPage;
