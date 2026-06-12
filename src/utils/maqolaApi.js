import {
  ARTICLE_STATUS,
  MUALLIF_API_HOLAT,
  MUALLIF_API_HOLAT_LABELS,
} from "../constants/roles.js";

const VALID_STATUSES = new Set(Object.values(ARTICLE_STATUS));

function extractArrayFromMaybePaginated(val) {
  if (val == null) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === "object" && Array.isArray(val.results)) return val.results;
  return null;
}

function looksLikeArticle(item) {
  if (!item || typeof item !== "object") return false;
  return !!(item.sarlavha || item.holat || item.id || item.pk || item.title);
}

/** API javobidan maqolalar massivini ajratib oladi */
export function parseMaqolalarListPayload(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;

  // DRF paginated list (results is array of articles, not a profile object)
  if (Array.isArray(raw.results) && raw.results.length > 0 && looksLikeArticle(raw.results[0])) {
    return raw.results;
  }

  if (Array.isArray(raw.data) && raw.data.length > 0 && looksLikeArticle(raw.data[0])) {
    return raw.data;
  }

  // Known article list keys (prioritised)
  const listKeys = [
    "maqolalar", "articles", "my_articles", "myArticles", "user_maqolalar",
    "maqola_set", "maqola_list", "submissions", "submitted", "my_submissions",
    "user_articles", "muallif_maqolalar", "muallif_articles",
    "taqrizchi_maqolalar",
  ];
  const dataObj = raw.data != null && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : null;
  for (const key of listKeys) {
    const v = raw[key] ?? dataObj?.[key];
    const arr = extractArrayFromMaybePaginated(v);
    if (arr) return arr;
  }

  // Last resort: scan all object keys for an array of article-like items
  for (const key of Object.keys(raw)) {
    const v = raw[key];
    const arr = extractArrayFromMaybePaginated(v);
    if (arr && arr.length > 0 && looksLikeArticle(arr[0])) return arr;
  }

  return [];
}

function forceHttps(url) {
  return url ? String(url).replace(/^http:\/\//i, "https://") : url;
}

function resolveFileUrl(f) {
  if (f == null) return null;
  if (typeof f === "string") return forceHttps(f);
  if (typeof f === "object" && f.url) return forceHttps(f.url);
  if (typeof f === "object" && f.file) return resolveFileUrl(f.file);
  return null;
}

function mualliflarString(m) {
  const list = m?.mualliflar ?? m?.muallif;
  if (Array.isArray(list) && list.length) {
    return list
      .slice()
      .sort((a, b) => (a?.tartib ?? 0) - (b?.tartib ?? 0))
      .map((a) => {
        if (typeof a === "string") return a.trim();
        return (a?.ism_familya || [a?.familiya, a?.ism, a?.sharif].filter(Boolean).join(" ")).trim();
      })
      .filter(Boolean)
      .join(", ");
  }
  if (m?.muallif && typeof m.muallif === "object" && !Array.isArray(m.muallif) && m.muallif.ism_familya) {
    return m.muallif.ism_familya;
  }
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
    yuborilgan: ARTICLE_STATUS.SUBMITTED,
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
    qabul_qilingan: ARTICLE_STATUS.ACCEPTED,
    tolovsiz_qabul_qilingan: ARTICLE_STATUS.ACCEPTED,
    accepted: ARTICLE_STATUS.ACCEPTED,
    rad_etildi: ARTICLE_STATUS.REJECTED,
    rad_etilgan: ARTICLE_STATUS.REJECTED,
    rejected: ARTICLE_STATUS.REJECTED,
    nashr_etilgan: ARTICLE_STATUS.PUBLISHED,
    published: ARTICLE_STATUS.PUBLISHED,
    qayta_korib_chiqish: ARTICLE_STATUS.REVISION_REQUIRED,
    revision: ARTICLE_STATUS.REVISION_REQUIRED,
  };

  return ALIASES[s] ?? ARTICLE_STATUS.SUBMITTED;
}

/** Backend `holat`: bo'sh joy → _, katta harf */
export function normalizeApiHolatKey(holat) {
  if (holat == null || holat === "") return null;
  return String(holat).trim().toUpperCase().replace(/\s+/g, "_");
}

