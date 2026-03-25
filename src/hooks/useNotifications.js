import { useState, useEffect, useCallback } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [data, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(data?.content ?? data ?? []);
      setUnreadCount(countRes?.unread ?? 0);
    } catch {
      /* Non-critical — fail silently */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markRead = useCallback((id) => {
    // Optimistic — remove immediately, then fire API
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
    markAsRead(id).catch(() => {}); // fire-and-forget
  }, []);

  const markAllRead = useCallback(() => {
    // Optimistic — clear inbox immediately, then fire API
    console.log("In markAllRead");
    setNotifications([]);
    setUnreadCount(0);
    markAllAsRead().catch(() => {}); // fire-and-forget
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchAll };
};
