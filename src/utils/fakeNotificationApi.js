/**
 * Fake Notification API — localStorage orqali xabarlar.
 * targetRole: 'user' | 'admin' | 'superadmin'
 * targetEmail: aniq foydalanuvchi email (null = o'sha rolning barchasi)
 */

const NOTIFICATIONS_KEY = "ktri_notifications_v1";
export const NOTIFICATION_CHANGED_EVENT = "ktri:notifications-changed";

export const NOTIFICATION_TYPES = {
  ARTICLE_SUBMITTED:    "article_submitted",
  PAYMENT_PENDING:      "payment_pending",
  ARTICLE_PAID:         "article_paid",
  REVIEWER_ASSIGNED:    "reviewer_assigned",
  REVIEW_SUBMITTED:     "review_submitted",
  ARTICLE_ACCEPTED:     "article_accepted",
  ARTICLE_REJECTED:     "article_rejected",
  REVISION_REQUIRED:    "revision_required",
  ROLE_CHANGED:         "role_changed",
};

export const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.ARTICLE_SUBMITTED]:  "📄",
  [NOTIFICATION_TYPES.PAYMENT_PENDING]:    "💳",
  [NOTIFICATION_TYPES.ARTICLE_PAID]:       "✅",
  [NOTIFICATION_TYPES.REVIEWER_ASSIGNED]:  "👁",
  [NOTIFICATION_TYPES.REVIEW_SUBMITTED]:   "📋",
  [NOTIFICATION_TYPES.ARTICLE_ACCEPTED]:   "🎉",
  [NOTIFICATION_TYPES.ARTICLE_REJECTED]:   "❌",
  [NOTIFICATION_TYPES.REVISION_REQUIRED]:  "✏️",
  [NOTIFICATION_TYPES.ROLE_CHANGED]:       "🔑",
};

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function normalizeTargetRole(role) {
  if (!role) return "";
  const value = String(role).toLowerCase();
  if (["superadmin", "super_admin", "super-admin", "administrator"].includes(value)) return "superadmin";
  if (["admin", "taqrizchi", "reviewer"].includes(value)) return "admin";
  if (["user", "muallif", "author"].includes(value)) return "user";
  return value;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function saveAll(list) {
  try {
    const arr = Array.isArray(list) ? list : [];
    const trimmed = arr.slice(0, 500);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGED_EVENT));
  } catch {}
}

export const fakeNotificationApi = {
  /**
   * Yangi xabar qo'shish.
   */
  push({ type, title, message, targetRole, targetEmail = null, articleId = null, articleTitle = null }) {
    const rnd = Math.random().toString(36);
    const shortId = rnd.length > 6 ? rnd.substring(2, 6) : rnd.substring(2);
    const notification = {
      id: `notif-${Date.now()}-${shortId}`,
      type,
      icon: NOTIFICATION_ICONS[type] || "🔔",
      title,
      message,
      targetRole,
      targetEmail,
      articleId,
      articleTitle,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const all = readAll();
    all.unshift(notification);
    saveAll(all);
    return notification;
  },

  /**
   * Berilgan foydalanuvchi uchun xabarlarni olish.
   */
  getForUser({ email, role }) {
    const currentEmail = normalizeEmail(email);
    const currentRole = normalizeTargetRole(role);
    return readAll().filter((n) => {
      if (n.targetEmail) return normalizeEmail(n.targetEmail) === currentEmail;
      return normalizeTargetRole(n.targetRole) === currentRole;
    });
  },

  markRead(id) {
    const all = readAll().map((n) => (n.id === id ? { ...n, read: true } : n));
    saveAll(all);
  },

  markAllRead({ email, role }) {
    const all = readAll().map((n) => {
      const mine = n.targetEmail
        ? normalizeEmail(n.targetEmail) === normalizeEmail(email)
        : normalizeTargetRole(n.targetRole) === normalizeTargetRole(role);
      return mine ? { ...n, read: true } : n;
    });
    saveAll(all);
  },

  deleteNotification(id) {
    saveAll(readAll().filter((n) => n.id !== id));
  },

  clearAll() {
    localStorage.removeItem(NOTIFICATIONS_KEY);
    window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGED_EVENT));
  },
};
