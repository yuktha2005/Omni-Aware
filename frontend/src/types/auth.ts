export type UserRole = "admin" | "campaign_manager" | "communication_team";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  organization?: string;
}

export interface Admin {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  organization?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: Admin;
}

export interface UpdateRoleRequest {
  role: UserRole;
  is_active?: boolean;
}
