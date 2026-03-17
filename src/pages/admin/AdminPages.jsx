import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import {
  SystemKPICards, UserManagementTable,
  RecategorizePanel, SLAConfigPanel,
} from '../../components/admin/AdminComponents';
import { MOCK_REPORTS, MOCK_USERS, STATUSES, PRIORITIES, CATEGORIES } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

/* ── Chart.js loader hook ───────────────────────────────────── */
const useChartJS = () => {
  const [loaded, setLoaded] = useState(!!window.Chart);
  useEffect(() => {
    if (window.Chart) { setLoaded(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }, []);
  return loaded;
};

const PALETTE = ['#3c3c8c','#14a0c8','#783c78','#d97706','#059669','#9ca3af'];

const useChart = (ref, config, deps = []) => {
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    const c = new window.Chart(ref.current, config);
    return () => c.destroy();
  }, deps);
};

/* ══════════════════════════════════════
   Admin Overview
══════════════════════════════════════ */
export const AdminOverview = () => {
  const { user }   = useAuthContext();
  const navigate   = useNavigate();
  const { tickets, stats } = useTickets(user?.id, 'ADMIN');
  const othersCount = tickets.filter(t => t.category === 'Others').length;

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Full visibility across all departments.</p>
        </div>

        <SystemKPICards stats={stats} />

        {/* Alert: Others tickets */}
        {othersCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              {othersCount} ticket{othersCount > 1 ? 's need' : ' needs'} re-categorization before they can be assigned.
            </p>
            <button onClick={() => navigate('/dashboard/admin/recategorize')}
              className="ml-auto text-xs font-semibold text-amber-700 hover:underline shrink-0">
              Re-categorize →
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Manage Users',       desc: `${MOCK_USERS.length} total users`, to: '/dashboard/admin/users',         color: '#3c3c8c' },
            { label: 'View All Tickets',   desc: `${stats.total} tickets`,             to: '/dashboard/admin/tickets',       color: '#14a0c8' },
            { label: 'System Reports',     desc: 'SLA & volume analytics',             to: '/dashboard/admin/reports',       color: '#783c78' },
            { label: 'SLA Configuration',  desc: 'Edit resolution time limits',        to: '/dashboard/admin/sla',           color: '#d97706' },
            { label: 'Re-categorize',      desc: `${othersCount} pending`,             to: '/dashboard/admin/recategorize',  color: '#059669' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.to)}
              className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/20 transition-all group">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center"
                style={{ background: `${a.color}18` }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: a.color }} />
              </div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">{a.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════
   Admin All Tickets