/** Muallif panelidagi API holatlari bilan moslash; `holat` yoki ichki status bo'yicha */
export function inferMuallifHolatKeyForPanel(article) {
  if (article?.holatKey && MUALLIF_API_HOLAT_LABELS[article.holatKey]) {
    return article.holatKey;
  }
  const fromHolat = normalizeApiHolatKey(article?.holat);
  if (fromHolat === "KORIB_CHIQILMOQDA") return MUALLIF_API_HOLAT.YUBORILGAN;
  if (fromHolat && MUALLIF_API_HOLAT_LABELS[fromHolat]) return fromHolat;

  const s = article?.status;
  if (s === ARTICLE_STATUS.PAYMENT_PENDING) return MUALLIF_API_HOLAT.TOLOV_KUTILMOQDA;
  if (s === ARTICLE_STATUS.PUBLISHED) return MUALLIF_API_HOLAT.NASHR_ETILGAN;
  if (s === ARTICLE_STATUS.REJECTED || s === ARTICLE_STATUS.REVIEW_REJECTED) {
    return MUALLIF_API_HOLAT.RAD_ETILGAN;
  }
  if (s === ARTICLE_STATUS.ACCEPTED) return MUALLIF_API_HOLAT.QABUL_QILINGAN;
  if (
    s === ARTICLE_STATUS.ASSIGNED ||
    s === ARTICLE_STATUS.UNDER_REVIEW ||
    s === ARTICLE_STATUS.IN_EDITING ||
    s === ARTICLE_STATUS.REVIEW_ACCEPTED ||
    s === ARTICLE_STATUS.REVISION_REQUIRED
  ) {
    return MUALLIF_API_HOLAT.YUBORILGAN;
  }
  return MUALLIF_API_HOLAT.YUBORILGAN;
}

/** Backend TaqrizHolati (TextChoices) — ko'rinish matnlari */
export const TAQRIZ_HOLATI_LABELS = {
  KUTILMOQDA: "Taqriz kutilmoqda",
  QABUL: "Taqrizchi qabul qildi",
  RAD: "Taqrizchi rad etdi",
};

export function normalizeTaqrizHolatiKey(v) {
  if (v == null || v === "") return null;
  return String(v).trim().toUpperCase().replace(/\s+/g, "_");
}

export function resolveTaqrizHolatiKey(raw) {
  return normalizeTaqrizHolatiKey(raw) || "KUTILMOQDA";
}

export function formatTaqrizHolatiLabel(raw) {
  const key = resolveTaqrizHolatiKey(raw);
  return TAQRIZ_HOLATI_LABELS[key] || key;
}

/** Superadmin jadvali kutgan maydonlar bilan boyitadi */
export function normalizeMaqolaForDashboard(m) {
  const id = m?.id ?? m?.pk ?? m?.uuid ?? null;
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
        [m.taqrizchi.ism, m.taqrizchi.familiya].filter(Boolean).join(" ").trim() ||
        [m.taqrizchi.first_name, m.taqrizchi.last_name].filter(Boolean).join(" ")
      : null);

  const taqrizHolatiRaw = normalizeTaqrizHolatiKey(m?.taqriz_holati ?? m?.taqrizHolati);
  const taqrizHolati = taqrizHolatiRaw || "KUTILMOQDA";
  const taqrizIzohi = String(m?.taqriz_izohi ?? m?.taqriz_izoh ?? "").trim();
  const holatKey = normalizeApiHolatKey(m?.holat);
  // to'lovsiz qabul belgisi: holat o'zgargandan keyin ham (nashr etilganda) saqlanishi uchun
  const tolovsizQabul =
    holatKey === "TOLOVSIZ_QABUL_QILINGAN" ||
    m?.tolovsiz_qabul === true ||
    m?.tolovsiz === true ||
    m?.is_free === true ||
    m?.tolov_talab_qilinmaydi === true ||
    m?.tolov_amalga_oshirildi === false;
  const dateRaw =
    m?.yuborilgan_vaqt ||
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
    holatKey: holatKey || null,
    tolovsizQabul,
    holatNomi: m?.holat_nomi ?? null,
    yuborilganVaqt: m?.yuborilgan_vaqt ?? null,
    articleTitle: m?.sarlavha ?? m?.articleTitle ?? m?.title ?? "",
    authorNames: mualliflarString(m),
    category: rukn?.nom ?? m?.category ?? m?.rukn_nomi ?? "",
    status: mapApiStatusToArticleStatus(m?.holat ?? m?.status ?? m?.jarayon),
    createdAt: dateRaw,
    submittedAt: dateRaw,
    submittedDate: dateRaw,
    articleFileUrl:
      resolveFileUrl(m?.fayl) ||
      m?.pdf ||
      m?.fayl_url ||
      m?.file_url ||
      m?.articleFileUrl ||
      null,
    fileName: m?.fayl_nomi || m?.fileName || null,
    assignedTo: assignedEmail,
    assignedToName: assignedName || assignedEmail,
    taqrizHolati,
    taqrizIzohi,
  };
}

