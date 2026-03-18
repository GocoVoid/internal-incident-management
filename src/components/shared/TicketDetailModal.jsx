import React, { useState, useEffect } from 'react';
import { StatusBadge, PriorityBadge } from './TicketBadge';
import { MOCK_USERS } from '../../data/mockData';

/* ══════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════ */
const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const getUserName = (id) =>
  MOCK_USERS.find((u) => u.id === id)?.fullName ?? (id ? `User #${id}` : '—');

const initials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??';

/* ── SLA countdown ─────────────────────────────────── */
const SLAStatus = ({ slaDueAt, isSlaBreached, status }) => {
  if (status === 'Resolved' || status === 'Closed')
    return <span className="text-xs text-gray-400">Resolved — no SLA active</span>;
  if (!slaDueAt)
    return <span className="text-xs text-gray-400">SLA not started yet</span>;
  if (isSlaBreached || new Date(slaDueAt) <= new Date()) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-semibold text-red-600">SLA Breached</span>
        <span className="text-xs text-red-400">· Due {formatDateTime(slaDueAt)}</span>
      </div>
    );
  }
  const diff = new Date(slaDueAt) - Date.now();
  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const urgent = hrs < 2;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${urgent ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
      <span className={`text-xs font-semibold ${urgent ? 'text-orange-600' : 'text-green-600'}`}>
        {hrs > 0 ? `${hrs}h ${mins}m remaining` : `${mins}m remaining`}
      </span>
      <span className="text-xs text-gray-400">· Due {formatDateTime(slaDueAt)}</span>
    </div>
  );
};

/* ── Meta row ──────────────────────────────────────── */
const MetaRow = ({ label, children }) => (
  <div className="flex items-start justify-between py-2.5"
    style={{ borderBottom: '1px solid #f3f4f6' }}>
    <span className="text-xs text-gray-500 shrink-0 w-28">{label}</span>
    <span className="text-xs text-gray-800 text-right font-medium flex-1">{children}</span>
  </div>
);

/* ── Comment bubble ────────────────────────────────── */
const CommentBubble = ({ comment, isOwn }) => (
  <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 text-white"
      style={{ background: isOwn ? 'linear-gradient(135deg,#3c3c8c,#783c78)' : 'linear-gradient(135deg,#14a0c8,#0080b0)' }}>
      {initials(comment.author)}
    </div>
    <div className={`flex-1 max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold text-gray-700">{comment.author}</span>
        <span className="text-[10px] text-gray-400">{formatDateTime(comment.createdAt)}</span>
      </div>
      <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed text-gray-700
        ${isOwn
          ? 'rounded-tr-sm'
          : 'rounded-tl-sm'
        }`}
        style={{
          background: isOwn ? 'linear-gradient(135deg,rgba(60,60,140,0.08),rgba(120,60,120,0.06))' : '#f9fafb',
          border: '1px solid',
          borderColor: isOwn ? 'rgba(60,60,140,0.12)' : '#f3f4f6',
        }}>
        {comment.text}
      </div>
    </div>
  </div>
);

