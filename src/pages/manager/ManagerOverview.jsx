import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { DeptKPICards, SLAHeatmap } from '../../components/manager/ManagerComponents';
import CreateTicketModal from '../../components/employee/CreateTicketModal';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { useNavigate } from 'react-router-dom';

const ManagerOverview = () => {
  const { user }   = useAuthContext();
  const navigate   = useNavigate();
  const { tickets, stats, createTicket } = useTickets(user?.id, 'MANAGER');
  const [showCreate, setShowCreate] = useState(false);

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.department} Department</h2>
            <p className="text-sm text-gray-500 mt-0.5">Department incident overview.</p>
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

        <DeptKPICards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SLAHeatmap tickets={tickets} />

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Assign open tickets', desc: `${stats.open} ticket${stats.open !== 1 ? 's' : ''} waiting for assignment`, to: '/dashboard/manager/assign', color: '#3c3c8c' },
                { label: 'View all dept tickets', desc: `${stats.total} total tickets`, to: '/dashboard/manager/tickets', color: '#14a0c8' },
                { label: 'View reports', desc: 'SLA compliance & volume trends', to: '/dashboard/manager/reports', color: '#783c78' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.to)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group">
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">{a.label}</p>
                    <p className="text-xs text-gray-500">{a.desc}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent tickets */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            <button onClick={() => navigate('/dashboard/manager/tickets')}
              className="text-xs font-medium hover:underline" style={{ color: '#14a0c8' }}>
              View all →
            </button>
          </div>
          <ul className="divide-y divide-gray-50">
            {tickets.slice(0, 5).map(t => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className="font-mono text-xs font-medium w-36 shrink-0" style={{ color: '#3c3c8c' }}>{t.id}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{t.title}</span>
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <CreateTicketModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSubmit={createTicket} />
    </DashboardLayout>
  );
};

export default ManagerOverview;
