import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AssignedTicketQueue from '../../components/support/AssignedTicketQueue';
import { UpdateStatusPanel, CommentAttachmentPanel } from '../../components/support/SupportPanels';
import TicketDetailModal from '../../components/shared/TicketDetailModal';
import useTicketDetail from '../../hooks/useTicketDetail';
import { useAuthContext } from '../../context/AuthContext';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import { useTickets } from '../../hooks/useTickets';

/* ── Small stats bar for support staff ───────────────────── */
const SupportStatsBar = ({ stats, loading }) => {
  const cards = [
    {
      label: 'Open',
      value: stats.assignedOpenCount,
      bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100',
    },
    {
      label: 'In Progress',
      value: stats.assignedInProgressCount,
      bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100',
    },
    {
      label: 'Resolved',
      value: stats.assignedResolvedCount,
      bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {cards.map(({ label, value, bg, text, border }) => (
        <div
          key={label}
          className={`rounded-2xl border p-4 flex items-center gap-3 ${bg} ${border}`}
        >
          <div className="flex-1">
            <p className={`text-2xl font-bold leading-tight ${text}`}>
              {loading ? '—' : value}
            </p>
            <p className={`text-xs font-medium mt-0.5 ${text} opacity-80`}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const SupportQueue = () => {
  const { user } = useAuthContext();

  /* Support-specific hook for queue + stats */
  const {
    tickets,
    stats,
    loading,
    error,
    fetchAll,
  } = useSupportTickets();

  /* Still use useTickets for mutations (updateStatus, addComment etc.) */
  const { updateStatus, addComment, assignTicket, recategorize } =
    useTickets(user?.id, 'SUPPORT_STAFF');

  const [selected, setSelected] = useState(null);
  const { selected: modalTicket, openTicket, closeTicket } = useTicketDetail();

  /* ── Fetch on mount ─────────────────────────────────────── */
  useEffect(() => { fetchAll(); }, []);

  /* ── Keep side panel in sync after mutations ────────────── */
  const handleUpdateStatus = async (ticketId, newStatus) => {
    await updateStatus(ticketId, newStatus);
    setSelected(prev => prev?.id === ticketId ? { ...prev, status: newStatus } : prev);
  };

  const handleAddComment = async (ticketId, text, author) => {
    await addComment(ticketId, text, author);
    const newComment = {
      id: Date.now(), author, text, createdAt: new Date().toISOString(),
    };
    setSelected(prev =>
      prev?.id === ticketId
        ? { ...prev, comments: [...(prev.comments ?? []), newComment] }
        : prev
    );
  };

  const handleSelectTicket = (ticket) => {
    setSelected(ticket);
    openTicket(ticket);
  };

  return (
    <DashboardLayout title="My Queue">
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Queue</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Tickets assigned to you. Click any ticket to view details and take action.
          </p>
        </div>

        {/* Stats */}
        <SupportStatsBar stats={stats} loading={loading} />

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Queue list */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm
                py-16 flex flex-col items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-100 border-t-indigo-500 animate-spin"/>
                <span className="text-xs text-gray-400">Loading queue…</span>
              </div>
            ) : (
              <AssignedTicketQueue
                tickets={tickets}
                onSelectTicket={handleSelectTicket}
                selectedId={selected?.id}
              />
            )}
          </div>

          {/* Side detail panels */}
          <div className="lg:col-span-3 space-y-4">
            {selected ? (
              <>
                {/* Ticket summary card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-bold mb-1" style={{ color: '#3c3c8c' }}>
                        {selected.id}
                      </p>
                      <h3 className="text-base font-semibold text-gray-900">{selected.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selected.category}
                        {selected.department ? ` · ${selected.department}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Raised by <span className="font-medium text-gray-600">{selected.createdByName}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openTicket(selected)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                        style={{ color: '#3c3c8c', borderColor: '#eeeef8', background: '#f5f5fc' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eeeef8'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f5f5fc'}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Full details
                      </button>
                      <button
                        onClick={() => setSelected(null)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className="w-3.5 h-3.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {selected.description}
                  </p>
                </div>

                <UpdateStatusPanel ticket={selected} onUpdateStatus={handleUpdateStatus} />
                <CommentAttachmentPanel
                  ticket={selected}
                  onAddComment={handleAddComment}
                  authorName={user?.fullName}
                />
              </>
            ) : (
              <div className="h-72 flex items-center justify-center bg-white rounded-2xl
                border border-dashed border-gray-200">
                <div className="text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="w-8 h-8 text-gray-300 mx-auto mb-3">
                    <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                  </svg>
                  <p className="text-sm text-gray-400">Select a ticket from the queue</p>
                  <p className="text-xs text-gray-300 mt-1">Click any row to view details and take action</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full detail modal */}
      <TicketDetailModal
        ticket={modalTicket}
        isOpen={!!modalTicket}
        onClose={closeTicket}
        role={user?.role}
        user={user}
        onUpdateStatus={updateStatus}
        onAssign={assignTicket}
        onAddComment={addComment}
        onRecategorize={recategorize}
      />
    </DashboardLayout>
  );
};

export default SupportQueue;