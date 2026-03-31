/**
 * incidentService.js
 *
 * All incident-related API calls.
 * DB key mapping (backend → frontend):
 *   incident_key  → id (display key, e.g. IIMP-2025-000001)
 *   category_id   → resolved to category object { id, categoryName, departmentName }
 *   created_by    → createdBy (user id)
 *   assigned_to   → assignedTo (user id | null)
 *   sla_id        → slaId
 *   is_sla_breached → isSlaBreached
 *   sla_due_at    → slaDueAt
 *   closed_at     → closedAt
 *   resolved_at   → resolvedAt
 *   created_at    → createdAt
 *   updated_at    → updatedAt
 *
 * All list endpoints support query params:
 *   status, priority, categoryId, search, page, size
 */

import { get, post, patch, del, put } from './apiClient';

/* ══════════════════════════════════════════════════════════
   Incidents
══════════════════════════════════════════════════════════ */

/**
 * GET /incidents
 * Role-scoped server-side:
 *   EMPLOYEE      → only tickets where created_by = me
 *   SUPPORT_STAFF → only tickets where assigned_to = me
 *   MANAGER       → tickets in my department
 *   ADMIN         → all tickets
 *
 * @param {Object} params - { status, priority, categoryId, search, page, size }
 */
export const getIncidents = (params = {}) =>
  get('/incidents/getAllIncident', params);

export const getIncidentsByUser = (params = {}) =>
  get('/incidents/getIncidentByUser', params);

/**
 * GET /incidents/:incidentKey
 * Returns full incident with nested: comments, attachments, auditLog
 */
export const getIncidentByKey = (incidentKey) =>
  get(`/incidents/${incidentKey}`);

/**
 * POST /incidents
 * Body: { title, description, priority, category }
 *   priority → uppercased (e.g. "HIGH")
 *   category → category name uppercased (e.g. "IT")
 * Server sets: createdBy (from JWT), status=Open, slaDueAt, incidentKey
 */
export const createIncident = (data) =>
  post('/incidents/createIncident', {
    title:       data.title,
    description: data.description,
    priority:    data.priority.toUpperCase(),
    category:    data.category,
  });

export const uploadFiles = (id, formData) => 
  post(`/incidents/${id}/uploadAttachments`, formData)

/**
 * PATCH /incidents/:incidentKey/status
 * Body: { status }   — "Open" | "In Progress" | "Resolved" | "Closed"
 * Server updates: updatedAt, resolvedAt (if Resolved), closedAt (if Closed)
 * Roles: SUPPORT_STAFF (own tickets), MANAGER, ADMIN
 */
export const updateIncidentStatus = (incidentKey, newStatus) =>
  {
    if (newStatus=="In Progress") {
      newStatus="IN_PROGRESS"
    } else {
      newStatus = newStatus.toUpperCase();
    }
    console.log(newStatus);
    put(`/incidents/updateStatus/${incidentKey}`, { newStatus, note:null })
  };

  export const updateIncidentPriority = (incidentKey, priority) =>
  {
    priority = priority.toUpperCase();
    console.log(incidentKey," ",priority);
    patch(`/incidents/updatePriority/${incidentKey}`, { priority: priority.toUpperCase() })
  };

/**
 * PATCH /incidents/:incidentKey/assign
 * Body: { assignedTo }  — userId (number) | null to unassign
 * Server updates: status → "In Progress" if assigning, updatedAt, audit log
 * Roles: MANAGER, ADMIN
 */
export const assignIncident = (incidentKey, assignedToUserId, category) =>
  put(`/incidents/assign/${incidentKey}`, { assignedToUserId, category });

/**
 * PATCH /incidents/:incidentKey/recategorize
 * Body: { categoryId }
 * Server resets: slaDueAt based on priority + new SLA config, updatedAt, audit log
 * Roles: MANAGER, ADMIN
 */
export const recategorizeIncident = (incidentKey, categoryId) =>
  put(`/incidents/${incidentKey}/recategorize`, { categoryId });

/* ══════════════════════════════════════════════════════════
   Comments
══════════════════════════════════════════════════════════ */

/**
 * POST /incidents/:incidentKey/comments
 * Body: { commentText, isInternal }
 *   isInternal=true → visible only to SUPPORT_STAFF / MANAGER / ADMIN
 *   isInternal=false → visible to all including the employee who raised it
 * Server sets: userId (from JWT), createdAt
 */

export const getComments = (incidentKey) =>
  get(`/incidents/getComments/${incidentKey}`);

export const addComment = (incidentKey, commentText, internal=false) =>
  post(`/incidents/addComments/${incidentKey}`, { commentText, internal });

/* ══════════════════════════════════════════════════════════
   Attachments
══════════════════════════════════════════════════════════ */

/**
 * POST /incidents/:incidentKey/attachments
 * Body: FormData with field `file` (one file per call)
 * Server stores: fileName, fileUrl, fileSize, contentType, uploadedBy (JWT), createdAt
 */
// export const uploadAttachment = (incidentKey, file) => {
//   const fd = new FormData();
//   fd.append('file', file);
//   return post(`/incidents/${incidentKey}/attachments`, fd);
// };

/**
 * DELETE /incidents/:incidentKey/attachments/:attachmentId
 * Roles: uploader, ADMIN
 */
export const deleteAttachment = (incidentKey, attachmentId) =>
  del(`/incidents/${incidentKey}/attachments/${attachmentId}`);

/* ══════════════════════════════════════════════════════════
   Audit Log
══════════════════════════════════════════════════════════ */

/**
 * GET /incidents/:incidentKey/audit
 * Returns array of audit entries: { id, action, oldValue, newValue, changedBy, createdAt }
 * Roles: MANAGER, ADMIN (employees cannot see audit trail)
 */
export const getAuditLog = (incidentKey) =>
  get(`/incidents/audit/${incidentKey}`);


/* ══════════════════════════════════════════════════════════
   Resolution Note
══════════════════════════════════════════════════════════ */
 
/**
 * GET /incidents/:incidentKey/resolution-note
 * Returns: { resolutionNote: string | null }
 * Roles: SUPPORT_STAFF (own assigned tickets), MANAGER, ADMIN
 * Employees cannot see this note.
 */
export const getResolutionNote = (incidentKey) =>
  get(`/notes/getResolutionNote/${incidentKey}`);
 
/**
 * PUT /incidents/:incidentKey/resolution-note
 * Body: { resolutionNote: string }
 * Creates or replaces the resolution note for the ticket.
 * Roles: SUPPORT_STAFF (own assigned tickets), ADMIN
 * Server sets: updatedBy (from JWT), updatedAt, adds audit entry (RESOLUTION_NOTE_ADDED / RESOLUTION_NOTE_UPDATED)
 */
export const saveResolutionNote = (incidentKey, note) =>
  post(`/notes/addResolutionNote`, { incidentKey, note });  

/* ══════════════════════════════════════════════════════════
   Stats  (used by overview/dashboard pages)
══════════════════════════════════════════════════════════ */

/**
 * GET /incidents/stats
 * Returns: { total, open, inProgress, resolved, closed, breached }
 * Role-scoped same as getIncidents
 */
export const getIncidentStats = () =>
  get('/incidents/stats');

export const getIncidentStatsByUser=()=>
  get('/incidents/userStats')

export const getPriority = (data) => 
  post('/predict', {description: data})
