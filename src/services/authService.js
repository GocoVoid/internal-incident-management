/**
 * authService.js
 * Auth endpoints — intentionally uses raw fetch (no apiClient) to avoid
 * circular dependency: apiClient imports refreshAccessToken from here.
 *
 * Login / refresh response shape:
 * {
 *   accessToken:  string,
 *   refreshToken: string,
 *   tokenType:    "Bearer",
 *   expiresIn:    number,
 *   user: {
 *     id:           number,
 *     email:        string,
 *     fullName:     string,   // maps to DB `name`
 *     role:         "EMPLOYEE" | "SUPPORT_STAFF" | "MANAGER" | "ADMIN",
 *     department:   string | null,
 *     isFirstLogin: boolean,
 *   }
 * }
 */


const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://iimp-backend.duckdns.org/api'
//const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1111/api';
//const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.62:1111/api';

const rawPost = async (endpoint, body) => {
  const res  = await fetch(`${BASE_URL}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const ct   = res.headers.get('content-type') ?? '';
  const data = ct.includes('application/json')
    ? await res.json()
    : { message: await res.text() };

  if (!res.ok) {
    const err  = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
};

/** POST /auth/login */
export const login = (email, password) =>
  rawPost('/auth/login', { email, password });

/** POST /auth/logout */
export const logout = (refreshToken) =>
  rawPost('/auth/logout', { refreshToken });

/** POST /auth/refresh */
export const refreshAccessToken = (refreshToken) =>
  rawPost('/auth/refresh', { refreshToken });

/** POST /auth/change-password  (first-login forced reset) */
export const changePassword = (email,oldPassword, newPassword, otpCode, token, purpose) =>
  rawPost('/auth/change-password', { email, oldPassword, newPassword, otpCode, token, purpose });

export const forgotPassword = (email, newPassword, otpCode, token, purpose) =>
  rawPost('/auth/forgot-password', { email, newPassword, otpCode, token, purpose });

/** POST /auth/send-otp */
export const sendOtp = (email, purpose) =>
  rawPost('/auth/send-otp', { email, purpose });

/** POST /auth/verify-otp */
export const verifyOtp = (email, purpose, otpCode) =>
  rawPost('/auth/verify-otp', { email, purpose, otpCode });