══════════════════════════════════════ */
export const AdminTickets = () => {
  const { user } = useAuthContext();
  const { tickets, filters, updateFilter, clearFilters } = useTickets(user?.id, 'ADMIN');

  const formatDate = iso => new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const selCls = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

  return (
    <DashboardLayout title="All Tickets">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">System-wide incident view across all departments.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
          <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <div className="relative flex-1 min-w-[160px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={filters.search} onChange={e => updateFilter('search', e.target.value)}
                placeholder="Search by ID or title…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none" />
            </div>
            <select value={filters.status}   onChange={e => updateFilter('status',   e.target.value)} className={selCls}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.priority} onChange={e => updateFilter('priority', e.target.value)} className={selCls}>
              <option value="">All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filters.category} onChange={e => updateFilter('category', e.target.value)} className={selCls}>
              <option value="">All Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {Object.values(filters).some(Boolean) && (
              <button onClick={clearFilters} className="text-xs font-medium" style={{ color: '#14a0c8' }}>Clear</button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Department', 'SLA', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: '#3c3c8c' }}>{t.id}</td>
                    <td className="px-4 py-3 max-w-[180px]"><p className="truncate font-medium text-gray-800">{t.title}</p></td>
                    <td className="px-4 py-3 text-gray-600">{t.category}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{t.department ?? '—'}</td>
                    <td className="px-4 py-3">
                      {t.isSlaBreached
                        ? <span className="text-xs font-semibold text-red-600">Breached</span>
                        : t.slaDueAt
                          ? <span className="text-xs text-green-600">On track</span>
                          : <span className="text-xs text-gray-400">No SLA</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50" style={{ borderTop: '1px solid #f3f4f6' }}>
            <p className="text-xs text-gray-400">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════
   Admin Users
══════════════════════════════════════ */
export const AdminUsers = () => {
  const [users, setUsers] = useState(MOCK_USERS);

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create, edit, and manage all system users.</p>
        </div>
        <UserManagementTable
          users={users}
          onToggleStatus={id => setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u))}
          onUpdateUser={(id, form) => setUsers(p => p.map(u => u.id === id ? { ...u, ...form } : u))}
          onCreateUser={form => setUsers(p => [{ id: Date.now(), ...form, status: 'ACTIVE' }, ...p])}
        />
      </div>
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════
   Admin Reports — Chart.js
══════════════════════════════════════ */
export const AdminReports = () => {
  const { user }   = useAuthContext();
  const { tickets } = useTickets(user?.id, 'ADMIN');
  const chartjsLoaded = useChartJS();
  const [period, setPeriod] = useState('Weekly');

  const barRef    = useRef();
  const lineRef   = useRef();
  const doughRef  = useRef();

  useChart(barRef, {
    type: 'bar',
    data: {
      labels: MOCK_REPORTS.ticketVolume.map(d => d.label),
      datasets: [{
        label: 'Tickets',
        data: MOCK_REPORTS.ticketVolume.map(d => d.count),
        backgroundColor: MOCK_REPORTS.ticketVolume.map((_, i) => i % 2 === 0 ? '#3c3c8c' : '#14a0c8'),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 26,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a4e', cornerRadius: 8, padding: 10 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
      },
    },
  }, [chartjsLoaded]);

  useChart(lineRef, {
    type: 'line',
    data: {
      labels: MOCK_REPORTS.ticketVolume.map(d => d.label),
      datasets: [{
        label: 'Volume',
        data: MOCK_REPORTS.ticketVolume.map(d => d.count),
        borderColor: '#14a0c8',
        backgroundColor: 'rgba(20,160,200,0.10)',
        borderWidth: 2.5,
        pointBackgroundColor: '#14a0c8',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a4e', cornerRadius: 8, padding: 10 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
      },
    },
  }, [chartjsLoaded]);

  useChart(doughRef, {
    type: 'doughnut',
    data: {
      labels: MOCK_REPORTS.categoryBreakdown.map(d => d.label),
      datasets: [{
        data: MOCK_REPORTS.categoryBreakdown.map(d => d.count),
        backgroundColor: PALETTE,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { position: 'right', labels: { color: '#374151', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
        tooltip: { backgroundColor: '#1a1a4e', cornerRadius: 8, padding: 10 },
      },
    },
  }, [chartjsLoaded]);

  const handleExport = () => {
    const headers = ['ID','Title','Category','Priority','Status','Department','Created At','SLA Breached'];
    const rows = tickets.map(t => [
      t.id, `"${t.title}"`, t.category, t.priority, t.status,
      t.department ?? 'N/A',
      new Date(t.createdAt).toLocaleDateString('en-IN'),
      t.isSlaBreached ? 'Yes' : 'No',
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `IIMP_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Reports</h2>
            <p className="text-sm text-gray-500 mt-0.5">System-wide analytics and SLA performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {['Daily','Weekly','Monthly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-4 py-2 text-xs font-medium transition-colors"
                  style={period === p ? { background: '#3c3c8c', color: '#fff' } : { background: '#fff', color: '#6b7280' }}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{ color: '#3c3c8c', borderColor: '#c5c5e8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5fc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* KPI summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total today',      value: MOCK_REPORTS.totalToday,       color: '#3c3c8c', bg: '#f0f0fa' },
            { label: 'SLA compliance',   value: `${MOCK_REPORTS.slaCompliance}%`, color: '#059669', bg: '#f0fdf4' },
            { label: 'SLA breached',     value: MOCK_REPORTS.breachedCount,    color: '#dc2626', bg: '#fff1f2' },
            { label: 'Open tickets',     value: MOCK_REPORTS.openCount,        color: '#14a0c8', bg: '#edf8fc' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-4">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {!chartjsLoaded ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-400">Loading charts…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Volume Trend</h3>
              <p className="text-xs text-gray-400 mb-4">Ticket submissions over the {period.toLowerCase()}</p>
              <div style={{ height: 200 }}><canvas ref={lineRef} /></div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">By Category</h3>
              <p className="text-xs text-gray-400 mb-4">Distribution across departments</p>
              <div style={{ height: 200 }}><canvas ref={doughRef} /></div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Daily Breakdown</h3>
              <p className="text-xs text-gray-400 mb-4">Ticket count per weekday</p>
              <div style={{ height: 200 }}><canvas ref={barRef} /></div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════
   Admin SLA Config
══════════════════════════════════════ */
export const AdminSLAConfig = () => (
  <DashboardLayout title="SLA Configuration">
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">SLA Configuration</h2>
        <p className="text-sm text-gray-500 mt-0.5">Set resolution time limits per priority level. Changes apply to new tickets only.</p>
      </div>
      <div className="max-w-md">
        <SLAConfigPanel />
      </div>
    </div>
  </DashboardLayout>
);

/* ══════════════════════════════════════
   Admin Recategorize
══════════════════════════════════════ */
export const AdminRecategorize = () => {
  const { user }   = useAuthContext();
  const { tickets, recategorize } = useTickets(user?.id, 'ADMIN');

  return (
    <DashboardLayout title="Re-categorize Tickets">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Re-categorize "Others" Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Assign the correct department to tickets submitted under "Others".
            The SLA clock starts only after re-categorization.
          </p>
        </div>
        <div className="max-w-2xl">
          <RecategorizePanel tickets={tickets} onRecategorize={recategorize} />
        </div>
      </div>
    </DashboardLayout>
  );
};
