import { apiFetch, resetCsrfToken, syncCsrfToken, type ApiResponse } from "@/lib/api";

export type UserRole =
  | "super_admin"
  | "admin"
  | "compliance"
  | "agent"
  | "participant";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role?: UserRole | string;
  status?: string;
  location?: string;
  picture?: string;
  /** "password" | "google" from API */
  authProvider?: string;
  createdAt: string;
}

export function isStaffRole(role?: string | null): boolean {
  if (!role) return false;
  return ["super_admin", "admin", "compliance"].includes(role.toLowerCase());
}


export interface SignupPayload {
  phone: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  verificationToken?: string;
  /** Required: server returns 422 if false */
  acceptTerms: boolean;
}

/**
 * Login body for `/api/auth/login`.
 * Primary path: **phone** + password (same number you used at signup).
 * `identifier` may also be an email if the account was created with one.
 */
export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const response = await apiFetch<ApiResponse<AuthResponse>>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function sendOtp(phone: string): Promise<{ sent: boolean }> {
  const response = await apiFetch<ApiResponse<{ sent: boolean }>>("/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
  return response.data;
}

export async function verifyOtp(phone: string, code: string): Promise<{ verificationToken: string }> {
  const response = await apiFetch<ApiResponse<{ verificationToken: string }>>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  return response.data;
}

/** Forgot password (phone + password accounts only). Step 1: SMS code. */
export async function forgotPasswordSendOtp(phone: string): Promise<{ sent: boolean }> {
  const response = await apiFetch<ApiResponse<{ sent: boolean }>>("/api/auth/forgot-password/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
  return response.data;
}

/** Step 2: exchange OTP for a short-lived reset token. */
export async function forgotPasswordVerifyOtp(
  phone: string,
  code: string
): Promise<{ resetToken: string }> {
  const response = await apiFetch<ApiResponse<{ resetToken: string }>>("/api/auth/forgot-password/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  return response.data;
}

/** Step 3: set new password using resetToken from verify. */
export async function forgotPasswordReset(payload: {
  phone: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ ok: boolean }> {
  const response = await apiFetch<ApiResponse<{ ok: boolean }>>("/api/auth/forgot-password/reset", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiFetch<ApiResponse<AuthResponse>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export type GoogleLoginOptions = { isSignup?: boolean; acceptTerms?: boolean };

export async function googleLogin(credential: string, opts?: GoogleLoginOptions): Promise<AuthResponse> {
  // Google popup can return while our cached CSRF is out of sync with the cookie; re-fetch before POST.
  await syncCsrfToken();
  const response = await apiFetch<ApiResponse<AuthResponse>>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({
      credential,
      isSignup: opts?.isSignup ?? false,
      acceptTerms: opts?.acceptTerms ?? false,
    }),
  });
  return response.data;
}

export async function getMe(): Promise<{ user: User } | null> {
  try {
    const response = await apiFetch<ApiResponse<{ user: User }>>("/api/me", { skipAuthRedirect: true });
    return response.data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    resetCsrfToken();
  }
}

export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthResponse> {
  const response = await apiFetch<ApiResponse<AuthResponse>>("/api/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch<ApiResponse<unknown>>("/api/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
