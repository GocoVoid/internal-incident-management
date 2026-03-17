const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.0.205:6969/api';

/* ── Generic request helper ───────────────────────────────── */
const request = async (endpoint, options = {}) => {
  const url      = `${BASE_URL}${endpoint}`;
  const defaults = {
    headers: { 'Content-Type': 'application/json' },
  };

  const config = {
    ...defaults,
    ...options,
    headers: { ...defaults.headers, ...(options.headers ?? {}) },
  };

  const response = await fetch(url, config);

  /* Try to parse JSON regardless of status so we can read error messages */
  let data;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    /* Normalise backend error shape */
    const message =
      data?.message ||
      data?.error  ||
      `Request failed with status ${response.status}`;
    const error   = new Error(message);
    error.status  = response.status;
    error.data    = data;
    throw error;
  }

  return data;
};

/* ── Auth endpoints ───────────────────────────────────────── */

/**
 * POST /auth/login
 * @param {string} email
 * @param {string} password
 * @returns {Promise<LoginResponse>}
 *
 * Expected response shape:
 * {
 *   accessToken:  string,
 *   refreshToken: string,
 *   tokenType:    "Bearer",
 *   expiresIn:    number,
 *   user: {
 *     id:           number,
 *     email:        string,
 *     fullName:     string,
 *     role:         "EMPLOYEE" | "SUPPORT_STAFF" | "MANAGER" | "ADMIN",
 *     department:   string,
 *     isFirstLogin: boolean,
 *   }
 * }
 */
export const login = (email, password) =>
  request('/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  });

/**
 * POST /auth/logout
 */
export const logout = (refreshToken) =>
  request('/auth/logout', {
    method: 'POST',
    body:   JSON.stringify({ refreshToken }),
  });

/**
 * POST /auth/refresh
 */
export const refreshAccessToken = (refreshToken) =>
  request('/auth/refresh', {
    method: 'POST',
    body:   JSON.stringify({ refreshToken }),
  });
