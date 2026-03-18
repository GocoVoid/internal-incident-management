import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  SystemKPICards,
  UserManagementTable,
  RecategorizePanel,
  SLAConfigPanel,
  SystemReports,
} from '../../components/admin/AdminComponents';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { MOCK_USERS } from '../../data/mockData';

const TABS = ['Overview', 'Users', 'Re-categorize', 'SLA Config', 'Reports'];

const AdminDashboard = () => {
  const { user }  = useAuthContext();
  const { tickets, stats, recategorize } = useTickets(user?.id, 'ADMIN');
  const [activeTab, setActiveTab] = useState('Overview');
  const [users, setUsers] = useState(MOCK_USERS);

  const handleToggleStatus = (userId) => {
    setUsers((prev) => prev.map((u) =>
      u.id === userId
        ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
        : u
    ));
  };

  const handleUpdateUser = (userId, form) => {
    setUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, ...form } : u
    ));
  };

  const handleCreateUser = (form) => {
    const newUser = {
      id:         Date.now(),
      fullName:   form.fullName,
      email:      form.email,
      role:       form.role,
      department: form.department,
      status:     'ACTIVE',
    };
    setUsers((prev) => [newUser, ...prev]);
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
        </div>

        {/* KPI cards — always visible */}
        <SystemKPICards stats={stats} />

        {/* Tab navigation */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all
                ${activeTab === tab
                  ? 'bg-white text-indigo-700 shadow-pratiti-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
              {tab === 'Re-categorize' && tickets.filter((t) => t.category === 'Others').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white">
                  {tickets.filter((t) => t.category === 'Others').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RecategorizePanel tickets={tickets} onRecategorize={recategorize} />
            <SLAConfigPanel />
          </div>
        )}

        {activeTab === 'Users' && (
          <UserManagementTable
            users={users}
            onToggleStatus={handleToggleStatus}
            onUpdateUser={handleUpdateUser}
            onCreateUser={handleCreateUser}
          />
        )}

        {activeTab === 'Re-categorize' && (
          <RecategorizePanel tickets={tickets} onRecategorize={recategorize} />
        )}

        {activeTab === 'SLA Config' && (
          <SLAConfigPanel />
        )}

        {activeTab === 'Reports' && (
          <SystemReports tickets={tickets} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
