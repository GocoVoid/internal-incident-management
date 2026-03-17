import { useState, useCallback, useMemo } from 'react';
import { MOCK_TICKETS, MOCK_USERS } from '../data/mockData';

let ticketStore = [...MOCK_TICKETS];
let nextId = ticketStore.length + 1;

const pad = (n) => String(n).padStart(6, '0');
const generateId = () => `IIMP-2025-${pad(nextId++)}`;

export const useTickets = (currentUserId, role) => {
  const [tickets, setTickets]   = useState(ticketStore);
  const [filters,  setFilters]  = useState({ status: '', priority: '', category: '', search: '' });

  /* ── Scope by role ─────────────────────────────────────── */
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

  /* ── Apply filters ─────────────────────────────────────── */
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

  /* ── Stats ─────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total:      scopedTickets.length,
    open:       scopedTickets.filter((t) => t.status === 'Open').length,
    inProgress: scopedTickets.filter((t) => t.status === 'In Progress').length,
    resolved:   scopedTickets.filter((t) => t.status === 'Resolved').length,
    closed:     scopedTickets.filter((t) => t.status === 'Closed').length,
    breached:   scopedTickets.filter((t) => t.isSlaBreached).length,
  }), [scopedTickets]);

  /* ── Actions ────────────────────────────────────────────── */
  const createTicket = useCallback((data) => {
    const now = new Date().toISOString();
    const slaDurations = { Low: 72, Medium: 48, High: 24, Critical: 4 };
    const hrs = slaDurations[data.priority] ?? 48;
    const slaDueAt = data.category === 'Others'
      ? null
      : new Date(Date.now() + hrs * 60 * 60 * 1000).toISOString();

    const newTicket = {
      id:           generateId(),
      title:        data.title,
      category:     data.category,
      priority:     data.priority,
      status:       'Open',
      description:  data.description,
      createdBy:    currentUserId,
      assignedTo:   null,
      department:   data.category === 'Others' ? null : data.category,
      slaDueAt,
      isSlaBreached: false,
      createdAt:    now,
      updatedAt:    now,
      resolvedAt:   null,
      closedAt:     null,
      comments:     [],
      attachments:  [],
    };

    ticketStore = [newTicket, ...ticketStore];
    setTickets([...ticketStore]);
    return newTicket;
  }, [currentUserId]);

  const assignTicket = useCallback((ticketId, staffId) => {
    ticketStore = ticketStore.map((t) =>
      t.id === ticketId
        ? { ...t, assignedTo: staffId, status: 'In Progress', updatedAt: new Date().toISOString() }
        : t
    );
    setTickets([...ticketStore]);
  }, []);

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

  const addComment = useCallback((ticketId, text, authorName) => {
    const comment = {
      id:        Date.now(),
      author:    authorName,
      text,
      createdAt: new Date().toISOString(),
    };
    ticketStore = ticketStore.map((t) =>
      t.id === ticketId
        ? { ...t, comments: [...t.comments, comment], updatedAt: new Date().toISOString() }
        : t
    );
    setTickets([...ticketStore]);
  }, []);

  const recategorize = useCallback((ticketId, newCategory) => {
    const slaDurations = { Low: 72, Medium: 48, High: 24, Critical: 4 };
    ticketStore = ticketStore.map((t) => {
      if (t.id !== ticketId) return t;
      const hrs      = slaDurations[t.priority] ?? 48;
      const slaDueAt = new Date(Date.now() + hrs * 60 * 60 * 1000).toISOString();
      return { ...t, category: newCategory, department: newCategory, slaDueAt, updatedAt: new Date().toISOString() };
    });
    setTickets([...ticketStore]);
  }, []);

  const updateFilter  = useCallback((key, value) => setFilters((p) => ({ ...p, [key]: value })), []);
  const clearFilters  = useCallback(() => setFilters({ status: '', priority: '', category: '', search: '' }), []);

  const getTicketById = useCallback((id) => ticketStore.find((t) => t.id === id) ?? null, []);

  return {
    tickets: filteredTickets,
    allTickets: tickets,
    scopedTickets,
    stats,
    filters,
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
