/**
 * userService.js
 *
 * User management API calls.
 * DB columns: id, name, email, password, role, department,
 *             is_active, is_first_login, failed_login_attempts,
 *             locked_until, created_at
 */

import { get, post, patch, put } from './apiClient';

/* ══════════════════════════════════════════════════════════
   User Listing & Detail  (ADMIN only)
══════════════════════════════════════════════════════════ */

/**
 * GET /users
 * @param {Object} params - { role, department, isActive, search, page, size }
 */
export const getUsers = (params = {}) =>
  get('/users', params);

/**
 * GET /users/:id
 */
export const getUserById = (id) =>
  get(`/users/${id}`);

/* ══════════════════════════════════════════════════════════
   User Creation & Update  (ADMIN only)
══════════════════════════════════════════════════════════ */

/**
 * POST /users
 * Body: { name, email, role, department }
 * Server sets: is_first_login=true, generates temp password, sends notification
 */
export const createUser = (data) =>
  post('/users', data);

/**
 * PUT /users/:id
 * Body: { name, email, role, department }
 */
export const updateUser = (id, data) =>
  put(`/users/${id}`, data);

/* ══════════════════════════════════════════════════════════
   Status Toggles  (ADMIN only)
══════════════════════════════════════════════════════════ */

/**
 * PATCH /users/:id/status
 * Body: { isActive: boolean }
 * Maps to DB: is_active
 */
export const toggleUserStatus = (id, isActive) =>
  patch(`/users/${id}/status`, { isActive });

/**
 * PATCH /users/:id/unlock
 * Resets: failed_login_attempts=0, locked_until=null
 * Roles: ADMIN only
 */
export const unlockUser = (id) =>
  patch(`/users/${id}/unlock`);

/* ══════════════════════════════════════════════════════════
   Support Staff list  (used by MANAGER/ADMIN for assignment dropdown)
══════════════════════════════════════════════════════════ */

/**
 * GET /users/support-staff
 * @param {string} department - filter by department (optional)
 * Returns only SUPPORT_STAFF users with is_active=true
 */
export const getSupportStaff = (department) =>
  get('/users/support-staff', department ? { department } : {});

/* ══════════════════════════════════════════════════════════
   Current user profile
══════════════════════════════════════════════════════════ */

/**
 * GET /users/me
 * Returns the logged-in user's profile (resolved from JWT server-side)
 */
export const getMyProfile = () =>
  get('/users/me');
