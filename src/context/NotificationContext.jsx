import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { fakeNotificationApi, NOTIFICATION_CHANGED_EVENT } from "../utils/fakeNotificationApi.js";
import { ROLES, normalizeRole } from "../constants/roles.js";

const NotificationContext = createContext(null);

/** role string → targetRole string */
function toTargetRole(role) {
  const r = normalizeRole(role);
  if (r === ROLES.SUPERADMIN) return "superadmin";
  if (r === ROLES.ADMIN)      return "admin";
  return "user";
}

export function NotificationProvider({ children, userData, userRole }) {
  const [notifications, setNotifications] = useState([]);

  const targetRole  = toTargetRole(userRole);
  const targetEmail = userData?.email || null;

  const refresh = useCallback(() => {
    if (!targetEmail) return;
    const list = fakeNotificationApi.getForUser({ email: targetEmail, role: targetRole });
    setNotifications(list);
  }, [targetEmail, targetRole]);

  useEffect(() => {
    refresh();
    const onStorage = (event) => {
      if (!event.key || event.key === "ktri_notifications_v1") refresh();
    };
    window.addEventListener(NOTIFICATION_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(NOTIFICATION_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id) => {
    fakeNotificationApi.markRead(id);
    refresh();
  }, [refresh]);

  const markAllRead = useCallback(() => {
    if (!targetEmail) return;
    fakeNotificationApi.markAllRead({ email: targetEmail, role: targetRole });
    refresh();
  }, [targetEmail, targetRole, refresh]);

  const deleteNotification = useCallback((id) => {
    fakeNotificationApi.deleteNotification(id);
    refresh();
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, refresh, markRead, markAllRead, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
