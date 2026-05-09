/**
 * Maqola jadvallari uchun umumiy qidiruv/filter yordamchilari (user / taqrizchi / superadmin).
 */

/** @returns {boolean} */
export function articleMatchesSearch(article, rawQuery) {
  const q = (rawQuery ?? "").trim().toLowerCase();
  if (!q) return true;
  const title = (article.articleTitle ?? "").toLowerCase();
  const authors = (article.authorNames ?? "").toLowerCase();
  return title.includes(q) || authors.includes(q);
}

/** Backend status → panelda chiqadigan yozuv bilan filtrlash. */
export function filterArticlesByDisplayStatus(
  articles,
  searchQuery,
  filterStatus,
  statusDisplayMap
) {
  return articles.filter((article) => {
    if (!articleMatchesSearch(article, searchQuery)) return false;
    const displayStatus = statusDisplayMap[article.status] ?? article.status;
    return filterStatus === "all" || displayStatus === filterStatus;
  });
}

/** Bir xil yozuv bilan takrorlangan optionlardan qutilish uchun */
export function uniqueDisplayStatuses(articles, statusDisplayMap) {
  return [...new Set(articles.map((a) => statusDisplayMap[a.status] ?? a.status))];
}

export function getArticleDate(article) {
  return (
    article.yuborilganVaqt ||
    article.yuborilgan_vaqt ||
    article.submittedAt ||
    article.createdAt ||
    article.submittedDate ||
    article.assignedAt ||
    article.reviewedAt ||
    article.paidAt ||
    null
  );
}

/** dd.mm.yyyy */
export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

/** dd.mm.yyyy HH:MM */
export function formatArticleDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${d}.${m}.${y} ${h}:${min}`;
}

function toDateOnly(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
}

export function articleMatchesDateRange(article, fromDate, toDate) {
  const rawDate = getArticleDate(article);
  if (!rawDate) return true;

  const articleDate = new Date(rawDate);
  if (Number.isNaN(articleDate.getTime())) return true;

  const from = toDateOnly(fromDate);
  const to = toDateOnly(toDate, true);

  if (from && articleDate < from) return false;
  if (to && articleDate > to) return false;
  return true;
}

export function filterArticlesByDateRange(articles, fromDate, toDate) {
  return articles.filter((article) => articleMatchesDateRange(article, fromDate, toDate));
}
