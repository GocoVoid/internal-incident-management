/**
 * useTickets.js
 *
 * Data layer for incident operations.
 * Currently operates on in-memory mock store.
 * Each action is structured to be a 1-for-1 swap with the real API service
 * when the backend is ready — just uncomment the import and replace the
 * mock mutation with the corresponding service call.
 *
 * API swap guide (per action):
 *   createTicket    → incidentService.createIncident(data)
 *   updateStatus    → incidentService.updateIncidentStatus(incidentKey, status)
 *   assignTicket    → incidentService.assignIncident(incidentKey, assignedTo)
 *   addComment      → incidentService.addComment(incidentKey, text, isInternal)
 *   recategorize    → incidentService.recategorizeIncident(incidentKey, categoryId)
 *   fetchTickets    → incidentService.getIncidents(filters)   [replaces useState on mount]
 */

import { useState, useCallback, useMemo } from 'react';
import { MOCK_TICKETS, MOCK_USERS } from '../data/mockData';

// import * as incidentService from '../services/incidentService';

/* ── In-memory store (mock only) ───────────────────────────── */
let ticketStore = [...MOCK_TICKETS];
let nextId      = ticketStore.length + 1;
const pad       = (n) => String(n).padStart(6, '0');
const generateKey = () => `IIMP-2025-${pad(nextId++)}`;

export const useTickets = (currentUserId, role) => {
  const [tickets,  setTickets]  = useState(ticketStore);
  const [filters,  setFilters]  = useState({ status: '', priority: '', category: '', search: '' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  /* ── Role scoping (mock) — server handles this in real API ── */
  const scopedTickets = useMemo(() => {
    switch (role) {
      case 'EMPLOYEE':
        return tickets.filter((t) => t.createdBy === currentUserId);
      case 'SUPPORT_STAFF':
        return tickets.filter((t) => t.assignedTo === currentUserId);
      case 'MANAGER': {
        const mgr = MOCK_USERS.find((u) => u.id === currentUserId);
        return tickets.filter((t) => t.department === mgr?.department);
      }
      case 'ADMIN':
        return tickets;
      default:
        return [];
    }
  }, [tickets, currentUserId, role]);

  /* ── Client-side filters (mock) — pass as query params in real API ── */
  const filteredTickets = useMemo(() => {
    return scopedTickets.filter((t) => {
      if (filters.status   && t.status   !== filters.status)   return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [scopedTickets, filters]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:      scopedTickets.length,
    open:       scopedTickets.filter((t) => t.status === 'Open').length,
    inProgress: scopedTickets.filter((t) => t.status === 'In Progress').length,
    resolved:   scopedTickets.filter((t) => t.status === 'Resolved').length,
    closed:     scopedTickets.filter((t) => t.status === 'Closed').length,
    breached:   scopedTickets.filter((t) => t.isSlaBreached).length,
  }), [scopedTickets]);

  /* ══════════════════════════════════════════════════════════
     Actions
     Real API: wrap each in setLoading(true/false) + setError
  ══════════════════════════════════════════════════════════ */

  /**
   * createTicket
   * Real: await incidentService.createIncident({ title, description, priority, categoryId })
   *       then prepend returned ticket to state
   */
  const createTicket = useCallback((data) => {
    const now = new Date().toISOString();
    const slaDurations = { Low: 72, Medium: 48, High: 24, Critical: 4 };
    const hrs    = slaDurations[data.priority] ?? 48;
    const slaDueAt = data.category === 'Others'
      ? null
      : new Date(Date.now() + hrs * 60 * 60 * 1000).toISOString();

    const newTicket = {
      id:            generateKey(),   // → incidentKey from API
      title:         data.title,
      category:      data.category,   // → categoryId + resolved name from API
      priority:      data.priority,
      status:        'Open',
      description:   data.description,
      createdBy:     currentUserId,
      assignedTo:    null,
      department:    data.category === 'Others' ? null : data.category,
      slaDueAt,
      isSlaBreached: false,
      createdAt:     now,
      updatedAt:     now,
      resolvedAt:    null,
      closedAt:      null,
      comments:      [],
      attachments:   [],
    };

    ticketStore = [newTicket, ...ticketStore];
    setTickets([...ticketStore]);
    return newTicket;
  }, [currentUserId]);

  /**
   * assignTicket
   * Real: await incidentService.assignIncident(ticketId, staffId)
   */
  const assignTicket = useCallback((ticketId, staffId) => {
    ticketStore = ticketStore.map((t) =>
      t.id === ticketId
        ? { ...t, assignedTo: staffId, status: 'In Progress', updatedAt: new Date().toISOString() }
        : t
    );
    setTickets([...ticketStore]);
  }, []);

  /**
   * updateStatus
   * Real: await incidentService.updateIncidentStatus(ticketId, newStatus)
   */
  const updateStatus = useCallback((ticketId, newStatus) => {
    const now = new Date().toISOString();
    ticketStore = ticketStore.map((t) => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        status:     newStatus,
        updatedAt:  now,
        resolvedAt: newStatus === 'Resolved' ? now : t.resolvedAt,
        closedAt:   newStatus === 'Closed'   ? now : t.closedAt,
      };
    });
    setTickets([...ticketStore]);
  }, []);

  /**
   * addComment
   * Real: await incidentService.addComment(ticketId, commentText, isInternal)
   * Note: real API returns comment with userId resolved to user object;
   *       isInternal controls visibility (internal = staff-only notes)
   */
  const addComment = useCallback((ticketId, text, authorName, isInternal = false) => {
    const comment = {
      id:         Date.now(),
      author:     authorName,   // → resolved from userId via API
      text,                     // → commentText in DB
      isInternal,               // → is_internal in DB
      createdAt:  new Date().toISOString(),
    };
    ticketStore = ticketStore.map((t) =>
      t.id === ticketId
        ? { ...t, comments: [...t.comments, comment], updatedAt: new Date().toISOString() }
        : t
    );
    setTickets([...ticketStore]);
  }, []);

  /**
   * recategorize
   * Real: await incidentService.recategorizeIncident(ticketId, categoryId)
   *       server resets slaDueAt and logs audit entry
   */
  const recategorize = useCallback((ticketId, newCategory) => {
    const slaDurations = { Low: 72, Medium: 48, High: 24, Critical: 4 };
    ticketStore = ticketStore.map((t) => {
      if (t.id !== ticketId) return t;
      const hrs      = slaDurations[t.priority] ?? 48;
      const slaDueAt = new Date(Date.now() + hrs * 60 * 60 * 1000).toISOString();
      return {
        ...t,
        category:   newCategory,   // → categoryId in real API
        department: newCategory,
        slaDueAt,
        updatedAt:  new Date().toISOString(),
      };
    });
    setTickets([...ticketStore]);
  }, []);

  /* ── Filter helpers ── */
  const updateFilter = useCallback((key, value) => setFilters((p) => ({ ...p, [key]: value })), []);
  const clearFilters = useCallback(() => setFilters({ status: '', priority: '', category: '', search: '' }), []);

  const getTicketById = useCallback((id) => ticketStore.find((t) => t.id === id) ?? null, []);

  return {
    tickets:       filteredTickets,
    allTickets:    tickets,
    scopedTickets,
    stats,
    filters,
    loading,
    error,
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
