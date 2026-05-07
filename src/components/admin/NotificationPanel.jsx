import React, { useRef, useEffect } from "react";
import { FiBell, FiX, FiCheck, FiCheckCircle, FiTrash2 } from "react-icons/fi";
import {
  FaNewspaper, FaCreditCard, FaCheckCircle, FaTimesCircle,
  FaUserShield, FaFileAlt, FaBell,
} from "react-icons/fa";
import { NOTIFICATION_TYPES } from "../../utils/fakeNotificationApi.js";
import { useNotifications } from "../../context/NotificationContext.jsx";

const TYPE_STYLES = {
  [NOTIFICATION_TYPES.ARTICLE_SUBMITTED]:   { bg: "bg-blue-50",   icon: <FaNewspaper   className="text-blue-500"   />, border: "border-blue-100"   },
  [NOTIFICATION_TYPES.PAYMENT_PENDING]:     { bg: "bg-amber-50",  icon: <FaCreditCard  className="text-amber-500"  />, border: "border-amber-100"  },
  [NOTIFICATION_TYPES.ARTICLE_PAID]:        { bg: "bg-emerald-50",icon: <FaCheckCircle className="text-emerald-500"/>, border: "border-emerald-100"},
  [NOTIFICATION_TYPES.REVIEWER_ASSIGNED]:   { bg: "bg-cyan-50",   icon: <FaUserShield  className="text-cyan-500"   />, border: "border-cyan-100"   },
  [NOTIFICATION_TYPES.REVIEW_SUBMITTED]:    { bg: "bg-purple-50", icon: <FaFileAlt     className="text-purple-500" />, border: "border-purple-100" },
  [NOTIFICATION_TYPES.ARTICLE_ACCEPTED]:    { bg: "bg-green-50",  icon: <FaCheckCircle className="text-green-500"  />, border: "border-green-100"  },
  [NOTIFICATION_TYPES.ARTICLE_REJECTED]:    { bg: "bg-red-50",    icon: <FaTimesCircle className="text-red-500"    />, border: "border-red-100"    },
  [NOTIFICATION_TYPES.REVISION_REQUIRED]:   { bg: "bg-orange-50", icon: <FaFileAlt     className="text-orange-500" />, border: "border-orange-100" },
  [NOTIFICATION_TYPES.ROLE_CHANGED]:        { bg: "bg-slate-50",  icon: <FaUserShield  className="text-slate-500"  />, border: "border-slate-100"  },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "Hozir";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  return `${days} kun oldin`;
}

export default function NotificationPanel({ isOpen, onClose, onOpenNotification }) {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpen = (notification) => {
    onOpenNotification?.(notification);
    deleteNotification(notification.id);
    onClose();
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <FaBell className="text-slate-600 text-sm" />
          <span className="text-sm font-black text-slate-900">Bildirishnomalar</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50"
              title="Barchasini o'qildi deb belgilash"
            >
              <FiCheckCircle className="text-xs" />
              Barchasini o'qi
            </button>
          )}
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100"
          >
            <FiX className="text-sm" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
            <FiBell className="text-3xl opacity-30" />
            <p className="text-sm">Bildirishnomalar yo'q</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {notifications.map((n) => {
              const style = TYPE_STYLES[n.type] || {
                bg: "bg-slate-50", icon: <FaBell className="text-slate-400" />, border: "border-slate-100",
              };
              return (
                <li
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`group relative flex cursor-pointer gap-3 px-4 py-3 transition ${n.read ? "opacity-70" : ""} hover:bg-slate-50/80`}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500" />
                  )}

                  {/* Icon */}
                  <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${style.bg} ${style.border}`}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] leading-snug ${n.read ? "font-medium text-slate-600" : "font-bold text-slate-900"}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col items-end gap-1 opacity-0 transition group-hover:opacity-100">
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n.id);
                        }}
                        className="grid h-6 w-6 place-items-center rounded-md text-blue-500 hover:bg-blue-50"
                        title="O'qildi"
                      >
                        <FiCheck className="text-xs" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
                      title="O'chirish"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5 text-center">
          <p className="text-[11px] text-slate-400">
            Jami {notifications.length} ta bildirishnoma
          </p>
        </div>
      )}
    </div>
  );
}
