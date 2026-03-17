import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AssignedTicketQueue from '../../components/support/AssignedTicketQueue';
import { UpdateStatusPanel, CommentAttachmentPanel } from '../../components/support/SupportPanels';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';

const SupportDashboard = () => {
  const { user } = useAuthContext();
  const { tickets, stats, updateStatus, addComment } = useTickets(user?.id, 'SUPPORT_STAFF');
  const [selected, setSelected] = useState(null);

  /* Keep selected in sync after updates */
  const handleUpdateStatus = (ticketId, newStatus) => {
    updateStatus(ticketId, newStatus);
    setSelected((prev) => prev ? { ...prev, status: newStatus } : null);
  };

  const handleAddComment = (ticketId, text, author) => {
    addComment(ticketId, text, author);
    const newComment = { id: Date.now(), author, text, createdAt: new Date().toISOString() };
    setSelected((prev) => prev
      ? { ...prev, comments: [...(prev.comments ?? []), newComment] }
      : null
    );
  };

  return (
    <DashboardLayout title="My Queue">
      <div className="space-y-6 animate-fade-in">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Assigned to me', value: stats.total,      color: 'bg-indigo-50 text-indigo-700' },
            { label: 'In Progress',    value: stats.inProgress,  color: 'bg-amber-50  text-amber-700'  },
            { label: 'Resolved today', value: stats.resolved,    color: 'bg-green-50  text-green-700'  },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-4 flex items-center gap-3">
              <span className={`text-2xl font-semibold ${s.color.split(' ')[1]}`}>{s.value}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Main: queue + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Queue list */}
          <div className="lg:col-span-2">
            <AssignedTicketQueue
              tickets={tickets}
              onSelectTicket={setSelected}
              selectedId={selected?.id}
            />
          </div>

          {/* Detail panels */}
          <div className="lg:col-span-3 space-y-4">
            {selected ? (
              <>
                {/* Ticket meta */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-mono text-xs text-indigo-600 mb-1">{selected.id}</p>
                      <h3 className="text-base font-semibold text-gray-900">{selected.title}</h3>
                    </div>
                    <button onClick={() => setSelected(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
                </div>

                <UpdateStatusPanel
                  ticket={selected}
                  onUpdateStatus={handleUpdateStatus}
                />

                <CommentAttachmentPanel
                  ticket={selected}
                  onAddComment={handleAddComment}
                  authorName={user?.fullName}
                />
              </>
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="w-8 h-8 text-gray-300 mx-auto mb-3">
                    <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                  </svg>
                  <p className="text-sm text-gray-400">Select a ticket to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportDashboard;
