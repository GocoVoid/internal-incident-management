/**
 * reportService.js
 *
 * Analytics and reporting API calls.
 * All endpoints return aggregated data derived from the incidents table.
 * Roles: MANAGER (own department), ADMIN (all departments)
 */

import { get } from './apiClient';

/**
 * GET /reports/summary
 * Returns: {
 *   totalToday, openCount, breachedCount, slaCompliance (0-100 %)
 * }
 */
export const getReportSummary = () =>
  get('/reports/summary');

/**
 * GET /reports/ticket-volume
 * @param {Object} params - { range: "week" | "month" | "year" }
 * Returns: [{ label: string, count: number }]
 */
export const getTicketVolume = (params = { range: 'week' }) =>
  get('/reports/ticket-volume', params);

/**
 * GET /reports/category-breakdown
 * Returns: [{ label: string, count: number }]
 * Derived by joining incidents → categories → category_name
 */
export const getCategoryBreakdown = () =>
  get('/reports/category-breakdown');

/**
 * GET /reports/sla-compliance
 * Returns: { compliance: number (0-100), breached: number, onTime: number }
 */
export const getSLACompliance = () =>
  get('/reports/sla-compliance');

/**
 * GET /reports/export
 * @param {Object} params - { format: "csv", startDate, endDate }
 * Returns a file download (backend sends Content-Disposition: attachment)
 * Frontend handles this via a direct <a> download link, not via apiClient.
 * Use the helper below to build the URL with auth token.
 */
export const buildExportUrl = (params = {}) => {
  const base   = 'http://localhost:1111/api';
  const query  = new URLSearchParams({ format: 'csv' }).toString();
  return `${base}/reports/export`;
};
