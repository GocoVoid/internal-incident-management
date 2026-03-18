import React, { useState } from 'react';
import { StatusBadge, PriorityBadge } from '../shared/TicketBadge';
import Modal from '../shared/Modal';
import TicketDetailModal from '../shared/TicketDetailModal';
import useTicketDetail from '../../hooks/useTicketDetail';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { useCategories } from '../../hooks/useCategories';
import { useReports } from '../../hooks/useReports';
import { getSLAConfig, updateSLAConfig } from '../../services/slaService';

/* ══════════════════════════════════════
   System KPI Cards
══════════════════════════════════════ */
export const SystemKPICards = ({ stats }) => {
  const cards = [
    { label: 'Total Tickets',    value: stats.total,      bg: 'bg-indigo-700', },
    { label: 'Open',             value: stats.open,        bg: 'bg-cyan-600',   },
    { label: 'In Progress',      value: stats.inProgress,  bg: 'bg-amber-500',  },
    { label: 'Resolved',         value: stats.resolved,    bg: 'bg-green-600',  },
    { label: 'Closed',           value: stats.closed,      bg: 'bg-gray-500',   },
    { label: 'SLA Breached',     value: stats.breached,    bg: 'bg-red-600',    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-2xl p-4 text-white`}>
          <p className="text-3xl font-bold">{c.value}</p>
          <p className="text-xs text-white/70 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════
   User Management Table
══════════════════════════════════════ */
const ROLE_OPTIONS = ['EMPLOYEE', 'SUPPORT_STAFF', 'MANAGER', 'ADMIN'];
const DEPT_OPTIONS = ['IT', 'HR', 'Admin', 'Facilities', 'Finance'];
const ROLE_LABELS  = { EMPLOYEE: 'Employee', SUPPORT_STAFF: 'Support Staff', MANAGER: 'Manager', ADMIN: 'Admin' };

const NEW_USER_INIT = { name: '', email: '', role: '', department: '' };

export const UserManagementTable = ({ users, onToggleStatus, onUpdateUser, onCreateUser }) => {
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser,  setEditUser]  = useState(null);
  const [form,      setForm]      = useState(NEW_USER_INIT);
  const [errors,    setErrors]    = useState({});

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (roleFilter && u.role !== roleFilter) return false;
    if (q && !u.name?.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    return true;
  });

  const openCreate = () => { setEditUser(null); setForm(NEW_USER_INIT); setErrors({}); setShowModal(true); };
  const openEdit   = (u)  => { setEditUser(u);  setForm({ name: u.name ?? u.fullName, email: u.email, role: u.role, department: u.department }); setErrors({}); setShowModal(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name       = 'Required';
    if (!form.email.trim())    e.email      = 'Required';
    if (!form.role)            e.role       = 'Required';
    if (!form.department)      e.department = 'Required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editUser) onUpdateUser(editUser.id, form);
    else          onCreateUser(form);
    setShowModal(false);
  };

  const inpCls = (f) => `w-full px-3 py-2 text-sm rounded-xl border outline-none transition-all
    ${errors[f] ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 mr-auto">User Management</h3>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none w-48" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white">
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New User
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Name', 'Email', 'Role', 'Department', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg,#3c3c8c,#783c78)' }}>
                        {(u.name ?? u.fullName ?? '?').split(' ').map((n) => n[0]).join('').slice(0,2)}
                      </div>
                      <span className="font-medium text-gray-800">{u.name ?? u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.department}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${u.active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline">Edit</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => onToggleStatus(u.id)}
                        className={`text-xs hover:underline ${u.status === 'ACTIVE' ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}>
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editUser ? 'Edit User' : 'Create New User'} size="sm">
        <div className="space-y-4">
          {[
            { label: 'Full Name', key: 'name',  type: 'text',  placeholder: 'e.g. Arjun Mehta' },
            { label: 'Email',     key: 'email',    type: 'email', placeholder: 'arjun@pratiti.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{label} *</label>
              <input type={type} value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder} className={inpCls(key)} />
              {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Role *</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className={inpCls('role')}>
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Department *</label>
            <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              className={inpCls('department')}>
              <option value="">Select department</option>
              {DEPT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}
          </div>
          {!editUser && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
              A temporary password will be generated and the user must reset it on first login.
            </p>
          )}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800">
              {editUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* ══════════════════════════════════════
   Re-categorize Others Tickets
══════════════════════════════════════ */
export const RecategorizePanel = ({ tickets, onRecategorize }) => {
  const { user }   = useAuthContext();
  const { updateStatus, assignTicket, addComment } = useTickets(user?.id, 'ADMIN');
  const { selected, openTicket, closeTicket } = useTicketDetail();
  const { categories } = useCategories();

  const othersTickets = tickets.filter((t) => t.category === 'Others');
  const [selections, setSelections] = useState({});
  const [done,       setDone]       = useState({});

  const handleChange = (id, val) => setSelections((p) => ({ ...p, [id]: val }));

  const handleApply = async (ticketId) => {
    const catId = selections[ticketId];
    if (!catId) return;
    const cat = categories.find(c => String(c.id) === String(catId));
    await onRecategorize(ticketId, Number(catId));
    setDone((p) => ({ ...p, [ticketId]: cat?.categoryName ?? catId }));
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Re-categorize "Others" Tickets</h3>
          {othersTickets.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {othersTickets.length} pending
            </span>
          )}
        </div>

        {othersTickets.length === 0 ? (
          <div className="text-center py-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="w-8 h-8 text-gray-300 mx-auto mb-2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-xs text-gray-400">No "Others" tickets pending re-categorization.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {othersTickets.map((t) => (
              <div key={t.id} className={`p-4 rounded-xl border transition-colors
                ${done[t.id] ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50/40'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Clickable ticket ID opens detail modal */}
                      <button
                        onClick={() => openTicket(t)}
                        className="font-mono text-xs font-medium hover:underline transition-colors"
                        style={{ color: '#3c3c8c' }}
                      >
                        {t.id}
                      </button>
                      <PriorityBadge priority={t.priority} />
                      <button
                        onClick={() => openTicket(t)}
                        className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-lg transition-colors"
                        style={{ color: '#14a0c8', background: '#edf8fc', border: '1px solid #d6f0f8' }}
                      >
                        View details
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-2">{t.title}</p>
                    {done[t.id] ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className="w-3.5 h-3.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Re-categorized to <strong>{done[t.id]}</strong>. SLA clock started.
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select value={selections[t.id] ?? ''}
                          onChange={(e) => handleChange(t.id, e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white">
                          <option value="">Assign to department…</option>
                          {categories.filter(c => c.categoryName !== 'Others').map(c => (
                            <option key={c.id} value={c.id}>{c.categoryName}</option>
                          ))}
                        </select>
                        <button onClick={() => handleApply(t.id)}
                          disabled={!selections[t.id]}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 transition-colors whitespace-nowrap">
                          Apply
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      <TicketDetailModal
        ticket={selected}
        isOpen={!!selected}
        onClose={closeTicket}
        role={user?.role}
        user={user}
        onUpdateStatus={updateStatus}
        onAssign={assignTicket}
        onAddComment={addComment}
        onRecategorize={onRecategorize}
      />
    </>
  );
};

/* ══════════════════════════════════════
   SLA Configuration Panel
══════════════════════════════════════ */
export const SLAConfigPanel = () => {
  const [config,  setConfig]  = useState([]);
  const [editing, setEditing] = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    getSLAConfig()
      .then(data => setConfig(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (id, val) =>
    setConfig(p => p.map(c => c.id === id ? { ...c, resolutionTimeHours: Number(val) } : c));

  const handleSave = async () => {
    const item = config.find(c => c.id === editing);
    if (item) await updateSLAConfig(item.id, item.resolutionTimeHours);
    setSaved(true);
    setEditing(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const PRIORITY_COLORS = {
    Low: 'text-green-600 bg-green-50 border-green-200',
    Medium: 'text-amber-600 bg-amber-50 border-amber-200',
    High: 'text-orange-600 bg-orange-50 border-orange-200',
    Critical: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">SLA Configuration</h3>
        <button onClick={handleSave}
          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 transition-colors">
          Save Changes
        </button>
      </div>

      {saved && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-3.5 h-3.5 text-green-600">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-xs text-green-700">SLA configuration saved successfully.</p>
        </div>
      )}

      <div className="space-y-3">
        {config.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[c.priority]}`}>
              {c.priority}
            </span>
            <div className="flex items-center gap-2">
              {editing === c.id ? (
                <input
                  type="number" min="1" max="720"
                  value={c.resolutionTimeHours}
                  onChange={(e) => handleChange(c.id, e.target.value)}
                  onBlur={() => setEditing(null)}
                  autoFocus
                  className="w-20 px-2 py-1.5 text-sm text-center rounded-lg border border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              ) : (
                <button onClick={() => setEditing(c.id)}
                  className="text-sm font-semibold text-gray-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  {c.resolutionTimeHours}h
                </button>
              )}
              <span className="text-xs text-gray-500">resolution time</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-400">Click a value to edit. Changes apply to new tickets only.</p>
    </div>
  );
};

/* ══════════════════════════════════════
   System Reports + CSV Export
══════════════════════════════════════ */
export const SystemReports = ({ tickets }) => {
  const [range, setRange] = useState('week');
  const { summary, ticketVolume, categoryBreakdown, slaCompliance, loading } = useReports(range);

  const rangeLabel = { week: 'Weekly', month: 'Monthly', year: 'Yearly' };
  const maxVal = Math.max(...ticketVolume.map(d => d.count), 1);
  const maxCat = Math.max(...categoryBreakdown.map(d => d.count), 1);
  const compliance = slaCompliance?.compliance ?? 0;
  const CAT_COLORS = { IT:'bg-indigo-500',HR:'bg-purple-500',Admin:'bg-cyan-500',Facilities:'bg-amber-500',Finance:'bg-green-500',Others:'bg-gray-400' };

  const handleExport = () => {
    const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Created At', 'SLA Breached'];
    const rows = tickets.map(t => [
      t.id, `"${t.title}"`, t.category, t.priority, t.status,
      new Date(t.createdAt).toLocaleDateString('en-IN'),
      t.isSlaBreached ? 'Yes' : 'No',
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `IIMP_Report_${rangeLabel[range]}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">System Reports</h3>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {[['week','Weekly'],['month','Monthly'],['year','Yearly']].map(([val, label]) => (
              <button key={val} onClick={() => setRange(val)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors
                  ${range === val ? 'bg-indigo-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-4">Loading reports…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total today',    value: summary?.totalToday   ?? '—' },
              { label: 'SLA compliance', value: `${compliance}%`             },
              { label: 'SLA breached',   value: summary?.breachedCount ?? '—' },
            ].map(s => (
              <div key={s.label} className="bg-indigo-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-indigo-700">{s.value}</p>
                <p className="text-xs text-indigo-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-3">Ticket volume — {rangeLabel[range]}</p>
            <div className="flex items-end gap-2 h-32">
              {ticketVolume.map(d => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{d.count}</span>
                  <div className="w-full rounded-t-lg"
                    style={{ height: `${(d.count / maxVal) * 96}px`, background: 'linear-gradient(to top,#3c3c8c,#6363b8)' }} />
                  <span className="text-[10px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-3">By category</p>
            <div className="space-y-2">
              {categoryBreakdown.map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-16 shrink-0">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${CAT_COLORS[c.label] ?? 'bg-gray-400'}`}
                      style={{ width: `${(c.count / maxCat) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

