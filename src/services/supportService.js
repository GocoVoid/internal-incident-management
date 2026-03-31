import { get } from './apiClient';

export const getAssignedTickets = () =>
  get('/support/getAssignedTickets');

export const getSupportStats = () =>
  get('/support/supportStats');

export const getUnreadNotifications = () =>
  get('/support/getUnreadNotifications');

export const updateIncidentStatusWithNote = (incidentKey, resolutionNote = '') =>
  api.patch(`/incidents/${incidentKey}/status`, { incidentKey: incidentKey, resolutionNote: resolutionNote });