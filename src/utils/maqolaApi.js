import { ARTICLE_STATUS } from "../constants/roles.js";

const VALID_STATUSES = new Set(Object.values(ARTICLE_STATUS));

/** API javobidan maqolalar massivini ajratib oladi */
export function parseMaqolalarListPayload(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.maqolalar)) return raw.maqolalar;
  return [];
}

function resolveFileUrl(f) {
  if (f == null) return null;
  if (typeof f === "string") return f;
  if (typeof f === "object" && f.url) return f.url;
  if (typeof f === "object" && f.file) return resolveFileUrl(f.file);
  return null;
}

function mualliflarString(m) {
  const list = m?.mualliflar;
  if (Array.isArray(list) && list.length) {
    return list
      .map((a) =>
        (a?.ism_familya || [a?.familiya, a?.ism, a?.sharif].filter(Boolean).join(" ")).trim()
      )
      .filter(Boolean)
      .join(", ");
  }
  if (m?.muallif?.ism_familya) return m.muallif.ism_familya;
  return (
    m?.authorNames ||
    m?.author ||
    [m?.author_first_name, m?.author_last_name].filter(Boolean).join(" ") ||
    "-"
  );
}

/**
 * Keng tarqalgan backend holat nomlarini ichki statusga
 */
export function mapApiStatusToArticleStatus(v) {
  if (v == null || v === "") return ARTICLE_STATUS.SUBMITTED;
  if (VALID_STATUSES.has(v)) return v;

  const s = String(v).toLowerCase().trim().replace(/\s+/g, "_");

  const ALIASES = {
    yuborildi: ARTICLE_STATUS.SUBMITTED,
    yangi: ARTICLE_STATUS.SUBMITTED,
    submitted: ARTICLE_STATUS.SUBMITTED,
    tolov_kutilmoqda: ARTICLE_STATUS.PAYMENT_PENDING,
    payment_pending: ARTICLE_STATUS.PAYMENT_PENDING,
    tolangan: ARTICLE_STATUS.PAID,
    paid: ARTICLE_STATUS.PAID,
    tayinlandi: ARTICLE_STATUS.ASSIGNED,
    assigned: ARTICLE_STATUS.ASSIGNED,
    korib_chiqilmoqda: ARTICLE_STATUS.UNDER_REVIEW,
    under_review: ARTICLE_STATUS.UNDER_REVIEW,
    taqrizda: ARTICLE_STATUS.IN_EDITING,
    in_editing: ARTICLE_STATUS.IN_EDITING,
    ijobiy_xulosa: ARTICLE_STATUS.REVIEW_ACCEPTED,
    review_accepted: ARTICLE_STATUS.REVIEW_ACCEPTED,
    salbiy_xulosa: ARTICLE_STATUS.REVIEW_REJECTED,
    review_rejected: ARTICLE_STATUS.REVIEW_REJECTED,
    qabul_qilindi: ARTICLE_STATUS.ACCEPTED,
    accepted: ARTICLE_STATUS.ACCEPTED,
    rad_etildi: ARTICLE_STATUS.REJECTED,
    rejected: ARTICLE_STATUS.REJECTED,
    qayta_korib_chiqish: ARTICLE_STATUS.REVISION_REQUIRED,
    revision: ARTICLE_STATUS.REVISION_REQUIRED,
  };

  return ALIASES[s] ?? ARTICLE_STATUS.SUBMITTED;
}

/** Superadmin jadvali kutgan maydonlar bilan boyitadi */
export function normalizeMaqolaForDashboard(m) {
  const id = m?.id ?? m?.pk;
  const rukn = m?.rukn;

  const assignedEmail =
    (typeof m?.taqrizchi === "string" ? m.taqrizchi : null) ||
    m?.taqrizchi?.email ||
    m?.assigned_to ||
    m?.assignedTo ||
    null;

  const assignedName =
    m?.taqrizchi_ismi ||
    m?.assignedToName ||
    (m?.taqrizchi && typeof m.taqrizchi === "object"
      ? m.taqrizchi.ism_familya ||
        [m.taqrizchi.first_name, m.taqrizchi.last_name].filter(Boolean).join(" ")
      : null);

  const dateRaw =
    m?.yuborilgan_sana ||
    m?.created_at ||
    m?.createdAt ||
    m?.submitted_at ||
    m?.submittedAt ||
    null;

  return {
    ...m,
    id,
    pk: id,
    articleTitle: m?.sarlavha ?? m?.articleTitle ?? m?.title ?? "",
    authorNames: mualliflarString(m),
    category: rukn?.nom ?? m?.category ?? m?.rukn_nomi ?? "",
    status: mapApiStatusToArticleStatus(m?.holat ?? m?.status ?? m?.jarayon),
    createdAt: dateRaw,
    submittedAt: dateRaw,
    submittedDate: dateRaw,
    articleFileUrl:
      resolveFileUrl(m?.fayl) ||
      m?.fayl_url ||
      m?.file_url ||
      m?.articleFileUrl ||
      null,
    fileName: m?.fayl_nomi || m?.fileName || null,
    assignedTo: assignedEmail,
    assignedToName: assignedName || assignedEmail,
  };
}

export function normalizeMaqolalarList(raw) {
  return parseMaqolalarListPayload(raw)
    .map((item) => normalizeMaqolaForDashboard(item))
    .filter((a) => a.id != null);
}
