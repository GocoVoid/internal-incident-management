/**
 * useTickets.js
 * Real API-backed data layer for all incident operations.
 * Fetches from backend on mount; all mutations call the API then sync local state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/incidentService';

export const useTickets = (_currentUserId, _role) => {
  const [tickets,  setTickets]  = useState([]);
  const [stats,    setStats]    = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, breached: 0 });
  const [filters,  setFilters]  = useState({ status: '', priority: '', category: '', search: '' });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  /* ── Normalise API ticket → UI shape ─────────────────────── */
  const normalise = (t) => ({
    id:              t.incidentKey,
    dbId:            t.id,
    title:           t.title,
    description:     t.description,
    //category:        t.category?.categoryName ?? t.category ?? '',
    categoryId:      t.category?.id           ?? t.categoryId ?? null,
    department:      t.category?.departmentName ?? t.category ?? null,
    priority:        t.priority,
    status:          t.status.replace({"OPEN":"Open","CLOSED":"Closed","RESOLVED":"Resolved","IN_PROGRESS":"In Progress"}),
    createdBy:       t.createdBy,
    createdByName:   t.createdByName  ?? t.createdBy?.name  ?? null,
    assignedTo:      t.assignedTo?.id ?? t.assignedTo       ?? null,
    assignedToName:  t.assignedToName ?? t.assignedTo?.name ?? null,
    slaDueAt:        t.slaDueAt,
    isSlaBreached:   t.isSlaBreached ?? false,
    createdAt:       t.createdAt,
    updatedAt:       t.updatedAt,
    resolvedAt:      t.resolvedAt,
    closedAt:        t.closedAt,
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

  /* ── Fetch tickets + stats ────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Tickets Fetch Started");
      const ticketRes = await api.getIncidents();
      console.log("Tickets Fetch Done");
      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      setTickets(list);
      console.log("Fetching Stats");
      const statsRes = await api.getIncidentStats();
      console.log("Setting Stats");
      setStats({
        total:      statsRes.totalAll,
        open:       statsRes.open,
        inProgress: statsRes.inProgress,
        resolved:   statsRes.resolved,
        closed:     statsRes.closed,
        breached:   statsRes.slaBreached,
      });
      console.log(stats);
    } catch (err) {
      setError(err?.message ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Client-side filter (server already scopes by role) ──── */
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

  /* ══════════════════════════════════════════════════════════
     Mutations — each calls API then refreshes local state
  ══════════════════════════════════════════════════════════ */

  const createTicket = useCallback(async (data) => {
    const res = await api.createIncident({
      title:       data.title,
      description: data.description,
      priority:    data.priority,
      category:    data.category,
    });
    const newTicket = normalise(res);
    setTickets(prev => [newTicket, ...prev]);
    setStats(prev => ({ ...prev, total: prev.total + 1, open: prev.open + 1 }));
    return newTicket;
  }, []);

  const updateStatus = useCallback(async (incidentKey, newStatus) => {
    await api.updateIncidentStatus(incidentKey, newStatus);
    setTickets(prev => prev.map(t => {
      if (t.id !== incidentKey) return t;
      const now = new Date().toISOString();
      return {
        ...t, status: newStatus, updatedAt: now,
        resolvedAt: newStatus === 'Resolved' ? now : t.resolvedAt,
        closedAt:   newStatus === 'Closed'   ? now : t.closedAt,
      };
    }));
  }, []);

  const assignTicket = useCallback(async (incidentKey, assignedTo) => {
    await api.assignIncident(incidentKey, assignedTo);
    setTickets(prev => prev.map(t =>
      t.id === incidentKey
        ? { ...t, assignedTo, status: 'In Progress', updatedAt: new Date().toISOString() }
        : t
    ));
  }, []);

  const addComment = useCallback(async (incidentKey, text, _authorName, isInternal = false) => {
    const res = await api.addComment(incidentKey, text, isInternal);
    const newComment = {
      id:         res.id,
      author:     res.user?.name ?? _authorName ?? 'You',
      text:       res.commentText ?? text,
      isInternal: res.isInternal ?? isInternal,
      createdAt:  res.createdAt,
    };
    setTickets(prev => prev.map(t =>
      t.id === incidentKey
        ? { ...t, comments: [...t.comments, newComment], updatedAt: new Date().toISOString() }
        : t
    ));
  }, []);

  const recategorize = useCallback(async (incidentKey, categoryId) => {
    await api.recategorizeIncident(incidentKey, categoryId);
    await fetchAll(); // refresh to get updated slaDueAt from server
  }, [fetchAll]);

  const getTicketById = useCallback((id) => tickets.find(t => t.id === id) ?? null, [tickets]);

  const updateFilter = useCallback((key, val) => setFilters(p => ({ ...p, [key]: val })), []);
  const clearFilters = useCallback(() => setFilters({ status: '', priority: '', category: '', search: '' }), []);

  return {
    tickets:       filteredTickets,
    allTickets:    tickets,
    stats,
    filters,
    loading,
    error,
    refetch:       fetchAll,
    updateFilter,
    clearFilters,
    createTicket,
    assignTicket,
    updateStatus,
    addComment,
    recategorize,
    getTicketById,
  };
};
