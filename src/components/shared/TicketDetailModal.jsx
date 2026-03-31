import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge, PriorityBadge } from './TicketBadge';
import { useSupportStaff } from '../../hooks/useUsers';
import { CATEGORY_LIST } from '../../data/mockData';
import { getAuditLog, getComments, getResolutionNote, saveResolutionNote } from '../../services/incidentService';

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

/* Names are now resolved from ticket payload — createdByName / assignedToName
   set by the backend; fallback to IDs only if missing */
const resolveName = (nameField, idField) => {
  if (nameField) return nameField;
  if (!idField) return '—';
  // idField may be an object { id, name } from the API
  if (typeof idField === 'object') return idField.name ?? idField.fullName ?? `User #${idField.id ?? '?'}`;
  return `User #${idField}`;
};

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
        {comment.isInternal && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Internal</span>
        )}
        <span className="text-[10px] text-gray-400">{formatDateTime(comment.createdAt)}</span>
      </div>
      <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed text-gray-700 ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
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
    CREATED:                 { bg: '#f0fdf4', text: '#059669', border: '#d1fae5' },
    STATUS_CHANGED:          { bg: '#edf8fc', text: '#14a0c8', border: '#d6f0f8' },
    ASSIGNED:                { bg: '#f5f5fc', text: '#3c3c8c', border: '#eeeef8' },
    RECATEGORIZED:           { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' },
    SLA_BREACHED:            { bg: '#fff1f2', text: '#dc2626', border: '#fee2e2' },
    AUTO_ESCALATED_CRITICAL: { bg: '#fff1f2', text: '#dc2626', border: '#fee2e2' },
    COMMENT_ADDED:           { bg: '#faf3fa', text: '#783c78', border: '#f3e8f3' },
    RESOLUTION_NOTE_ADDED:   { bg: '#f0fdf4', text: '#059669', border: '#d1fae5' },
    RESOLUTION_NOTE_UPDATED: { bg: '#f0fdf4', text: '#059669', border: '#d1fae5' },
  };
  const style = actionColors[entry.action] ?? { bg: '#f9fafb', text: '#6b7280', border: '#f3f4f6' };
  const note  = entry.oldValue && entry.newValue
    ? `${entry.action.replace(/_/g, ' ')}: "${entry.oldValue}" → "${entry.newValue}"`
    : entry.action.replace(/_/g, ' ');

  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid #f9fafb' }}>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 mt-0.5"
        style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
        {entry.action.replace(/_/g, ' ')}
      </span>
      <div className="flex-1">
        <p className="text-xs text-gray-700">{note}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {entry.changedByName ?? `User #${entry.changedBy}`} · {formatDateTime(entry.createdAt)}
        </p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   Actions Panel
══════════════════════════════════════════════════════ */
const SUPPORT_TRANSITIONS = { 'In Progress': ['Resolved'], 'Open': ['In Progress'] };
const MANAGER_TRANSITIONS  = { 'Resolved': ['Closed', 'In Progress'] };
const ADMIN_TRANSITIONS    = {
  'Open': ['In Progress'], 'In Progress': ['Resolved'],
  'Resolved': ['Closed', 'In Progress'],
};
const STATUS_BTN_COLORS = {
  Resolved:      { bg: '#059669', hover: '#047857' },
  Closed:        { bg: '#6b7280', hover: '#4b5563' },
  'In Progress': { bg: '#3c3c8c', hover: '#252568' },
};

