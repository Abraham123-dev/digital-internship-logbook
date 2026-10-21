export type Role = "student" | "coordinator" | "admin";

export type Programme = "SWEP" | "SIWES";

export type AccountStatus = "active" | "deactivated" | "withdrawn" | "rusticated";

export interface User {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  department: string;
  accountStatus: AccountStatus;
}

export interface StudentUser extends User {
  role: "student";
  matricNumber: string;
  programme: Programme;
  /** null when no cohort has been configured for this student's department yet. */
  cohortId: string | null;
}

export interface CoordinatorUser extends User {
  role: "coordinator";
  cohortId: string | null;
}

export interface AdminUser extends User {
  role: "admin";
}

export type AnyUser = StudentUser | CoordinatorUser | AdminUser;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AnyUser;
}

export interface SignupRequest {
  fullName: string;
  matricNumber: string;
  email: string;
  department: string;
  programme: Programme;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AcceptInviteRequest {
  token: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}
