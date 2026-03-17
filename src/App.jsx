import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';

/* ── Pages ───────────────────────────────────────────────────── */
import LoginPage            from './pages/LoginPage';

import EmployeeOverview     from './pages/employee/EmployeeOverview';
import EmployeeTickets      from './pages/employee/EmployeeTickets';
import EmployeeCreateTicket from './pages/employee/EmployeeCreateTicket';

import SupportOverview      from './pages/support/SupportOverview';
import SupportQueue         from './pages/support/SupportQueue';

import ManagerOverview      from './pages/manager/ManagerOverview';
import { ManagerTickets, ManagerAssign, ManagerReports } from './pages/manager/ManagerPages';

import { AdminOverview, AdminTickets, AdminUsers, AdminReports, AdminSLAConfig, AdminRecategorize }
  from './pages/admin/AdminPages';

/* ── Guards ──────────────────────────────────────────────────── */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthContext();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role))
    return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  if (isAuthenticated && user) {
    const routes = {
      EMPLOYEE:      '/dashboard/employee',
      SUPPORT_STAFF: '/dashboard/support',
      MANAGER:       '/dashboard/manager',
      ADMIN:         '/dashboard/admin',
    };
    return <Navigate to={routes[user.role] ?? '/dashboard/employee'} replace />;
  }
  return children;
};

const P = (role, children) => (
  <ProtectedRoute allowedRoles={[role]}>{children}</ProtectedRoute>
);

/* ── App ─────────────────────────────────────────────────────── */
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />

    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

    {/* Employee */}
    <Route path="/dashboard/employee"        element={P('EMPLOYEE', <EmployeeOverview />)} />
    <Route path="/dashboard/employee/tickets" element={P('EMPLOYEE', <EmployeeTickets />)} />
    <Route path="/dashboard/employee/create"  element={P('EMPLOYEE', <EmployeeCreateTicket />)} />

    {/* Support Staff */}
    <Route path="/dashboard/support"       element={P('SUPPORT_STAFF', <SupportOverview />)} />
    <Route path="/dashboard/support/queue" element={P('SUPPORT_STAFF', <SupportQueue />)} />

    {/* Manager */}
    <Route path="/dashboard/manager"         element={P('MANAGER', <ManagerOverview />)} />
    <Route path="/dashboard/manager/tickets" element={P('MANAGER', <ManagerTickets />)} />
    <Route path="/dashboard/manager/assign"  element={P('MANAGER', <ManagerAssign />)} />
    <Route path="/dashboard/manager/reports" element={P('MANAGER', <ManagerReports />)} />

    {/* Admin */}
    <Route path="/dashboard/admin"               element={P('ADMIN', <AdminOverview />)} />
    <Route path="/dashboard/admin/tickets"       element={P('ADMIN', <AdminTickets />)} />
    <Route path="/dashboard/admin/users"         element={P('ADMIN', <AdminUsers />)} />
    <Route path="/dashboard/admin/reports"       element={P('ADMIN', <AdminReports />)} />
    <Route path="/dashboard/admin/sla"           element={P('ADMIN', <AdminSLAConfig />)} />
    <Route path="/dashboard/admin/recategorize"  element={P('ADMIN', <AdminRecategorize />)} />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
