import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  fakeNotificationApi,
  NOTIFICATION_CHANGED_EVENT,
} from "../utils/fakeNotificationApi.js";
import { ROLES, normalizeRole } from "../constants/roles.js";
import { getAccessToken } from "../utils/authStorage.js";
import {
  fetchNotificationsFromApi,
  patchNotificationRead,
  deleteNotificationFromApi,
} from "../utils/notificationApi.js";
import { AuthContext } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

function apiBaseConfigured() {
  return Boolean((import.meta.env.VITE_BASE_URL || "").replace(/\/$/, ""));
}

function isLocalDemoNotification(id) {
  return String(id).startsWith("notif-");
}

/** role string → targetRole string (mahalliy saqlangan demo xabarlar filtri uchun) */
function toTargetRole(role) {
  const r = normalizeRole(role);
  if (r === ROLES.SUPERADMIN) return "superadmin";
  if (r === ROLES.ADMIN) return "admin";
  return "user";
}

function getLocalMerged({ email, role }) {
  return fakeNotificationApi.getForUser({ email, role }).filter((n) =>
    isLocalDemoNotification(n.id)
  );
}

export function NotificationProvider({ children, userData, userRole }) {
  const [notifications, setNotifications] = useState([]);
  const authCtx = useContext(AuthContext);

  const targetRole = toTargetRole(userRole);
  const targetEmail = userData?.email || null;
  const refreshToken = authCtx?.refresh;

  const loadLocalFallback = useCallback(() => {
    setNotifications(fakeNotificationApi.getForUser({ email: targetEmail, role: targetRole }));
  }, [targetEmail, targetRole]);

  const refresh = useCallback(async () => {
    if (!targetEmail) return;

    const localOnly = () => loadLocalFallback();

    if (!getAccessToken() || !refreshToken || !apiBaseConfigured()) {
      localOnly();
      return;
    }

    try {
      const apiList = await fetchNotificationsFromApi(getAccessToken, refreshToken);
      const extras = getLocalMerged({ email: targetEmail, role: targetRole });
      const apiIds = new Set(apiList.map((n) => String(n.id)));

      const mergedExtras = extras.filter((n) => !apiIds.has(String(n.id)));
      setNotifications([...apiList, ...mergedExtras]);
    } catch {
      loadLocalFallback();
    }
  }, [targetEmail, targetRole, refreshToken, loadLocalFallback]);

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

  const markRead = useCallback(
    async (id) => {
      if (!targetEmail || id == null) return;

      if (isLocalDemoNotification(id)) {
        fakeNotificationApi.markRead(id);
      } else if (getAccessToken() && refreshToken && apiBaseConfigured()) {
        try {
          await patchNotificationRead(id, getAccessToken, refreshToken);
        } catch {
          /* PATCH qo‘llab-quvvatlanmasa — mavjud holat ko‘rinadi */
        }
      }
      refresh();
    },
    [refresh, targetEmail, refreshToken]
  );

  const markAllRead = useCallback(async () => {
    if (!targetEmail) return;

    if (getAccessToken() && refreshToken && apiBaseConfigured()) {
      try {
        const list = await fetchNotificationsFromApi(getAccessToken, refreshToken);
        const apiUnreadIds = list
          .filter((x) => !x.read && !isLocalDemoNotification(x.id))
          .map((x) => x.id);

        await Promise.all(
          apiUnreadIds.map((nid) =>
            patchNotificationRead(nid, getAccessToken, refreshToken).catch(() => {})
          )
        );
      } catch {
        /* fallback quyidagi mahalliy markAllRead */
      }
    }

    fakeNotificationApi.markAllRead({ email: targetEmail, role: targetRole });
    refresh();
  }, [targetEmail, targetRole, refresh, refreshToken]);

  const deleteNotification = useCallback(
    async (id) => {
      if (!targetEmail || id == null) return;

      if (isLocalDemoNotification(id)) {
        fakeNotificationApi.deleteNotification(id);
      } else if (getAccessToken() && refreshToken && apiBaseConfigured()) {
        try {
          await deleteNotificationFromApi(id, getAccessToken, refreshToken);
        } catch {
          fakeNotificationApi.deleteNotification(id);
        }
      }
      refresh();
    },
    [refresh, targetEmail, refreshToken]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refresh,
        markRead,
        markAllRead,
        deleteNotification,
      }}
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
