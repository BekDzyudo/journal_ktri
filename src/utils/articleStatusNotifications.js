import {
  ARTICLE_STATUS,
  ADMIN_STATUS_DISPLAY,
  MUALLIF_API_HOLAT_LABELS,
  ROLES,
  SUPERADMIN_STATUS_DISPLAY,
  normalizeRole,
} from "../constants/roles.js";
import {
  inferMuallifHolatKeyForPanel,
  mapApiStatusToArticleStatus,
  normalizeApiHolatKey,
} from "./maqolaApi.js";
import { fakeNotificationApi, NOTIFICATION_TYPES } from "./fakeNotificationApi.js";

const STATUS_SNAPSHOT_KEY = "ktri_article_status_snapshot_v1";

function readSnapshotStore() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_SNAPSHOT_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeSnapshotStore(store) {
  try {
    localStorage.setItem(STATUS_SNAPSHOT_KEY, JSON.stringify(store));
  } catch {
    // Notification sync is best-effort; UI should not fail if storage is blocked.
  }
}

function targetRoleFromUserRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === ROLES.SUPERADMIN) return "superadmin";
  if (normalized === ROLES.ADMIN) return "admin";
  return "user";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getArticleTitle(article) {
  return article?.articleTitle || article?.sarlavha || article?.title || "Maqola";
}

export function getArticleAuthorEmail(article) {
  return (
    article?.authorEmail ||
    article?.email ||
    article?.muallif?.email ||
    article?.mualliflar?.find((author) => author?.email)?.email ||
    article?.authors?.find((author) => author?.email)?.email ||
    null
  );
}

function getArticleStatusValue(article) {
  return (
    article?.holatKey ||
    normalizeApiHolatKey(article?.holat) ||
    article?.status ||
    article?.jarayon ||
    ""
  );
}

function getDisplayStatus(statusValue, userRole, article = {}) {
  const holatKey = normalizeApiHolatKey(statusValue);
  const internalStatus = mapApiStatusToArticleStatus(statusValue);
  const normalizedRole = normalizeRole(userRole);

  if (normalizedRole === ROLES.USER) {
    const userHolatKey = MUALLIF_API_HOLAT_LABELS[holatKey]
      ? holatKey
      : inferMuallifHolatKeyForPanel({ ...article, status: internalStatus, holatKey: holatKey || null });
    return MUALLIF_API_HOLAT_LABELS[userHolatKey] || statusValue || "Noma'lum";
  }

  if (normalizedRole === ROLES.ADMIN) {
    return ADMIN_STATUS_DISPLAY[internalStatus] || statusValue || "Noma'lum";
  }

  return SUPERADMIN_STATUS_DISPLAY[internalStatus] || statusValue || "Noma'lum";
}

function getNotificationType(statusValue) {
  const status = mapApiStatusToArticleStatus(statusValue);
  if (status === ARTICLE_STATUS.PAYMENT_PENDING) return NOTIFICATION_TYPES.PAYMENT_PENDING;
  if (status === ARTICLE_STATUS.PAID) return NOTIFICATION_TYPES.ARTICLE_PAID;
  if (status === ARTICLE_STATUS.ASSIGNED) return NOTIFICATION_TYPES.REVIEWER_ASSIGNED;
  if (
    status === ARTICLE_STATUS.IN_EDITING ||
    status === ARTICLE_STATUS.REVIEW_ACCEPTED ||
    status === ARTICLE_STATUS.REVIEW_REJECTED
  ) {
    return NOTIFICATION_TYPES.REVIEW_SUBMITTED;
  }
  if (status === ARTICLE_STATUS.ACCEPTED || status === ARTICLE_STATUS.PUBLISHED) {
    return NOTIFICATION_TYPES.ARTICLE_ACCEPTED;
  }
  if (status === ARTICLE_STATUS.REJECTED) return NOTIFICATION_TYPES.ARTICLE_REJECTED;
  if (status === ARTICLE_STATUS.REVISION_REQUIRED) return NOTIFICATION_TYPES.REVISION_REQUIRED;
  return NOTIFICATION_TYPES.ARTICLE_SUBMITTED;
}

export function pushArticleStatusNotification({
  article,
  status,
  previousStatus = null,
  targetRole,
  targetEmail = null,
  title = "Maqola statusi o'zgardi",
  message,
  userRoleForLabel,
}) {
  if (!article?.id || !status || (!targetRole && !targetEmail)) return null;

  const nextLabel = getDisplayStatus(status, userRoleForLabel || targetRole, article);
  const prevLabel = previousStatus
    ? getDisplayStatus(previousStatus, userRoleForLabel || targetRole, article)
    : null;
  const articleTitle = getArticleTitle(article);

  return fakeNotificationApi.push({
    type: getNotificationType(status),
    title,
    message:
      message ||
      (prevLabel
        ? `"${articleTitle}" maqolasi statusi "${prevLabel}" dan "${nextLabel}" ga o'zgardi.`
        : `"${articleTitle}" maqolasi statusi "${nextLabel}" bo'ldi.`),
    targetRole,
    targetEmail,
    articleId: article.id,
    articleTitle,
  });
}

export function syncArticleStatusNotifications({ articles, userData, userRole, scope = "dashboard" }) {
  if (!Array.isArray(articles) || !userData?.email) return;

  const targetEmail = normalizeEmail(userData.email);
  const targetRole = targetRoleFromUserRole(userRole);
  const snapshotKey = `${scope}:${targetRole}:${targetEmail}`;
  const store = readSnapshotStore();
  const previous = store[snapshotKey] || {};
  const hasPreviousSnapshot = Object.keys(previous).length > 0;
  const next = {};

  articles.forEach((article) => {
    if (!article?.id) return;

    const status = getArticleStatusValue(article);
    if (!status) return;

    const id = String(article.id);
    const prev = previous[id];
    next[id] = {
      status,
      title: getArticleTitle(article),
    };

    if (!hasPreviousSnapshot || !prev?.status || prev.status === status) return;

    pushArticleStatusNotification({
      article,
      status,
      previousStatus: prev.status,
      targetRole,
      targetEmail,
      userRoleForLabel: userRole,
    });
  });

  store[snapshotKey] = next;
  writeSnapshotStore(store);
}
