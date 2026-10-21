import { api } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AcceptInviteRequest,
  AnyUser,
} from "@/types/auth";
import type { ApiResult } from "@/types/api";

// TODO: confirm paths with backend partner.
const P = {
  login:          "/api/auth/login/",
  logout:         "/api/auth/logout/",
  signup:         "/api/auth/signup/",
  me:             "/api/auth/me/",
  forgotPassword: "/api/auth/forgot-password/",
  resetPassword:  "/api/auth/reset-password/",
  acceptInvite:   "/api/auth/accept-invite/",
} as const;

export const authApi = {
  login:          (data: LoginRequest): Promise<ApiResult<LoginResponse>> => api.post(P.login, data),
  logout:         (): Promise<ApiResult<void>>                            => api.post(P.logout, {}),
  signup:         (data: SignupRequest): Promise<ApiResult<LoginResponse>> => api.post(P.signup, data),
  me:             (): Promise<ApiResult<AnyUser>>                          => api.get(P.me),
  forgotPassword: (data: ForgotPasswordRequest): Promise<ApiResult<void>> => api.post(P.forgotPassword, data),
  resetPassword:  (data: ResetPasswordRequest): Promise<ApiResult<void>>  => api.post(P.resetPassword, data),
  acceptInvite:   (data: AcceptInviteRequest): Promise<ApiResult<LoginResponse>> => api.post(P.acceptInvite, data),
};
