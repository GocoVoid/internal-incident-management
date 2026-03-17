import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { useNavigate } from 'react-router-dom';

const SLAChip = ({ slaDueAt, isSlaBreached }) => {
  if (!slaDueAt) return <span className="text-xs text-gray-400">—</span>;
  const diff = new Date(slaDueAt) - Date.now();
  if (isSlaBreached || diff <= 0)
    return <span className="text-xs font-semibold text-red-600">Breached</span>;
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return (
    <span className={`text-xs font-semibold ${hrs < 2 ? 'text-orange-600' : 'text-green-600'}`}>
      {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
    </span>
  );
};

const SupportOverview = () => {
  const { user }    = useAuthContext();
  const navigate    = useNavigate();
  const { tickets, stats } = useTickets(user?.id, 'SUPPORT_STAFF');

  const urgent = tickets.filter(t =>
    !t.isSlaBreached && t.slaDueAt && (new Date(t.slaDueAt) - Date.now()) < 2 * 3600000
  );
  const breached = tickets.filter(t => t.isSlaBreached);

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Your current workload at a glance.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Assigned', value: stats.total,      color: '#3c3c8c', bg: '#f0f0fa' },
            { label: 'In Progress',    value: stats.inProgress,  color: '#d97706', bg: '#fffbeb' },
            { label: 'Resolved',       value: stats.resolved,    color: '#059669', bg: '#f0fdf4' },
            { label: 'SLA Breached',   value: breached.length,   color: '#dc2626', bg: '#fff1f2' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.bg }}>
                <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {(breached.length > 0 || urgent.length > 0) && (
          <div className="space-y-3">
            {breached.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <p className="text-xs text-red-700 font-medium">
                  {breached.length} ticket{breached.length > 1 ? 's have' : ' has'} breached SLA. Resolve immediately.
                </p>
                <button onClick={() => navigate('/dashboard/support/queue')}
                  className="ml-auto text-xs font-semibold text-red-600 hover:underline shrink-0">
                  View queue →
                </button>
              </div>
            )}
            {urgent.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  {urgent.length} ticket{urgent.length > 1 ? 's are' : ' is'} approaching SLA deadline (under 2h).
                </p>
              </div>
            )}
          </div>
        )}

        {/* Queue preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h3 className="text-sm font-semibold text-gray-900">Queue Preview</h3>
            <button onClick={() => navigate('/dashboard/support/queue')}
              className="text-xs font-medium hover:underline" style={{ color: '#14a0c8' }}>
              Open full queue →
            </button>
          </div>
          {tickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">Your queue is empty. 🎉</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {tickets.slice(0, 5).map(t => (
                <li key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className="font-mono text-xs font-medium w-36 shrink-0" style={{ color: '#3c3c8c' }}>{t.id}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  <SLAChip slaDueAt={t.slaDueAt} isSlaBreached={t.isSlaBreached} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportOverview;
