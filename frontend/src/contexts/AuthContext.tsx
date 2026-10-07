import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authAPI } from "../services/apiService";
import { setAuthLogoutCallback } from "../services/api";
import type { LoginRequest, RegisterRequest, Admin, UserRole } from "../types/auth";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AuthContextType {
  admin: Admin | null;
  user: Admin | null;
  token: string | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isCampaignManager: boolean;
  isCommunicationTeam: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: (reason?: string) => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  inactivityMessage: string | null;
  clearInactivityMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [inactivityMessage, setInactivityMessage] = useState<string | null>(null);

  const isAuthenticated = !!token;
  const role: UserRole = admin?.role || "communication_team";
  const isAdmin = role === "admin";
  const isCampaignManager = role === "campaign_manager" || isAdmin;
  const isCommunicationTeam = role === "communication_team" || isCampaignManager;

  const hasRole = (roles: UserRole[]): boolean => {
    if (!admin) return false;
    if (admin.role === "admin") return true; // admin can access all
    return roles.includes(admin.role);
  };

  const clearInactivityMessage = () => {
    setInactivityMessage(null);
  };

  const logout = (reason?: string) => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("admin_info");
    sessionStorage.removeItem("last_activity_time");
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_info");
    localStorage.removeItem("last_activity_time");
    setToken(null);
    setAdmin(null);
    if (reason === "inactivity") {
      setInactivityMessage("Your session expired due to 30 minutes of inactivity. Please sign in again.");
    }
  };

  const updateActivityTimestamp = () => {
    const now = Date.now();
    sessionStorage.setItem("last_activity_time", now.toString());
  };

  const login = async (data: LoginRequest): Promise<void> => {
    setLoading(true);
    setInactivityMessage(null);
    try {
      const response = await authAPI.login(data);
      const { access_token, user } = response.data;
      sessionStorage.setItem("access_token", access_token);
      sessionStorage.setItem("last_activity_time", Date.now().toString());
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_info");

      let adminInfo: Admin;
      if (user) {
        adminInfo = user;
      } else {
        const payload = JSON.parse(atob(access_token.split(".")[1]));
        adminInfo = {
          id: parseInt(payload.sub),
          full_name: payload.full_name || "",
          email: payload.email || "",
          role: (payload.role as UserRole) || "admin",
          is_active: true,
        };
      }

      sessionStorage.setItem("admin_info", JSON.stringify(adminInfo));
      setToken(access_token);
      setAdmin(adminInfo);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    setLoading(true);
    setInactivityMessage(null);
    try {
      const response = await authAPI.register(data);
      const { access_token, user } = response.data;
      sessionStorage.setItem("access_token", access_token);
      sessionStorage.setItem("last_activity_time", Date.now().toString());
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_info");

      let adminInfo: Admin;
      if (user) {
        adminInfo = user;
      } else {
        const payload = JSON.parse(atob(access_token.split(".")[1]));
        adminInfo = {
          id: parseInt(payload.sub),
          full_name: payload.full_name || "",
          email: payload.email || "",
          role: (payload.role as UserRole) || data.role,
          is_active: true,
        };
      }

      sessionStorage.setItem("admin_info", JSON.stringify(adminInfo));
      setToken(access_token);
      setAdmin(adminInfo);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!token) return;
    try {
      const res = await authAPI.getMe();
      setAdmin(res.data);
      sessionStorage.setItem("admin_info", JSON.stringify(res.data));
    } catch {
      // Ignored if offline
    }
  };

  // Initial session restoration with 30-minute inactivity check
  useEffect(() => {
    // Clear any lingering localStorage tokens so fresh launches always start at Login
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_info");
    localStorage.removeItem("last_activity_time");

    const storedToken = sessionStorage.getItem("access_token");
    const storedAdmin = sessionStorage.getItem("admin_info");
    const storedLastActivity = sessionStorage.getItem("last_activity_time");

    if (storedToken && storedAdmin) {
      const lastActiveTime = storedLastActivity ? parseInt(storedLastActivity, 10) : 0;
      const now = Date.now();

      // Check if session has been inactive for > 30 mins
      if (lastActiveTime && now - lastActiveTime > INACTIVITY_TIMEOUT_MS) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("admin_info");
        sessionStorage.removeItem("last_activity_time");
        setInactivityMessage("Your session expired due to 30 minutes of inactivity. Please sign in again.");
      } else {
        try {
          setToken(storedToken);
          setAdmin(JSON.parse(storedAdmin));
          sessionStorage.setItem("last_activity_time", now.toString());
        } catch {
          sessionStorage.removeItem("admin_info");
        }
      }
    }

    setAuthLogoutCallback(() => {
      setToken(null);
      setAdmin(null);
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("admin_info");
      sessionStorage.removeItem("last_activity_time");
    });
    setLoading(false);
  }, []);

  // Continuous 30-minute idle activity tracker while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleUserActivity = () => {
      if (!throttleTimer) {
        updateActivityTimestamp();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 5000); // Throttled every 5 seconds
      }
    };

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "wheel"
    ];

    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    // Check every 10 seconds if 30 minutes of inactivity has elapsed
    const checkInterval = setInterval(() => {
      const storedLastActive =
        sessionStorage.getItem("last_activity_time") ||
        localStorage.getItem("last_activity_time");
      if (storedLastActive) {
        const lastActiveTime = parseInt(storedLastActive, 10);
        const idleDuration = Date.now() - lastActiveTime;

        if (idleDuration >= INACTIVITY_TIMEOUT_MS) {
          logout("inactivity");
        }
      }
    }, 10000);

    return () => {
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      clearInterval(checkInterval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        user: admin,
        token,
        loading,
        role,
        isAdmin,
        isCampaignManager,
        isCommunicationTeam,
        hasRole,
        login,
        register,
        logout,
        isAuthenticated,
        refreshUser,
        inactivityMessage,
        clearInactivityMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
