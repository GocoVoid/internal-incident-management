import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TicketStatsBar from '../../components/employee/TicketStatsBar';
import CreateTicketModal from '../../components/employee/CreateTicketModal';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
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
  const { tickets, stats, createTicket } = useTickets(user?.id, 'EMPLOYEE');
  const [showCreate, setShowCreate] = useState(false);

  const recent = tickets.slice(0, 5);

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">

        {/* Welcome row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Good {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Here's your incident summary for today.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors shadow-pratiti-sm"
            style={{ background: 'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Ticket
          </button>
        </div>

        {/* Stats */}
        <TicketStatsBar stats={stats} />

        {/* Recent tickets */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h3 className="text-sm font-semibold text-gray-900">Recent Tickets</h3>
            <button onClick={() => navigate('/dashboard/employee/tickets')}
              className="text-xs font-medium hover:underline" style={{ color: '#14a0c8' }}>
              View all →
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No tickets raised yet.</p>
              <button onClick={() => setShowCreate(true)}
                className="mt-3 text-xs font-medium" style={{ color: '#3c3c8c' }}>
                Create your first ticket →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recent.map(t => (
                <li key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className="font-mono text-xs font-medium w-36 shrink-0" style={{ color: '#3c3c8c' }}>{t.id}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <CreateTicketModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSubmit={createTicket} />
    </DashboardLayout>
  );
};

export default EmployeeOverview;
