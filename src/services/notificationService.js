import { get, patch } from './apiClient';

/** GET /notifications/getAllUnreadNotifications */
export const getNotifications = () =>
  get('/notifications/getAllUnreadNotifications');

/** GET /notifications/count */
export const getUnreadCount = () =>
  get('/notifications/count');

/** PATCH /notifications/read/:id */
export const markAsRead = (id) =>
  patch(`/notifications/read/${id}`);

/** PATCH /notifications/read-all */
export const markAllAsRead = () =>
  patch('/notifications/read-all');
