import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { AssignTicketPanel } from '../../components/manager/ManagerComponents';
import TicketDetailModal from '../../components/shared/TicketDetailModal';
import useTicketDetail from '../../hooks/useTicketDetail';
import { MOCK_REPORTS, STATUSES, PRIORITIES, CATEGORIES } from '../../data/mockData';

/* ══════════════════════════════════════
   Manager Tickets Page
══════════════════════════════════════ */
export const ManagerTickets = () => {
  const { user } = useAuthContext();
  const { tickets, filters, updateFilter, clearFilters, updateStatus, assignTicket, addComment, recategorize } =
    useTickets(user?.id, 'MANAGER');
  const { selected, openTicket, closeTicket } = useTicketDetail();

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const selCls = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

  return (
    <DashboardLayout title="Tickets">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Department Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">All incidents in the {user?.department} department.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <div className="relative flex-1 min-w-[160px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={filters.search} onChange={e => updateFilter('search', e.target.value)}
                placeholder="Search tickets…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
            </div>
            <select value={filters.status}   onChange={e => updateFilter('status',   e.target.value)} className={selCls}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.priority} onChange={e => updateFilter('priority', e.target.value)} className={selCls}>
              <option value="">All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {Object.values(filters).some(Boolean) && (
              <button onClick={clearFilters} className="text-xs font-medium" style={{ color: '#14a0c8' }}>Clear</button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Assigned To', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map(t => (
                  <tr key={t.id} onClick={() => openTicket(t)}
                    className="hover:bg-indigo-50/20 transition-colors cursor-pointer group">
                    <td className="px-4 py-3 font-mono font-medium group-hover:text-indigo-700 transition-colors" style={{ color: '#3c3c8c' }}>{t.id}</td>
                    <td className="px-4 py-3 max-w-[200px]"><p className="truncate text-gray-800 font-medium group-hover:text-indigo-700 transition-colors">{t.title}</p></td>
                    <td className="px-4 py-3 text-gray-600">{t.category}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{t.assignedTo ? `Staff #${t.assignedTo}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50" style={{ borderTop: '1px solid #f3f4f6' }}>
            <p className="text-xs text-gray-400">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <TicketDetailModal
        ticket={selected} isOpen={!!selected} onClose={closeTicket}
        role={user?.role} user={user}
        onUpdateStatus={updateStatus} onAssign={assignTicket}
        onAddComment={addComment} onRecategorize={recategorize}
      />
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════
   Manager Assign Page
══════════════════════════════════════ */
export const ManagerAssign = () => {
  const { user } = useAuthContext();
  const { tickets, assignTicket } = useTickets(user?.id, 'MANAGER');

  return (
    <DashboardLayout title="Assign Tickets">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Assign Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">Assign open tickets to support staff members.</p>
        </div>
        <div className="max-w-lg">
          <AssignTicketPanel tickets={tickets} onAssign={assignTicket} />
        </div>

        {/* Open tickets needing assignment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h3 className="text-sm font-semibold text-gray-900">Open Unassigned Tickets</h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {tickets.filter(t => t.status === 'Open' && !t.assignedTo).length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-gray-400">
                All open tickets have been assigned. ✓
              </li>
            ) : (
              tickets.filter(t => t.status === 'Open' && !t.assignedTo).map(t => (
                <li key={t.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="font-mono text-xs font-medium w-36 shrink-0" style={{ color: '#3c3c8c' }}>{t.id}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Unassigned</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════
   Professional Chart.js Reports
══════════════════════════════════════ */
const CHART_COLORS = {
  indigo:  '#3c3c8c',
  cyan:    '#14a0c8',
  purple:  '#783c78',
  amber:   '#d97706',
  green:   '#059669',
  red:     '#dc2626',
  gray:    '#9ca3af',
  indigoLight: 'rgba(60,60,140,0.12)',
  cyanLight:   'rgba(20,160,200,0.12)',
};

const useChart = (canvasRef, config) => {
  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;
    const chart = new window.Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, []);
};

const BarChart = ({ data }) => {
  const ref = useRef();
  useChart(ref, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'Tickets',
        data: data.map(d => d.count),
        backgroundColor: data.map((_, i) =>
          i % 2 === 0 ? CHART_COLORS.indigo : CHART_COLORS.cyan
        ),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 28,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a4e',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.7)',
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
          ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 2 },
          border: { display: false },
        },
      },
    },
  });
  return <canvas ref={ref} />;
};

const DoughnutChart = ({ data }) => {
  const ref = useRef();
  const colors = [CHART_COLORS.indigo, CHART_COLORS.cyan, CHART_COLORS.purple,
                  CHART_COLORS.amber, CHART_COLORS.green, CHART_COLORS.gray];
  useChart(ref, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#374151',
            font: { size: 11 },
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: '#1a1a4e',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.7)',
          padding: 10,
          cornerRadius: 8,
        },
      },
    },
  });
  return <canvas ref={ref} />;
};

const LineChart = ({ data }) => {
  const ref = useRef();
  useChart(ref, {
    type: 'line',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'Tickets',
        data: data.map(d => d.count),
        borderColor: CHART_COLORS.indigo,
        backgroundColor: CHART_COLORS.indigoLight,
        borderWidth: 2.5,
        pointBackgroundColor: CHART_COLORS.indigo,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a4e',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.7)',
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
          ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 2 },
          border: { display: false },
        },
      },
    },
  });
  return <canvas ref={ref} />;
};

export const ManagerReports = () => {
  const [period, setPeriod] = useState('Weekly');
  const [chartjsLoaded, setChartjsLoaded] = useState(!!window.Chart);

  useEffect(() => {
    if (window.Chart) { setChartjsLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = () => setChartjsLoaded(true);
    document.head.appendChild(script);
  }, []);

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Department Reports</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ticket trends, SLA performance, and category breakdown.</p>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {['Daily', 'Weekly', 'Monthly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-4 py-2 text-xs font-medium transition-colors"
                style={period === p
                  ? { background: '#3c3c8c', color: '#fff' }
                  : { background: '#fff', color: '#6b7280' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* SLA compliance banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SLA Compliance</p>
              <p className="text-3xl font-bold mt-1" style={{ color: '#3c3c8c' }}>
                {MOCK_REPORTS.slaCompliance}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total today</p>
              <p className="text-2xl font-bold text-gray-800">{MOCK_REPORTS.totalToday}</p>
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${MOCK_REPORTS.slaCompliance}%`, background: 'linear-gradient(90deg,#3c3c8c,#14a0c8)' }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">0%</span>
            <span className="text-[10px] font-medium" style={{ color: '#3c3c8c' }}>{MOCK_REPORTS.slaCompliance}% compliant</span>
            <span className="text-[10px] text-gray-400">100%</span>
          </div>
        </div>

        {/* Charts grid */}
        {!chartjsLoaded ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-400">Loading charts…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Volume trend */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Ticket Volume — {period}</h3>
              <p className="text-xs text-gray-400 mb-4">Daily ticket submission trend</p>
              <div style={{ height: 220 }}>
                <LineChart data={MOCK_REPORTS.ticketVolume} />
              </div>
            </div>

            {/* Category doughnut */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">By Category</h3>
              <p className="text-xs text-gray-400 mb-4">Distribution of tickets across departments</p>
              <div style={{ height: 220 }}>
                <DoughnutChart data={MOCK_REPORTS.categoryBreakdown} />
              </div>
            </div>

            {/* Priority bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Volume by Day</h3>
              <p className="text-xs text-gray-400 mb-4">Ticket count per weekday for the selected period</p>
              <div style={{ height: 200 }}>
                <BarChart data={MOCK_REPORTS.ticketVolume} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
