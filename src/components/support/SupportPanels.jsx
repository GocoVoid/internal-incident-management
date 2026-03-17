import React, { useState } from 'react';
import { StatusBadge, PriorityBadge } from '../shared/TicketBadge';

/* ── Allowed transitions for Support Staff ──────────────── */
const SUPPORT_TRANSITIONS = {
  'In Progress': ['Resolved'],
  'Open':        ['In Progress'],
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/* ── Update Status Panel ────────────────────────────────── */
export const UpdateStatusPanel = ({ ticket, onUpdateStatus }) => {
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  if (!ticket) return null;

  const allowed = SUPPORT_TRANSITIONS[ticket.status] ?? [];

  const handleUpdate = async (newStatus) => {
    setLoading(true);
    setSuccess('');
    await new Promise((r) => setTimeout(r, 500));
    onUpdateStatus(ticket.id, newStatus, note);
    setSuccess(`Status updated to "${newStatus}"`);
    setNote('');
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Update Status</h3>

      {/* Ticket summary */}
      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
        <p className="text-xs font-mono text-indigo-600">{ticket.id}</p>
        <p className="text-sm font-medium text-gray-800">{ticket.title}</p>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Resolution note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Describe what was done to resolve this issue…"
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
        />
      </div>

      {/* Action buttons */}
      {allowed.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allowed.map((s) => (
            <button
              key={s}
              onClick={() => handleUpdate(s)}
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-60
                ${s === 'Resolved'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                }`}
            >
              {loading ? 'Updating…' : `Mark as ${s}`}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">No status transitions available</p>
      )}

      {success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-green-600">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-xs text-green-700">{success}</p>
        </div>
      )}
    </div>
  );
};

/* ── Comment & Attachment Panel ─────────────────────────── */
export const CommentAttachmentPanel = ({ ticket, onAddComment, authorName }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [files,   setFiles]   = useState([]);

  if (!ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    onAddComment(ticket.id, comment.trim(), authorName);
    setComment('');
    setFiles([]);
    setLoading(false);
  };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files).slice(0, 5 - (ticket.attachments?.length ?? 0));
    setFiles((p) => [...p, ...picked].slice(0, 5));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Comments & Attachments</h3>

      {/* Existing comments */}
      <div className="space-y-3 max-h-52 overflow-y-auto">
        {ticket.comments?.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first.</p>
        )}
        {ticket.comments?.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-semibold text-indigo-700 shrink-0 mt-0.5">
              {c.author.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-800">{c.author}</span>
                <span className="text-[10px] text-gray-400">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
        />

        {/* File upload */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Attach file
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
              onChange={handleFiles} className="hidden" />
          </label>
          {files.length > 0 && (
            <span className="text-xs text-gray-500">{files.length} file(s) selected</span>
          )}
        </div>

        <button
          type="submit"
          disabled={!comment.trim() || loading}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Posting…' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
};
