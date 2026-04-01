/**
 * slaService.js
 *
 * SLA configuration API calls.
 * Schema: id, priority, resolution_time_hours
 *
 * One row per priority level: Low | Medium | High | Critical
 * Stored per-incident at creation time via sla_id FK.
 */

import { get, put } from './apiClient';

/**
 * GET /admin/getSLA
 * Returns: [{ id, priority, resolutionTimeHours }]
 * Used by: Admin SLA Config page, incident creation logic (server-side)
 */
export const getSLAConfig = () =>
  get('/admin/getSLA');

/**
 * PUT /admin/updateSLA/:id   (ADMIN only)
 * Path param : id                — numeric PK of the sla_config row
 * Body       : { resolutionTimeHours }  — number of hours only, no id in body
 * Updates the resolution time for a specific priority row.
 * Note: changing SLA config does NOT retroactively update open incidents.
 */
export const updateSLAConfig = (id, resolutionTimeHours) =>
{ console.log(id+" "+resolutionTimeHours);
  put(`/admin/updateSLA`, { id, resolutionTimeHours });}
