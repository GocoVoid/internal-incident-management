/**
 * AdminTicketContext.jsx
 *
 * Single fetch point for all admin ticket data.
 * All admin pages read from this context — no individual useTickets calls.
 * Fetches once on mount. Mutations update local state optimistically.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/incidentService';

const AdminTicketContext = createContext(null);

const STATUS_MAP = {
  OPEN: 'Open', CLOSED: 'Closed',
  RESOLVED: 'Resolved', IN_PROGRESS: 'In Progress',
};

const normalise = (t) => ({
  id:             t.incidentKey,
  dbId:           t.id,
  title:          t.title,
  description:    t.description,
  category:       t.category ?? '',
  categoryId:     t.categoryId ?? null,
  department:     t.department ?? null,
  priority:       t.priority,
  status:         STATUS_MAP[t.status] ?? t.status,
  createdBy:      t.createdBy,
  createdByName:  t.createdByName ?? null,
  assignedTo:     t.assignedTo?.id ?? t.assignedTo ?? null,
  assignedToName: t.assignedToName ?? t.assignedTo?.name ?? null,
  slaDueAt:       t.slaDueAt,
  isSlaBreached:  t.isSlaBreached ?? false,
  createdAt:      t.createdAt,
  updatedAt:      t.updatedAt,
  resolvedAt:     t.resolvedAt,
  closedAt:       t.closedAt,
  comments: (t.comments ?? []).map(c => ({
    id:         c.id,
    author:     c.user?.name ?? c.author ?? 'Unknown',
    text:       c.commentText ?? c.text ?? '',
    isInternal: c.isInternal ?? false,
    createdAt:  c.createdAt,
  })),
  attachments: (t.attachments ?? []).map(a => ({
    id:          a.id,
    fileName:    a.fileName,
    fileUrl:     a.fileUrl,
    fileSize:    a.fileSize,
    contentType: a.contentType,
  })),
});

export const AdminTicketProvider = ({ children }) => {
  const [tickets,  setTickets]  = useState([]);
  const [stats,    setStats]    = useState({ total:0, open:0, inProgress:0, resolved:0, closed:0, breached:0 });
  const [filters,  setFilters]  = useState({ status:'', priority:'', category:'', search:'' });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ticketRes = await api.getIncidents();
      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      setTickets(list);

      const s = await api.getIncidentStats();
      setStats({
        total:      s.totalAll,
        open:       s.open,
        inProgress: s.inProgress,
        resolved:   s.resolved,
        closed:     s.closed,
        breached:   s.slaBreached,
      });
    } catch (err) {
      setError(err?.message ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Filtered view ── */
  const filteredTickets = useMemo(() => tickets.filter(t => {
    if (filters.status   && t.status   !== filters.status)   return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [tickets, filters]);

  /* ── Mutations ── */
  const createTicket = useCallback(async (data) => {
    const res = await api.createIncident({
      title:       data.title,
      description: data.description,
      priority:    data.priority,
      category:    data.category,
    });
    const t = normalise(res);
    setTickets(p => [t, ...p]);
    setStats(p => ({ ...p, total: p.total + 1, open: p.open + 1 }));
    return t;
  }, []);

  const updateStatus = useCallback(async (incidentKey, newStatus) => {
    await api.updateIncidentStatus(incidentKey, newStatus);
    const now = new Date().toISOString();
    setTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, status: newStatus, updatedAt: now,
      resolvedAt: newStatus === 'Resolved' ? now : t.resolvedAt,
      closedAt:   newStatus === 'Closed'   ? now : t.closedAt,
    }));
  }, []);

  const assignTicket = useCallback(async (incidentKey, assignedTo) => {
    await api.assignIncident(incidentKey, assignedTo);
    setTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, assignedTo, status: 'In Progress', updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addComment = useCallback(async (incidentKey, text, authorName, isInternal = false) => {
    const res = await api.addComment(incidentKey, text, isInternal);
    const comment = {
      id: res.id, author: res.user?.name ?? authorName ?? 'You',
      text: res.commentText ?? text, isInternal: res.isInternal ?? isInternal,
      createdAt: res.createdAt,
    };
    setTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, comments: [...t.comments, comment], updatedAt: new Date().toISOString(),
    }));
  }, []);

  const recategorize = useCallback(async (incidentKey, categoryId) => {
    await api.recategorizeIncident(incidentKey, categoryId);
    await fetchAll();
  }, [fetchAll]);

  const updateFilter = useCallback((key, val) => setFilters(p => ({ ...p, [key]: val })), []);
  const clearFilters = useCallback(() => setFilters({ status:'', priority:'', category:'', search:'' }), []);
  const getTicketById = useCallback((id) => tickets.find(t => t.id === id) ?? null, [tickets]);

  return (
    <AdminTicketContext.Provider value={{
      tickets: filteredTickets, allTickets: tickets,
      stats, filters, loading, error,
      refetch: fetchAll, updateFilter, clearFilters,
      createTicket, assignTicket, updateStatus,
      addComment, recategorize, getTicketById,
    }}>
      {children}
    </AdminTicketContext.Provider>
  );
};

export const useAdminTickets = () => {
  const ctx = useContext(AdminTicketContext);
  if (!ctx) throw new Error('useAdminTickets must be used within <AdminTicketProvider>');
  return ctx;
};
