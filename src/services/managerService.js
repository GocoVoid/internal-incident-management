/**
 * managerService.js
 *
 * All API calls for the Manager dashboard.
 * Every endpoint is under /api/manager/* — no shared /incidents, /reports, or /admin routes.
 * Backend scopes all queries to the manager's department via JWT.
 */

import { get, post, put, patch } from './apiClient';

/* ══════════════════════════════════════════════════════════
   Incidents
══════════════════════════════════════════════════════════ */

/** GET /api/manager/getAllIncidentForManager */
export const getManagerIncidents = () =>
  get('/manager/getAllIncidentForManager');

/** GET /api/manager/getStats */
export const getManagerStats = () =>
  get('/manager/getStats');

/** POST /api/manager/createIncident */
export const createManagerIncident = (data) =>
  post('/manager/createIncident', {
    title:       data.title,
    description: data.description,
    priority:    data.priority.toUpperCase(),
    category:    data.category,
  });

/** PUT /api/manager/updateStatus/:incidentKey  — body: { newStatus, note } */
export const updateManagerIncidentStatus = (incidentKey, status) => {
  const newStatus = status === 'In Progress' ? 'IN_PROGRESS' : status.toUpperCase();
  return put(`/manager/updateStatus/${incidentKey}`, { newStatus, note: null });
};

/** PATCH /api/manager/updatePriority/:incidentKey  — body: { priority } */
export const updateManagerIncidentPriority = (incidentKey, priority) =>
  patch(`/manager/updatePriority/${incidentKey}`, { priority: priority.toUpperCase() });

/** PUT /api/manager/assign/:incidentKey  — body: { assignedToUserId, category } */
export const assignManagerIncident = (incidentKey, assignedToUserId, category) =>
  put(`/manager/assign/${incidentKey}`, { assignedToUserId, category });

/** PUT /api/manager/recategorize/:incidentKey  — body: { categoryId } */
export const recategorizeManagerIncident = (incidentKey, categoryId) =>
  put(`/manager/recategorize/${incidentKey}`, { categoryId });

/** POST /api/manager/addComment/:incidentKey  — body: { commentText, isInternal } */
export const addManagerComment = (incidentKey, commentText, isInternal = false) =>
  post(`/manager/addComment/${incidentKey}`, { commentText, isInternal });

/* ══════════════════════════════════════════════════════════
   Reports
══════════════════════════════════════════════════════════ */

/** GET /api/manager/reports/summary */
export const getManagerReportSummary = () =>
  get('/manager/reports/summary');

/** GET /api/manager/reports/ticket-volume?range=week|month|year */
export const getManagerTicketVolume = (range = 'week') =>
  get('/manager/reports/ticket-volume', { range });

/** GET /api/manager/reports/category-breakdown */
export const getManagerCategoryBreakdown = () =>
  get('/manager/reports/category-breakdown');

/* ══════════════════════════════════════════════════════════
   Support Staff
══════════════════════════════════════════════════════════ */

/** GET /api/manager/support-staff
 *  Returns SUPPORT_STAFF users in the manager's own department (resolved server-side from JWT).
 *  No department param needed — backend uses JWT to scope. */
export const getManagerSupportStaff = () =>
  get('/manager/support-staff');