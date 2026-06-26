export const clearLegacyStorage = () => {
  // refreshToken sessionStorage da saqlanadi (vaqtinchalik, backend HttpOnly cookie
  // qo'llab-quvvatlamaguncha) — shu sababdan uni sessionStorage dan O'CHIRMAYMIZ.
  // Faqat eski localStorage yozuvlarini tozalaymiz.
  const bothKeys = [
    'accessToken',
    'userData',
    'userRole',
    'ktri_article_status_snapshot_v1',
    'ktri_notifications_v1',
  ]
  bothKeys.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })

  // refreshToken — faqat eski localStorage yozuvini o'chiramiz
  localStorage.removeItem('refreshToken')
}
