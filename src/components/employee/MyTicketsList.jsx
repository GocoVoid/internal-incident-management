import React, { useState } from 'react';
import { StatusBadge, PriorityBadge } from '../shared/TicketBadge';
import EmptyState from '../shared/EmptyState';
import TicketDetailModal from '../shared/TicketDetailModal';
import { STATUSES, PRIORITIES, CATEGORIES } from '../../data/mockData';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const SLACountdown = ({ slaDueAt, isSlaBreached, status }) => {
  if (status === 'Resolved' || status === 'Closed') return <span className="text-xs text-gray-400">—</span>;
  if (!slaDueAt) return <span className="text-xs text-gray-400">Pending</span>;
  const diff = new Date(slaDueAt) - Date.now();
  if (isSlaBreached || diff <= 0)
    return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Breached</span>;
  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const color = hrs < 2 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50';
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}</span>;
};

const MyTicketsList = ({ tickets, filters, onFilterChange, onClearFilters, onCreateClick }) => {
  const { user } = useAuthContext();
  const { updateStatus, assignTicket, addComment, recategorize } = useTickets(user?.id, 'EMPLOYEE');
  const [selected, setSelected] = useState(null);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h2 className="text-sm font-semibold text-gray-900 mr-auto">My Tickets</h2>
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={filters.search} onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Search tickets…"
              className="pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none w-44" />
          </div>
          <select value={filters.status}   onChange={(e) => onFilterChange('status',   e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white">
            <option value="">All Status</option>
            {STATUSES.map((s)   => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => onFilterChange('priority', e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white">
            <option value="">All Priority</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white">
            <option value="">All Category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={onClearFilters} className="text-xs font-medium" style={{ color: '#14a0c8' }}>Clear</button>
          )}
        </div>

        {/* Table */}
        {tickets.length === 0 ? (
          <EmptyState
            title="No tickets found"
            description={hasActiveFilters ? 'Try adjusting your filters.' : 'You have not raised any tickets yet.'}
            action={!hasActiveFilters && (
              <button onClick={onCreateClick}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: '#3c3c8c' }}>
                Create your first ticket
              </button>
            )}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'SLA', 'Created'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((t) => (
                  <tr key={t.id} onClick={() => setSelected(t)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group">
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: '#3c3c8c' }}>{t.id}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate text-gray-800 font-medium group-hover:text-indigo-700 transition-colors">{t.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.category}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <SLACountdown slaDueAt={t.slaDueAt} isSlaBreached={t.isSlaBreached} status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tickets.length > 0 && (
          <div className="px-5 py-3 bg-gray-50" style={{ borderTop: '1px solid #f3f4f6' }}>
            <p className="text-xs text-gray-400">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</p>
          </div>
        )}
      </div>

      <TicketDetailModal
        ticket={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        role={user?.role}
        user={user}
        onUpdateStatus={updateStatus}
        onAssign={assignTicket}
        onAddComment={addComment}
        onRecategorize={recategorize}
      />
    </>
  );
};

export default MyTicketsList;