/* ── Audit entry ───────────────────────────────────── */
const AuditEntry = ({ entry }) => {
  const actionColors = {
    CREATED:                { bg: '#f0fdf4', text: '#059669', border: '#d1fae5' },
    STATUS_CHANGED:         { bg: '#edf8fc', text: '#14a0c8', border: '#d6f0f8' },
    ASSIGNED:               { bg: '#f5f5fc', text: '#3c3c8c', border: '#eeeef8' },
    RECATEGORIZED:          { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' },
    SLA_BREACHED:           { bg: '#fff1f2', text: '#dc2626', border: '#fee2e2' },
    AUTO_ESCALATED_CRITICAL:{ bg: '#fff1f2', text: '#dc2626', border: '#fee2e2' },
    COMMENT_ADDED:          { bg: '#faf3fa', text: '#783c78', border: '#f3e8f3' },
  };
  const style = actionColors[entry.action] ?? { bg: '#f9fafb', text: '#6b7280', border: '#f3f4f6' };

  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid #f9fafb' }}>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 mt-0.5"
        style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
        {entry.action.replace(/_/g, ' ')}
      </span>
      <div className="flex-1">
        <p className="text-xs text-gray-700">{entry.note}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {entry.changedBy} · {formatDateTime(entry.createdAt)}
        </p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   Role-based Actions Panel
══════════════════════════════════════════════════════ */
const SUPPORT_TRANSITIONS = { 'In Progress': ['Resolved'], 'Open': ['In Progress'] };
const MANAGER_TRANSITIONS  = { 'Resolved': ['Closed', 'In Progress'] };
const ADMIN_TRANSITIONS    = {
  'Open': ['In Progress'], 'In Progress': ['Resolved'],
  'Resolved': ['Closed', 'In Progress'],
};

const STATUS_BTN_COLORS = {
  Resolved:    { bg: '#059669', hover: '#047857' },
  Closed:      { bg: '#6b7280', hover: '#4b5563' },
  'In Progress':{ bg: '#3c3c8c', hover: '#252568' },
};

const ActionsPanel = ({ ticket, role, user, onUpdateStatus, onAssign, onAddComment, onRecategorize }) => {
  const [comment,   setComment]   = useState('');
  const [newCat,    setNewCat]    = useState('');
  const [assignTo,  setAssignTo]  = useState('');
  const [loading,   setLoading]   = useState('');
  const [success,   setSuccess]   = useState('');

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const supportStaff = MOCK_USERS.filter((u) => u.role === 'SUPPORT_STAFF' && u.status === 'ACTIVE');
  const CATEGORIES   = ['IT', 'HR', 'Admin', 'Facilities', 'Finance'];

  const transitions =
    role === 'SUPPORT_STAFF' ? SUPPORT_TRANSITIONS[ticket.status] ?? [] :
    role === 'MANAGER'       ? MANAGER_TRANSITIONS[ticket.status]  ?? [] :
    role === 'ADMIN'         ? ADMIN_TRANSITIONS[ticket.status]    ?? [] : [];

  const handleStatus = async (newStatus) => {
    setLoading('status');
    await new Promise((r) => setTimeout(r, 400));
    onUpdateStatus(ticket.id, newStatus);
    flash(`Status updated to "${newStatus}"`);
    setLoading('');
  };

  const handleAssign = async () => {
    if (!assignTo) return;
    setLoading('assign');
    await new Promise((r) => setTimeout(r, 400));
    onAssign(ticket.id, Number(assignTo));
    flash(`Assigned to ${getUserName(Number(assignTo))}`);
    setAssignTo('');
    setLoading('');
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading('comment');
    await new Promise((r) => setTimeout(r, 300));
    onAddComment(ticket.id, comment.trim(), user?.fullName);
    setComment('');
    flash('Comment posted.');
    setLoading('');
  };

  const handleRecategorize = async () => {
    if (!newCat) return;
    setLoading('recat');
    await new Promise((r) => setTimeout(r, 400));
    onRecategorize(ticket.id, newCat);
    flash(`Re-categorized to ${newCat}. SLA clock started.`);
    setNewCat('');
    setLoading('');
  };

  const selCls = 'flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white';

  if (role === 'EMPLOYEE') return null;

  return (
    <div className="space-y-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Actions</p>

      {/* Success flash */}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl animate-fade-in"
          style={{ background: '#f0fdf4', border: '1px solid #d1fae5' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-xs text-green-700">{success}</p>
        </div>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Update status</p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((s) => {
              const col = STATUS_BTN_COLORS[s] ?? { bg: '#3c3c8c', hover: '#252568' };
              return (
                <button key={s} onClick={() => handleStatus(s)}
                  disabled={loading === 'status'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white transition-all disabled:opacity-60"
                  style={{ background: col.bg }}
                  onMouseEnter={e => e.currentTarget.style.background = col.hover}
                  onMouseLeave={e => e.currentTarget.style.background = col.bg}>
                  {loading === 'status' ? 'Updating…' : `Mark as ${s}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Assign (Manager + Admin, only for Open/In Progress) */}
      {(role === 'MANAGER' || role === 'ADMIN') &&
       (ticket.status === 'Open' || ticket.status === 'In Progress') && (
        <div>
          <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Assign to support staff</p>
          <div className="flex gap-2">
            <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className={selCls}>
              <option value="">Select staff member…</option>
              {supportStaff.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName} — {s.department}</option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={!assignTo || loading === 'assign'}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-50 shrink-0"
              style={{ background: '#3c3c8c' }}
              onMouseEnter={e => e.currentTarget.style.background = '#252568'}
              onMouseLeave={e => e.currentTarget.style.background = '#3c3c8c'}>
              {loading === 'assign' ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      {/* Re-categorize (Admin only, Others tickets) */}
      {role === 'ADMIN' && ticket.category === 'Others' && (
        <div>
          <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Re-categorize</p>
          <div className="flex gap-2">
            <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className={selCls}>
              <option value="">Select department…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={handleRecategorize} disabled={!newCat || loading === 'recat'}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-50 shrink-0"
              style={{ background: '#d97706' }}>
              {loading === 'recat' ? 'Applying…' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* Add comment */}
      <div>
        <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Add comment</p>
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Type a comment…"
            className={selCls}
          />
          <button type="submit" disabled={!comment.trim() || loading === 'comment'}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-50 shrink-0"
            style={{ background: '#14a0c8' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0080b0'}
            onMouseLeave={e => e.currentTarget.style.background = '#14a0c8'}>
            {loading === 'comment' ? '…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   Main TicketDetailModal
══════════════════════════════════════════════════════ */
const TicketDetailModal = ({
  ticket: initialTicket,
  isOpen,
  onClose,
  role,
  user,
  onUpdateStatus,
  onAssign,
  onAddComment,
  onRecategorize,
}) => {
  const [ticket,      setTicket]      = useState(initialTicket);
  const [activeTab,   setActiveTab]   = useState('comments');

  /* Sync when parent passes updated ticket */
  useEffect(() => { setTicket(initialTicket); }, [initialTicket]);

  /* ESC to close */
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen || !ticket) return null;

  /* Wrap actions to update local state immediately */
  const handleUpdateStatus = (id, newStatus) => {
    onUpdateStatus(id, newStatus);
    setTicket((p) => ({
      ...p, status: newStatus,
      resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : p.resolvedAt,
      closedAt:   newStatus === 'Closed'   ? new Date().toISOString() : p.closedAt,
    }));
  };

  const handleAssign = (id, staffId) => {
    onAssign(id, staffId);
    setTicket((p) => ({ ...p, assignedTo: staffId, status: 'In Progress' }));
  };

  const handleAddComment = (id, text, author) => {
    onAddComment(id, text, author);
    const c = { id: Date.now(), author, text, createdAt: new Date().toISOString() };
    setTicket((p) => ({ ...p, comments: [...(p.comments ?? []), c] }));
    setActiveTab('comments');
  };

  const handleRecategorize = (id, cat) => {
    onRecategorize(id, cat);
    const slaHrs = { Low: 72, Medium: 48, High: 24, Critical: 4 };
    const slaDueAt = new Date(Date.now() + (slaHrs[ticket.priority] ?? 48) * 3600000).toISOString();
    setTicket((p) => ({ ...p, category: cat, department: cat, slaDueAt }));
  };

  /* Mock audit trail based on ticket state */
  const auditTrail = [
    { id: 1, action: 'CREATED', note: `Ticket created by ${getUserName(ticket.createdBy)}.`, changedBy: getUserName(ticket.createdBy), createdAt: ticket.createdAt },
    ...(ticket.assignedTo ? [{
      id: 2, action: 'ASSIGNED', note: `Assigned to ${getUserName(ticket.assignedTo)}.`,
      changedBy: 'System', createdAt: ticket.updatedAt,
    }] : []),
    ...(ticket.status === 'In Progress' ? [{
      id: 3, action: 'STATUS_CHANGED', note: 'Status changed from Open to In Progress.',
      changedBy: getUserName(ticket.assignedTo) || 'System', createdAt: ticket.updatedAt,
    }] : []),
    ...(ticket.isSlaBreached ? [{
      id: 4, action: 'SLA_BREACHED', note: 'SLA deadline passed without resolution.',
      changedBy: 'System', createdAt: ticket.slaDueAt,
    }] : []),
    ...(ticket.status === 'Resolved' ? [{
      id: 5, action: 'STATUS_CHANGED', note: 'Status changed to Resolved.',
      changedBy: getUserName(ticket.assignedTo) || 'System', createdAt: ticket.resolvedAt,
    }] : []),
    ...(ticket.status === 'Closed' ? [{
      id: 6, action: 'STATUS_CHANGED', note: 'Ticket closed.',
      changedBy: 'Manager', createdAt: ticket.closedAt,
    }] : []),
    ...(ticket.comments?.map((c, i) => ({
      id: 100 + i, action: 'COMMENT_ADDED', note: `Comment added by ${c.author}.`,
      changedBy: c.author, createdAt: c.createdAt,
    })) ?? []),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(26,26,78,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl animate-slide-up flex flex-col"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 32px 80px rgba(26,26,78,0.25), 0 8px 24px rgba(26,26,78,0.12)',
        }}>

        {/* ── Header ── */}
        <div className="flex items-start gap-4 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #f3f4f6' }}>
          {/* Left: ID + title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: '#f5f5fc', color: '#3c3c8c' }}>
                {ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-tight truncate">
              {ticket.title}
            </h2>
          </div>
          {/* Close */}
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex">

          {/* LEFT: meta + attachments + actions */}
          <div className="w-72 shrink-0 overflow-y-auto p-5 space-y-1"
            style={{ borderRight: '1px solid #f3f4f6' }}>

            {/* Meta */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Details</p>
            <MetaRow label="Category">{ticket.category}</MetaRow>
            <MetaRow label="Department">{ticket.department ?? '—'}</MetaRow>
            <MetaRow label="Priority"><PriorityBadge priority={ticket.priority} /></MetaRow>
            <MetaRow label="Status"><StatusBadge status={ticket.status} /></MetaRow>
            <MetaRow label="Created by">{getUserName(ticket.createdBy)}</MetaRow>
            <MetaRow label="Assigned to">{ticket.assignedTo ? getUserName(ticket.assignedTo) : <span className="text-gray-400 font-normal">Unassigned</span>}</MetaRow>
            <MetaRow label="Created">{formatDate(ticket.createdAt)}</MetaRow>
            <MetaRow label="Updated">{formatDate(ticket.updatedAt)}</MetaRow>
            {ticket.resolvedAt && <MetaRow label="Resolved">{formatDate(ticket.resolvedAt)}</MetaRow>}
            {ticket.closedAt   && <MetaRow label="Closed">{formatDate(ticket.closedAt)}</MetaRow>}

            {/* SLA */}
            <div className="pt-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">SLA</p>
              <SLAStatus slaDueAt={ticket.slaDueAt} isSlaBreached={ticket.isSlaBreached} status={ticket.status} />
            </div>

            {/* Attachments */}
            <div className="pt-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Attachments ({ticket.attachments?.length ?? 0})
              </p>
              {ticket.attachments?.length === 0 || !ticket.attachments ? (
                <p className="text-xs text-gray-400">No attachments.</p>
              ) : (
                <ul className="space-y-1.5">
                  {ticket.attachments.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                      style={{ background: '#f5f5fc', border: '1px solid #eeeef8' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#6363b8" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span className="truncate text-gray-700">{a.name ?? `File ${i + 1}`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Role-based actions */}
            <ActionsPanel
              ticket={ticket}
              role={role}
              user={user}
              onUpdateStatus={handleUpdateStatus}
              onAssign={handleAssign}
              onAddComment={handleAddComment}
              onRecategorize={handleRecategorize}
            />
          </div>

          {/* RIGHT: tabs — description + comments + audit */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Tab bar */}
            <div className="flex items-center px-5 pt-4 gap-1 shrink-0"
              style={{ borderBottom: '1px solid #f3f4f6' }}>
              {[
                { key: 'description', label: 'Description' },
                { key: 'comments',    label: `Comments (${ticket.comments?.length ?? 0})` },
                { key: 'audit',       label: 'Audit Trail' },
              ].map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="px-4 py-2 text-xs font-medium rounded-t-xl transition-colors relative"
                  style={activeTab === t.key
                    ? { color: '#3c3c8c', background: '#f5f5fc', borderBottom: '2px solid #3c3c8c' }
                    : { color: '#9ca3af' }
                  }>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* Description tab */}
              {activeTab === 'description' && (
                <div className="animate-fade-in">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Description</p>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap rounded-xl p-4"
                    style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                    {ticket.description || 'No description provided.'}
                  </div>
                </div>
              )}

              {/* Comments tab */}
              {activeTab === 'comments' && (
                <div className="animate-fade-in space-y-4">
                  {ticket.comments?.length === 0 || !ticket.comments ? (
                    <div className="text-center py-12">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="w-8 h-8 text-gray-300 mx-auto mb-3">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      <p className="text-sm text-gray-400">No comments yet.</p>
                      {role !== 'EMPLOYEE' && (
                        <p className="text-xs text-gray-400 mt-1">Use the Actions panel to add one.</p>
                      )}
                    </div>
                  ) : (
                    ticket.comments.map((c) => (
                      <CommentBubble
                        key={c.id}
                        comment={c}
                        isOwn={c.author === user?.fullName}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Audit Trail tab */}
              {activeTab === 'audit' && (
                <div className="animate-fade-in">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                    Change History
                  </p>
                  {auditTrail.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No audit entries.</p>
                  ) : (
                    <div className="space-y-0">
                      {auditTrail.map((entry) => (
                        <AuditEntry key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