/* ══════════════════════════════════════════════════════
   Priority Select — styled to match PriorityBadge
══════════════════════════════════════════════════════ */
const PRIORITY_CONFIG = {
  Low:      { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
  Medium:   { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b' },
  High:     { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', dot: '#f97316' },
  Critical: { bg: '#fff1f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
};

const PrioritySelect = ({ value, onChange }) => {
  const cfg = PRIORITY_CONFIG[value] ?? { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb', dot: '#9ca3af' };
  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 cursor-pointer"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs font-medium appearance-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 cursor-pointer pl-0.5 pr-4 py-0.5"
        style={{ color: cfg.text }}>
        {['Low', 'Medium', 'High', 'Critical'].map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {/* chevron */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className="w-2.5 h-2.5 pointer-events-none absolute right-2"
        style={{ color: cfg.text }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
};

/* ── Resolution Note Panel ─────────────────────────── */
const ResolutionNotePanel = ({ ticket, role, user, onSaveResolutionNote }) => {
  const canEdit = role === 'SUPPORT_STAFF';
  const canView = role === 'SUPPORT_STAFF' || role === 'MANAGER' || role === 'ADMIN';

  const [note,    setNote]    = useState(ticket.resolutionNote ?? '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* Sync if ticket prop changes (e.g. after fetch) */
  useEffect(() => { setNote(ticket.resolutionNote ?? ''); }, [ticket.resolutionNote]);

  if (!canView) return null;

  const handleSave = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      await onSaveResolutionNote(ticket.id, note.trim());
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setLoading(false); }
  };

  const handleCancel = () => {
    setNote(ticket.resolutionNote ?? '');
    setEditing(false);
  };

  return (
    <div className="rounded-xl p-4 space-y-2"
      style={{ background: '#f0fdf4', border: '1px solid #d1fae5' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          <span className="text-xs font-semibold text-green-800 uppercase tracking-widest">Resolution Note</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
            Staff · Manager · Admin
          </span>
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)}
            className="text-[10px] px-2 py-0.5 rounded-lg text-green-700 hover:bg-green-100 transition-colors font-medium">
            {note ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>

      {/* Success flash */}
      {success && (
        <p className="text-xs text-green-700 flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Resolution note saved.
        </p>
      )}

      {/* View / Edit */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
            placeholder="Describe how this ticket was resolved…"
            className="w-full px-3 py-2 text-xs rounded-xl border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white resize-none leading-relaxed text-gray-700"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!note.trim() || loading}
              className="flex-1 py-1.5 rounded-xl text-xs font-medium text-white disabled:opacity-50 transition-colors"
              style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
              {loading ? 'Saving…' : 'Save Note'}
            </button>
            <button onClick={handleCancel} disabled={loading}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-green-700 bg-white border border-green-200 hover:bg-green-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : note ? (
        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{note}</p>
      ) : (
        <p className="text-xs text-green-600 italic">
          {canEdit ? 'No resolution note yet. Click "+ Add" to add one.' : 'No resolution note added yet.'}
        </p>
      )}
    </div>
  );
};

const ActionsPanel = ({ ticket, role, user, onUpdateStatus, onAssign, onAddComment, onRecategorize, onUpdatePriority, onSaveResolutionNote }) => {
  const [comment,  setComment]  = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [assignTo, setAssignTo] = useState('');
  const [loading,    setLoading]    = useState('');
  const [success,    setSuccess]    = useState('');

  const { staff: supportStaff } = useSupportStaff(ticket.department);
  

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const transitions =
    role === 'SUPPORT_STAFF' ? SUPPORT_TRANSITIONS[ticket.status] ?? [] :
    role === 'MANAGER'       ? MANAGER_TRANSITIONS[ticket.status]  ?? [] :
    role === 'ADMIN'         ? ADMIN_TRANSITIONS[ticket.status]    ?? [] : [];

  const handleStatus = async (newStatus) => {
    setLoading('status');
    try {
      await onUpdateStatus(ticket.id, newStatus);
      flash(`Status updated to "${newStatus}"`);
    } finally { setLoading(''); }
  };

  const handleAssign = async () => {
    if (!assignTo) return;
    setLoading('assign');
    try {
      const staff = supportStaff.find(s => s.id === Number(assignTo));
      const staffName = staff?.name ?? staff?.fullName ?? null;
      await onAssign(ticket.id, Number(assignTo), ticket.category, staffName);
      flash(`Assigned to ${staffName ?? 'staff member'}`);
      setAssignTo('');
    } finally { setLoading(''); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading('comment');
    try {
      const response = await onAddComment(ticket.id, comment.trim(), user?.fullName, isInternal);
      // console.log(response);
      // console.log(isInternal," in TicketDetailModal (231)");
      setComment('');
      setIsInternal(false);
      flash('Comment posted.');
    } finally { setLoading(''); }
  };

  const selCls = 'flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white';

  //if (role === 'EMPLOYEE') return null;

  return (
    <div className="space-y-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Actions</p>

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
                <button key={s} onClick={() => handleStatus(s)} disabled={loading === 'status'}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-all disabled:opacity-60"
                  style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
                  {loading === 'status' ? 'Updating…' : `Mark as ${s}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Assign — ADMIN only; Manager uses dedicated Assign page in sidebar */}
      {role === 'ADMIN' &&
       (ticket.status === 'Open' || ticket.status === 'In Progress') && (
        <div>
          <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Assign to support staff</p>
          <div className="space-y-2">
            <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className={selCls + ' w-full'}>
              <option value="">Select staff member…</option>
              {supportStaff.map(s => (
                <option key={s.id} value={s.id}>{s.name ?? s.fullName} — {s.department}</option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={!assignTo || loading === 'assign'}
              className="w-full py-1.5 rounded-xl text-xs font-medium text-white disabled:opacity-50 transition-colors"
              style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
              {loading === 'assign' ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      {/* Add comment */}
      <div>
        <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Add comment</p>
        <form onSubmit={handleComment} className="space-y-2">
          <input value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Type a comment…" className={selCls + ' w-full'} />
          {(role === 'SUPPORT_STAFF' || role === 'MANAGER' || role === 'ADMIN') && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                className="w-3.5 h-3.5 rounded" />
              <span className="text-xs text-gray-500">Internal note (not visible to employee)</span>
            </label>
          )}
          <button type="submit" disabled={!comment.trim() || loading === 'comment'}
            className="w-full py-1.5 rounded-xl text-xs font-medium text-white disabled:opacity-50 transition-colors"
            style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
            {loading === 'comment' ? 'Posting…' : 'Post Comment'}
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
  ticket: initialTicket, isOpen, onClose,
  role, user, onUpdateStatus, onAssign, onAddComment, onRecategorize, onUpdatePriority, onSaveResolutionNote,
}) => {
  const [ticket,    setTicket]    = useState(initialTicket);
  const [activeTab, setActiveTab] = useState('comments');
  const [auditLog,  setAuditLog]  = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [resolutionNote, setResolutionNote] = useState(initialTicket?.resolutionNote ?? '');

  useEffect(() => { setTicket(initialTicket); setResolutionNote(initialTicket?.resolutionNote ?? ''); }, [initialTicket]);

  /* Fetch comments from server when comments tab opened */
  const fetchComments = useCallback(async () => {
    if (!ticket?.id) return;
    setCommentsLoading(true);
    try {
      const data = await getComments(ticket.id);
      const normalised = (data ?? []).map(cm => ({
        id:         cm.id,
        author:     cm.user?.name ?? cm.user?.fullName ?? 'Unknown',
        text:       cm.commentText ?? cm.text ?? '',
        isInternal: cm.isInternal ?? false,
        createdAt:  cm.createdAt,
      }));
      setTicket(p => ({ ...p, comments: normalised }));
    } catch { /* keep existing */ }
    finally { setCommentsLoading(false); }
  }, [ticket?.id]);

  /* Fetch comments once when modal opens / ticket changes */
  useEffect(() => {
    if (isOpen && ticket?.id) fetchComments();
  }, [isOpen, ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Re-fetch only when switching TO comments tab (not on every render) */
  const prevTabRef = React.useRef(activeTab);
  useEffect(() => {
    if (activeTab === 'comments' && prevTabRef.current !== 'comments') fetchComments();
    prevTabRef.current = activeTab;
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Fetch audit log when audit tab opened (MANAGER/ADMIN only) */
  const fetchAudit = useCallback(async () => {
    if (!ticket?.id || (role !== 'MANAGER' && role !== 'ADMIN')) return;
    setAuditLoading(true);
    try {
      const data = await getAuditLog(ticket.id);
      setAuditLog(data ?? []);
    } catch { setAuditLog([]); }
    finally { setAuditLoading(false); }
  }, [ticket?.id, role]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAudit();
  }, [activeTab, fetchAudit]);

  /* Fetch resolution note when modal opens (SUPPORT_STAFF / MANAGER / ADMIN only) */
  const fetchResolutionNote = useCallback(async () => {
    if (!ticket?.id) return;
    if (role !== 'SUPPORT_STAFF' && role !== 'MANAGER' && role !== 'ADMIN') return;
    try {
      const data = await getResolutionNote(ticket.id);
      // console.log(data[0].note);
      const note = data[0]?.note ?? '';
      setResolutionNote(note);
      setTicket(p => ({ ...p, resolutionNote: note }));
    } catch { /* keep existing */ }
  }, [ticket?.id, role]);

  useEffect(() => {
    if (isOpen && ticket?.id) fetchResolutionNote();
  }, [isOpen, ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Handle save resolution note — optimistic update */
  const handleSaveResolutionNote = async (id, note) => {
    await onSaveResolutionNote(id, note);
    setResolutionNote(note);
    setTicket(p => ({ ...p, resolutionNote: note }));
  };


  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen || !ticket) return null;

  /* Wrap actions to optimistically update local state */
  const handleUpdateStatus = async (id, newStatus) => {
    await onUpdateStatus(id, newStatus);
    const now = new Date().toISOString();
    setTicket(p => ({
      ...p, status: newStatus, updatedAt: now,
      resolvedAt: newStatus === 'Resolved' ? now : p.resolvedAt,
      closedAt:   newStatus === 'Closed'   ? now : p.closedAt,
    }));
  };

  const handleAssign = async (id, staffId, category, staffName) => {
    await onAssign(id, staffId, category, staffName);
    setTicket(p => ({ ...p, assignedTo: staffId, assignedToName: staffName ?? p.assignedToName, status: 'In Progress' }));
  };

  const handleUpdatePriority = async (id, priority) => {
    await onUpdatePriority?.(id, priority);
    setTicket(p => ({ ...p, priority }));
  };

  const handleAddComment = async (id, text, author, isInternal) => {
    await onAddComment(id, text, author, isInternal);
    const c = { id: Date.now(), author, text, isInternal, createdAt: new Date().toISOString() };
    setTicket(p => ({ ...p, comments: [...(p.comments ?? []), c] }));
    // Do NOT change tab or re-fetch — optimistic update above is sufficient
  };

  const handleRecategorize = async (id, catId) => {
    await onRecategorize(id, catId);
    /* onRecategorize calls fetchAll() in context — close modal so the
       refreshed ticket list is immediately visible without manual reload */
    onClose();
  };

  const createdByName  = resolveName(ticket.createdByName,  ticket.createdBy);
  const assignedToName = ticket.assignedTo
    ? resolveName(ticket.assignedToName, ticket.assignedTo)
    : null;

  const tabs = [
    { key: 'description', label: 'Description' },
    { key: 'comments',    label: `Comments (${ticket.comments?.length ?? 0})` },
    ...(role === 'SUPPORT_STAFF' || role === 'MANAGER' || role === 'ADMIN'
      ? [{ key: 'resolution', label: 'Resolution Note' }]
      : []),
    ...(role === 'MANAGER' || role === 'ADMIN'
      ? [{ key: 'audit', label: 'Audit Trail' }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-3" style={{ paddingTop: "0" }}>
      <div className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(26,26,78,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />

      <div className="relative w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl animate-slide-up flex flex-col"
        style={{ maxHeight: 'calc(100vh - 0px)', height: '100dvh', boxShadow: '0 32px 80px rgba(26,26,78,0.25), 0 8px 24px rgba(26,26,78,0.12)' }}
        ref={el => { if (el) { if (window.innerWidth >= 640) { el.style.height = ''; el.style.maxHeight = 'calc(100vh - 80px)'; } else { el.style.height = '92dvh'; el.style.maxHeight = ''; } } }}>

        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: '#f5f5fc', color: '#3c3c8c' }}>{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-tight truncate">{ticket.title}</h2>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">

          {/* Left: meta + actions */}
          <div className="w-full sm:w-1/3 shrink-0 overflow-y-auto p-4 sm:p-5 space-y-1 border-b sm:border-b-0 sm:border-r border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Details</p>
            <MetaRow label="Category">{ticket.category}</MetaRow>
            <MetaRow label="Department">{ticket.department ?? '—'}</MetaRow>
            <MetaRow label="Priority">
              {(role === 'MANAGER' || role === 'ADMIN') ? (
                <PrioritySelect
                  value={ticket.priority}
                  onChange={val => handleUpdatePriority(ticket.id, val)}
                />
              ) : (
                <PriorityBadge priority={ticket.priority} />
              )}
            </MetaRow>
            <MetaRow label="Status"><StatusBadge status={ticket.status} /></MetaRow>
            <MetaRow label="Created by">{createdByName}</MetaRow>
            {/* <MetaRow label="Assigned to">
              {assignedToName ?? <span className="text-gray-400 font-normal">Unassigned</span>}
            </MetaRow> */}
            <MetaRow label="Created">{formatDate(ticket.createdAt)}</MetaRow>
            <MetaRow label="Updated">{formatDate(ticket.updatedAt)}</MetaRow>
            {ticket.resolvedAt && <MetaRow label="Resolved">{formatDate(ticket.resolvedAt)}</MetaRow>}
            {ticket.closedAt   && <MetaRow label="Closed">{formatDate(ticket.closedAt)}</MetaRow>}

            <div className="pt-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">SLA</p>
              <SLAStatus slaDueAt={ticket.slaDueAt} isSlaBreached={ticket.isSlaBreached} status={ticket.status} />
            </div>

            <div className="pt-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Attachments ({ticket.attachments?.length ?? 0})
              </p>
              {!ticket.attachments?.length ? (
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
                      <a href={`https://iimp-backend.duckdns.org${a.fileUrl}` ?? '#'} target="_blank" rel="noopener noreferrer"
                        className="truncate text-indigo-600 hover:underline">
                        {a.fileName ?? `File ${i + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ActionsPanel
              ticket={ticket} role={role} user={user}
              onUpdateStatus={handleUpdateStatus}
              onAssign={handleAssign}
              onAddComment={handleAddComment}
              onRecategorize={handleRecategorize}
              onUpdatePriority={handleUpdatePriority}
              onSaveResolutionNote={handleSaveResolutionNote}
            />
          </div>

          {/* Right: tabs */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center px-3 sm:px-5 pt-4 gap-1 shrink-0 overflow-x-auto"
              style={{ borderBottom: '1px solid #f3f4f6' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="px-3 sm:px-4 py-2 text-xs font-medium rounded-t-xl transition-colors whitespace-nowrap shrink-0"
                  style={activeTab === t.key
                    ? { color: '#3c3c8c', background: '#f5f5fc', borderBottom: '2px solid #3c3c8c' }
                    : { color: '#9ca3af' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">

              {activeTab === 'description' && (
                <div className="animate-fade-in">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Description</p>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap rounded-xl p-4"
                    style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                    {ticket.description || 'No description provided.'}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="animate-fade-in space-y-4">
                  {commentsLoading ? (
                    <p className="text-xs text-gray-400 text-center py-8">Loading comments…</p>
                  ) : !ticket.comments?.length ? (
                    <div className="text-center py-12">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="w-8 h-8 text-gray-300 mx-auto mb-3">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      <p className="text-sm text-gray-400">No comments yet.</p>
                    </div>
                  ) : (
                    ticket.comments
                      .map(c => (
                        <CommentBubble key={c.id} comment={c} isOwn={c.author === user?.fullName} />
                      ))
                  )}
                </div>
              )}

              {activeTab === 'resolution' && (
                <div className="animate-fade-in">
                  {/* <div className="flex items-center gap-2 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Resolution Note</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      Staff · Manager · Admin only
                    </span>
                  </div> */}
                  {resolutionNote ? (
                    <div className="rounded-xl p-4 space-y-3"
                      style={{ background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                        <span className="text-xs font-semibold text-green-800">How it was resolved</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{resolutionNote}</p>
                      {ticket.resolvedAt && (
                        <p className="text-[10px] text-green-600">Resolved on {formatDateTime(ticket.resolvedAt)}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="w-8 h-8 text-gray-300 mx-auto mb-3">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                      </svg>
                      <p className="text-sm text-gray-400">No resolution note yet.</p>
                      {/* {role === 'SUPPORT_STAFF' && (
                        <p className="text-xs text-gray-400 mt-1">Use the panel on the left to add one.</p>
                      )} */}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="animate-fade-in">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Change History</p>
                  {auditLoading ? (
                    <p className="text-xs text-gray-400 text-center py-8">Loading audit trail…</p>
                  ) : !auditLog.length ? (
                    <p className="text-sm text-gray-400 text-center py-8">No audit entries.</p>
                  ) : (
                    <div className="space-y-0">
                      {auditLog.map(entry => <AuditEntry key={entry.id} entry={entry} />)}
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