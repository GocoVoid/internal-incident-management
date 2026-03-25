import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TicketStatsBar from '../../components/employee/TicketStatsBar';
import CreateTicketModal from '../../components/employee/CreateTicketModal';
import TicketDetailModal from '../../components/shared/TicketDetailModal';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import useTicketDetail from '../../hooks/useTicketDetail';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { useNavigate } from 'react-router-dom';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

const EmployeeOverview = () => {
  const { user }   = useAuthContext();
  const navigate   = useNavigate();
  const { tickets, stats, createTicket, updateStatus, assignTicket, addComment, recategorize } =
    useTickets(user?.id, 'EMPLOYEE');
  const [showCreate, setShowCreate] = useState(false);
  const { selected, openTicket, closeTicket } = useTicketDetail();

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Good {getGreeting()}, {user?.fullName?.split(' ')[0]}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Here's your incident summary for today.</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-pratiti-sm"
            style={{ background: 'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Ticket
          </button>
        </div>

        <TicketStatsBar stats={stats} />

        {/* Recent tickets */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h3 className="text-sm font-semibold text-gray-900">Recent Tickets</h3>
            <button onClick={() => navigate('/dashboard/employee/tickets')}
              className="text-xs font-medium hover:underline" style={{ color: '#14a0c8' }}>
              View all →
            </button>
          </div>
          {tickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No tickets raised yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {tickets.slice(0, 5).map((t) => (
                <li key={t.id} onClick={() => openTicket(t)}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-indigo-50/30 transition-colors cursor-pointer group">
                  <span className="font-mono text-xs font-medium w-36 shrink-0 group-hover:text-indigo-700 transition-colors" style={{ color: '#3c3c8c' }}>{t.id}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate group-hover:text-indigo-700 transition-colors">{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <CreateTicketModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSubmit={createTicket} />
      <TicketDetailModal
        ticket={selected} isOpen={!!selected} onClose={closeTicket}
        role={user?.role} user={user}
        onUpdateStatus={updateStatus} onAssign={assignTicket}
        onAddComment={addComment} onRecategorize={recategorize}
      />
    </DashboardLayout>
  );
};

export default EmployeeOverview;
