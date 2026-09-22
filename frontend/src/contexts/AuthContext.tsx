import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authAPI } from "../services/apiService";
import { setAuthLogoutCallback } from "../services/api";
import type { LoginRequest, RegisterRequest, Admin, UserRole } from "../types/auth";

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
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
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

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_info");
    setToken(null);
    setAdmin(null);
  };

  const login = async (data: LoginRequest): Promise<void> => {
    setLoading(true);
    try {
      const response = await authAPI.login(data);
      const { access_token, user } = response.data;
      localStorage.setItem("access_token", access_token);

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

      localStorage.setItem("admin_info", JSON.stringify(adminInfo));
      setToken(access_token);
      setAdmin(adminInfo);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    setLoading(true);
    try {
      const response = await authAPI.register(data);
      const { access_token, user } = response.data;
      localStorage.setItem("access_token", access_token);

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

      localStorage.setItem("admin_info", JSON.stringify(adminInfo));
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
      localStorage.setItem("admin_info", JSON.stringify(res.data));
    } catch {
      // Ignored if offline
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedAdmin = localStorage.getItem("admin_info");
    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        localStorage.removeItem("admin_info");
      }
    }
    setAuthLogoutCallback(() => {
      setToken(null);
      setAdmin(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_info");
    });
    setLoading(false);
  }, []);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
