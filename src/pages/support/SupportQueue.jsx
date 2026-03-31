import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AssignedTicketQueue from '../../components/support/AssignedTicketQueue';
import { UpdateStatusPanel, CommentAttachmentPanel } from '../../components/support/SupportPanels';
import { useAuthContext } from '../../context/AuthContext';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import { useTickets } from '../../hooks/useTickets';
import { SupportKPICards, SystemKPICards } from '../../components/admin/AdminComponents';
import { LoadingState } from '../../components/shared/PageState';

const SupportQueue = () => {
  const { user } = useAuthContext();

  const { tickets, stats, loading, error, fetchAll } = useSupportTickets();
  const { updateStatus, addComment } = useTickets(user?.id, 'SUPPORT_STAFF');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const handleUpdateStatus = async (ticketId, newStatus, note) => {
    await updateStatus(ticketId, newStatus, note);
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

  return (
    <DashboardLayout title="My Queue">
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Queue</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Select a ticket to update its status or add a comment.
          </p>
        </div>

        {/* Stats strip */}
        {/* <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Open',        value: stats.assignedOpenCount,       bg: 'bg-cyan-50',   text: 'text-cyan-700'   },
            { label: 'In Progress', value: stats.assignedInProgressCount, bg: 'bg-amber-50',  text: 'text-amber-700'  },
            { label: 'Resolved',    value: stats.assignedResolvedCount,   bg: 'bg-green-50',  text: 'text-green-700'  },
          ].map(({ label, value, bg, text }) => (
            <div key={label}
              className={`rounded-2xl border p-4 flex items-center gap-3 ${bg}`}>
              <span className={`text-2xl font-bold leading-tight ${text}`}>
                {loading ? '—' : value}
              </span>
              <span className={`text-xs font-medium ${text} opacity-80`}>{label}</span>
            </div>
          ))}
        </div> */}
        <SupportKPICards stats={stats}/>

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
              <LoadingState/>
            ) : (
              <AssignedTicketQueue
                tickets={tickets}
                onSelectTicket={setSelected}
                selectedId={selected?.id}
              />
            )}
          </div>

          {/* Detail panels */}
          <div className="lg:col-span-3 space-y-4">
            {selected ? (
              <>
                {/* Ticket meta card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-bold mb-1" style={{ color: '#3c3c8c' }}>
                        {selected.id}
                      </p>
                      <h3 className="text-base font-semibold text-gray-900">{selected.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selected.category}{selected.department ? ` · ${selected.department}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Raised by{' '}
                        <span className="font-medium text-gray-600">{selected.createdByName}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                        hover:bg-gray-100 transition-colors shrink-0"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className="w-8 h-8 text-gray-300 mx-auto mb-3">
                    <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                  </svg>
                  <p className="text-sm text-gray-400">Select a ticket from the queue</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Click any row to view details and take action
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportQueue;