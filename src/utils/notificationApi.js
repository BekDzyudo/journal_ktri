import { fetchWithAuth } from "./authenticatedFetch.js";
import { parseApiError } from "./apiError.js";
import { NOTIFICATION_ICONS, NOTIFICATION_TYPES } from "./fakeNotificationApi.js";

/** Backend bildirishnomalar — barcha rollar uchun umumiy. */
export const NOTIFICATION_API_PATH = "/xabarlar/";

function apiBase() {
  return (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
}

function parseListPayload(json) {
  if (json == null) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.results)) return json.results;
  if (Array.isArray(json.data)) return json.data;
  return [];
}

function resolveNotificationType(raw) {
  const v = raw == null ? "" : String(raw).trim().toLowerCase().replace(/\s+/g, "_");
  const values = Object.values(NOTIFICATION_TYPES);
  if (values.includes(raw)) return raw;
  const alias = {
    article_submitted: NOTIFICATION_TYPES.ARTICLE_SUBMITTED,
    payment_pending: NOTIFICATION_TYPES.PAYMENT_PENDING,
    article_paid: NOTIFICATION_TYPES.ARTICLE_PAID,
    reviewer_assigned: NOTIFICATION_TYPES.REVIEWER_ASSIGNED,
    review_submitted: NOTIFICATION_TYPES.REVIEW_SUBMITTED,
    article_accepted: NOTIFICATION_TYPES.ARTICLE_ACCEPTED,
    article_rejected: NOTIFICATION_TYPES.ARTICLE_REJECTED,
    revision_required: NOTIFICATION_TYPES.REVISION_REQUIRED,
    role_changed: NOTIFICATION_TYPES.ROLE_CHANGED,
    xabar: NOTIFICATION_TYPES.ARTICLE_SUBMITTED,
    default: NOTIFICATION_TYPES.ARTICLE_SUBMITTED,
  };
  return alias[v] || NOTIFICATION_TYPES.ARTICLE_SUBMITTED;
}

/**
 * Backend qatorini panel UI obyektiga.
 */
export function normalizeXabarlarRow(row) {
  if (!row || typeof row !== "object") return null;

  const id = row.id ?? row.pk ?? row.uuid;
  if (id == null) return null;

  const type = resolveNotificationType(row.turi ?? row.type ?? row.tur);

  const title =
    row.title ??
    row.sarlavha ??
    row.mavzu ??
    row.short_title ??
    "Xabar";

  const message =
    row.message ??
    row.matn ??
    row.xabar ??
    row.izoh ??
    row.text ??
    "";

  const read = Boolean(
    row.oqilgan ??
      row.oqildi ??
      row.read ??
      row.is_read
  );

  const createdAt =
    row.created_at ??
    row.createdAt ??
    row.yaratilgan_sana ??
    row.yaratilgan_vaqt ??
    row.vaqt ??
    row.sana ??
    new Date().toISOString();

  const articleIdRaw =
    row.maqola_id ??
    row.maqola ??
    row.article_id ??
    (row.maqola && typeof row.maqola === "object" ? row.maqola.id : null);

  const articleId =
    articleIdRaw != null && articleIdRaw !== ""
      ? String(articleIdRaw)
      : null;

  const articleTitle =
    row.maqola_sarlavhasi ??
    (row.maqola && typeof row.maqola === "object" ? row.maqola.sarlavha : null) ??
    row.article_title ??
    null;

  return {
    id: String(id),
    type,
    icon: NOTIFICATION_ICONS[type] || "🔔",
    title: String(title),
    message: String(message),
    read,
    createdAt:
      typeof createdAt === "string" ? createdAt : new Date(createdAt).toISOString(),
    articleId,
    articleTitle: articleTitle != null ? String(articleTitle) : null,
    targetRole: row.target_role ?? row.targetRole,
    targetEmail: row.target_email ?? row.targetEmail,
    _api: true,
  };
}

/**
 * GET /xabarlar/ — joriy token egasining xabarlari.
 */
export async function fetchNotificationsFromApi(getAccessToken, refreshAccessToken) {
  const base = apiBase();
  if (!base) throw new Error("VITE_BASE_URL sozlanmagan");

  const res = await fetchWithAuth(
    `${base}${NOTIFICATION_API_PATH}`,
    { method: "GET" },
    getAccessToken,
    refreshAccessToken
  );
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));

  return parseListPayload(json)
    .map((row) => normalizeXabarlarRow(row))
    .filter(Boolean);
}

/**
 * PATCH /xabarlar/{id}/ — o'qildi.
 */
export async function patchNotificationRead(id, getAccessToken, refreshAccessToken) {
  const base = apiBase();
  if (!base) throw new Error("VITE_BASE_URL sozlanmagan");

  const res = await fetchWithAuth(
    `${base}${NOTIFICATION_API_PATH}${encodeURIComponent(String(id))}/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oqilgan: true }),
    },
    getAccessToken,
    refreshAccessToken
  );
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));
  return json;
}

/**
 * DELETE /xabarlar/{id}/
 */
export async function deleteNotificationFromApi(id, getAccessToken, refreshAccessToken) {
  const base = apiBase();
  if (!base) throw new Error("VITE_BASE_URL sozlanmagan");

  const res = await fetchWithAuth(
    `${base}${NOTIFICATION_API_PATH}${encodeURIComponent(String(id))}/`,
    { method: "DELETE" },
    getAccessToken,
    refreshAccessToken
  );
  if (res.status === 204) return null;
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));
  return json;
}
