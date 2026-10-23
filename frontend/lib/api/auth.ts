import { api, tokenStore } from "./client";
import type { ApiResult } from "@/types/api";

// ── Request / Response shapes (from FRONTEND_GUIDE.md) ───

export interface LoginPayload { email: string; password: string }
export interface LoginResponse { message: string; username: string; access: string; refresh: string }

export interface StudentSignupPayload {
  first_name: string;
  last_name: string;
  matric_no: string;
  email: string;
  department_id: number;
  programme: "SWEP" | "SIWES";
  password: string;
}
export interface SignupInitResponse { message: string; email: string }

export interface VerifyOtpPayload  { email: string; otp: string }
export interface ResendOtpPayload  { email: string }

export interface ForgotPasswordPayload { email: string }
export interface ResetPasswordPayload  { email: string; token: string; password: string }

export interface ValidateInviteResponse {
  email: string; department: string; programme: string; expires_at: string;
}
export interface AcceptInvitePayload {
  token: string; first_name: string; last_name: string; phone: string; password: string;
}
export interface AcceptInviteResponse { access: string; refresh: string }

export interface Department { id: number; name: string }

export interface StudentProfileData {
  account: { id: number; email: string; first_name: string; last_name: string };
  matric_no: string;
  department: { id: number; name: string };
  programme: "SWEP" | "SIWES";
  email_verified: boolean;
}

export interface CoordinatorProfileData {
  account: { id: number; email: string; first_name: string; last_name: string };
  department: { id: number; name: string };
  programme: "SWEP" | "SIWES";
  phone: string;
}

export interface InvitationItem {
  id: number;
  email: string;
  department: string;
  programme: "SWEP" | "SIWES";
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expires_at: string;
}

export interface CreateInvitationPayload {
  email: string;
  department_id: number;
  programme: "SWEP" | "SIWES";
}

// ── Paths ────────────────────────────────────────────────
const P = {
  login:              "/auth/login/",
  adminLogin:         "/auth/admin/login/",
  logout:             "/auth/logout/",
  refresh:            "/auth/refresh/",
  studentSignup:      "/auth/student/signup/",
  verifyOtp:          "/auth/student/verify-otp/",
  resendOtp:          "/auth/student/resend-otp/",
  forgotPassword:     "/auth/forgot-password/",
  resetPassword:      "/auth/reset-password/",
  validateInvite:     "/invitations/validate/",
  acceptInvite:       "/invitations/accept/",
  departments:        "/departments/",
  studentProfile:     "/me/student-profile/",
  coordinatorProfile: "/me/coordinator-profile/",
  adminInvitations:   "/admin/invitations/",
} as const;

// ── Auth API ─────────────────────────────────────────────
export const authApi = {
  /** Students + coordinators sign in. Stores tokens on success. */
  login: async (data: LoginPayload): Promise<ApiResult<LoginResponse>> => {
    const res = await api.post<LoginResponse>(P.login, data, { public: true });
    if (res.ok) tokenStore.set(res.data.access, res.data.refresh);
    return res;
  },

  /** Admin-only sign in. Stores tokens on success. */
  adminLogin: async (data: LoginPayload): Promise<ApiResult<LoginResponse>> => {
    const res = await api.post<LoginResponse>(P.adminLogin, data, { public: true });
    if (res.ok) tokenStore.set(res.data.access, res.data.refresh);
    return res;
  },

  /** Send refresh + blacklist old token, clear storage on failure. */
  logout: async (): Promise<ApiResult<void>> => {
    const refresh = tokenStore.getRefresh();
    const res = await api.post<void>(P.logout, { refresh });
    tokenStore.clear();
    return res;
  },

  /** Rotate tokens. Replace both on success. */
  refresh: async (): Promise<ApiResult<{ access: string; refresh: string }>> => {
    const res = await api.post<{ access: string; refresh: string }>(
      P.refresh,
      { refresh: tokenStore.getRefresh() },
      { public: true },
    );
    if (res.ok) tokenStore.set(res.data.access, res.data.refresh);
    return res;
  },

  /** Step 1 of signup — triggers OTP email. */
  studentSignup: (data: StudentSignupPayload): Promise<ApiResult<SignupInitResponse>> =>
    api.post(P.studentSignup, data, { public: true }),

  /** Step 2 — verify the 6-digit OTP. After success, direct user to /login. */
  verifyOtp: (data: VerifyOtpPayload): Promise<ApiResult<{ message: string }>> =>
    api.post(P.verifyOtp, data, { public: true }),

  /** Resend OTP — always returns a neutral success message. */
  resendOtp: (data: ResendOtpPayload): Promise<ApiResult<{ message: string }>> =>
    api.post(P.resendOtp, data, { public: true }),

  /** Always returns a generic success (prevents email enumeration). */
  forgotPassword: (data: ForgotPasswordPayload): Promise<ApiResult<{ message: string }>> =>
    api.post(P.forgotPassword, data, { public: true }),

  /** Takes email + token from the reset link + new password. */
  resetPassword: (data: ResetPasswordPayload): Promise<ApiResult<{ message: string }>> =>
    api.post(P.resetPassword, data, { public: true }),

  /** Validate an invitation token before showing the accept form. */
  validateInvite: (token: string): Promise<ApiResult<ValidateInviteResponse>> =>
    api.get(`${P.validateInvite}?token=${encodeURIComponent(token)}`, { public: true }),

  /** Accept coordinator invitation. Stores tokens on success. */
  acceptInvite: async (data: AcceptInvitePayload): Promise<ApiResult<AcceptInviteResponse>> => {
    const res = await api.post<AcceptInviteResponse>(P.acceptInvite, data, { public: true });
    if (res.ok) tokenStore.set(res.data.access, res.data.refresh);
    return res;
  },

  /** Fetch department list for the signup form. */
  departments: (): Promise<ApiResult<Department[]>> =>
    api.get(P.departments, { public: true }),

  /** Get authenticated student profile (returns 404 if not a student). */
  studentProfile: (): Promise<ApiResult<{ message: string; profile: StudentProfileData }>> =>
    api.get(P.studentProfile),

  /** Get authenticated coordinator profile (returns 404 if not a coordinator). */
  coordinatorProfile: (): Promise<ApiResult<{ message: string; profile: CoordinatorProfileData }>> =>
    api.get(P.coordinatorProfile),

  /** Admin: List coordinator invitations. */
  listInvitations: (): Promise<ApiResult<{ server_time: string; results: InvitationItem[] }>> =>
    api.get(P.adminInvitations),

  /** Admin: Create and send a new coordinator invitation. */
  createInvitation: (data: CreateInvitationPayload): Promise<ApiResult<{ server_time: string; id: number; status: string }>> =>
    api.post(P.adminInvitations, data),

  /** Admin: Resend an invitation email. */
  resendInvitation: (id: number): Promise<ApiResult<{ server_time: string; message: string }>> =>
    api.post(`${P.adminInvitations}${id}/resend/`, {}),

  /** Admin: Revoke a pending invitation. */
  revokeInvitation: (id: number): Promise<ApiResult<{ server_time: string; message: string }>> =>
    api.delete(`${P.adminInvitations}${id}/`),
};

