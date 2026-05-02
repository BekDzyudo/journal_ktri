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
