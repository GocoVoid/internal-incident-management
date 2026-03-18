/**
 * notificationService.js
 *
 * Notifications API calls.
 * Schema: id, user_id, message, is_read, otp_code (nullable), created_at
 *
 * Note: otp_code column is used internally by the backend for
 * first-login / password-reset OTP delivery. Never expose this
 * field in the frontend — the backend should strip it from list responses.
 */

import { get, patch } from './apiClient';

/**
 * GET /notifications
 * Returns notifications for the logged-in user (scoped by JWT).
 * Response: [{ id, message, isRead, createdAt }]
 * @param {Object} params - { isRead: boolean (optional), page, size }
 */
export const getNotifications = (params = {}) =>
  get('/notifications', params);

/**
 * GET /notifications/unread-count
 * Returns: { count: number }
 * Used by Header bell icon badge.
 */
export const getUnreadCount = () =>
  get('/notifications/unread-count');

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read (is_read = true).
 */
export const markAsRead = (id) =>
  patch(`/notifications/${id}/read`);

/**
 * PATCH /notifications/read-all
 * Marks all notifications for the current user as read.
 */
export const markAllAsRead = () =>
  patch('/notifications/read-all');