/** Taqrizchi paneli: muallif shaxsini ko'rsatmaydi */
function anonymizeArticleForReviewer(article) {
  return {
    ...article,
    authorNames: "Anonim muallif",
    fullName: "Anonim muallif",
    email: null,
    phone: null,
    workplace: null,
    position: null,
    authorEmail: null,
    authors: Array.isArray(article.authors)
      ? article.authors.map((a) => ({
          ...a,
          fullName: "Anonim muallif",
          email: null,
          phone: null,
          workplace: a.workplace ? "****" : null,
          position: a.position ? "****" : null,
        }))
      : article.authors,
  };
}

/**
 * GET /taqrizchi/maqolalar/ javobi uchun — dashboard maydonlari + tayinlangan/taqriz fayl mapping.
 */
export function normalizeMaqolaForReviewerDashboard(m) {
  const base = normalizeMaqolaForDashboard(m);
  const assignedAt =
    m?.taqrizchi_tayinlangan_vaqt ??
    m?.tayinlangan_vaqt ??
    m?.tayinlangan_sana ??
    m?.assigned_at ??
    m?.assignedAt ??
    base?.yuborilgan_vaqt ??
    base?.yuborilganVaqt ??
    base?.submittedAt ??
    base?.createdAt ??
    null;

  const tf = m?.taqriz_fayl;
  const reviewFileUrl =
    resolveFileUrl(tf) ??
    m?.taqriz_fayl_url ??
    m?.review_file_url ??
    m?.reviewFileUrl ??
    null;

  let reviewFile =
    m?.taqriz_fayl_nomi ??
    m?.taqriz_fayl_nom ??
    m?.review_file ??
    m?.reviewFile ??
    null;
  if (!reviewFile && typeof tf === "string") {
    reviewFile = tf.split("/").filter(Boolean).pop() || null;
  }
  if (!reviewFile && reviewFileUrl) {
    reviewFile =
      String(reviewFileUrl).split("/").filter(Boolean).pop() || "Taqriz fayli";
  }

  const taqrizHolati =
    normalizeTaqrizHolatiKey(m?.taqriz_holati ?? m?.taqrizHolati) ?? base.taqrizHolati;

  return anonymizeArticleForReviewer({
    ...base,
    assignedAt,
    reviewFile,
    reviewFileUrl,
    reviewComment: m?.taqriz_izoh ?? m?.review_comment ?? base.reviewComment,
    reviewConclusion:
      m?.taqriz_xulosa ?? m?.review_conclusion ?? base.reviewConclusion,
    reviewDecision:
      m?.taqriz_tavsiya ?? m?.review_decision ?? base.reviewDecision,
    taqrizHolati,
    taqrizIzohi: String(m?.taqriz_izohi ?? m?.taqriz_izoh ?? base.taqrizIzohi ?? "").trim(),
  });
}

export function normalizeTaqrizchiMaqolalarList(raw) {
  return parseMaqolalarListPayload(raw)
    .map((item) => normalizeMaqolaForReviewerDashboard(item))
    .filter((a) => a.id != null);
}

export function normalizeMaqolalarList(raw) {
  return parseMaqolalarListPayload(raw)
    .map((item) => normalizeMaqolaForDashboard(item))
    .filter((a) => a.id != null);
}
