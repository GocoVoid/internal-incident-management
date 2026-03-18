import React, { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

/* ── Icons ───────────────────────────────────────────────────── */
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const ROLE_LABELS = {
  EMPLOYEE: 'Employee', SUPPORT_STAFF: 'Support Staff',
  MANAGER: 'Manager',   ADMIN: 'Admin',
};

const ROLE_COLORS = {
  EMPLOYEE:      { bg: 'rgba(20,160,200,0.12)',  text: '#14a0c8',  border: 'rgba(20,160,200,0.25)'  },
  SUPPORT_STAFF: { bg: 'rgba(120,60,120,0.12)',  text: '#a06aa0',  border: 'rgba(120,60,120,0.25)'  },
  MANAGER:       { bg: 'rgba(60,60,140,0.12)',   text: '#6363b8',  border: 'rgba(60,60,140,0.25)'   },
  ADMIN:         { bg: 'rgba(37,37,104,0.12)',   text: '#4f4fa3',  border: 'rgba(37,37,104,0.25)'   },
};

/* ── Pratiti petal (small, for header) ──────────────────────── */
const PetalLogoSmall = () => (
  <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
    <ellipse cx="14" cy="14" rx="7" ry="11" fill="#14a0c8" opacity="0.95" transform="rotate(-45 14 14)" />
    <ellipse cx="26" cy="14" rx="7" ry="11" fill="#3c3c8c" opacity="0.90" transform="rotate(45 26 14)" />
    <ellipse cx="14" cy="26" rx="7" ry="11" fill="#783c78" opacity="0.90" transform="rotate(45 14 26)" />
    <ellipse cx="26" cy="26" rx="7" ry="11" fill="#252568" opacity="0.85" transform="rotate(-45 26 26)" />
  </svg>
);

const formatTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/* ── Header ──────────────────────────────────────────────────── */
const Header = ({ title }) => {
  const { user, handleLogout }  = useAuthContext();
  const navigate                = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const { notifications, unreadCount: unread, markRead, markAllRead: markAllReadApi } = useNotifications();

  const markAllRead = () => markAllReadApi();
  const onLogout    = () => { handleLogout(); navigate('/login', { replace: true }); };

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const roleStyle = ROLE_COLORS[user?.role] ?? ROLE_COLORS.EMPLOYEE;

  return (
    <header className="h-16 bg-white shrink-0 z-20 flex items-center px-6 gap-4"
      style={{ borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 8px rgba(60,60,140,0.06)' }}>

      {/* ── Left: logo accent + page title ── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Cyan accent bar */}
        <div className="w-0.5 h-6 rounded-full shrink-0" style={{ background: 'linear-gradient(to bottom, #14a0c8, #3c3c8c)' }} />
        <h1 className="text-sm font-semibold text-gray-900 tracking-tight truncate">{title}</h1>
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Role badge */}
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
          style={{ background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}` }}>
          {ROLE_LABELS[user?.role]}
        </span>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: '#e5e7eb' }} />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(p => !p)}
            className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors text-gray-500"
            style={{ background: showNotifs ? '#f0f0fa' : 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f0fa'}
            onMouseLeave={e => { if (!showNotifs) e.currentTarget.style.background = 'transparent'; }}
          >
            <BellIcon />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white"
                style={{ background: '#dc2626' }} />
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl z-40 overflow-hidden animate-slide-up"
                style={{ boxShadow: '0 8px 32px rgba(60,60,140,0.16)', border: '1px solid #e5e7eb' }}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900">Notifications</span>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: '#dc2626' }}>
                        {unread}
                      </span>
                    )}
                  </div>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium"
                      style={{ color: '#14a0c8' }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 transition-colors"
                        style={{ background: n.isRead ? '#fff' : 'rgba(20,160,200,0.05)' }}>
                        {!n.isRead && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                            style={{ background: '#14a0c8' }} />
                        )}
                        <span className="text-xs text-gray-700 leading-relaxed">{n.message}</span>
                        <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar + name */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #3c3c8c, #783c78)' }}>
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.fullName}</p>
            <p className="text-[10px] leading-tight" style={{ color: '#9ca3af' }}>{user?.department}</p>
          </div>
        </div>

        {/* Logout button */}
        <button onClick={onLogout}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ml-1"
          style={{ color: '#6b7280', border: '1px solid #e5e7eb' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
