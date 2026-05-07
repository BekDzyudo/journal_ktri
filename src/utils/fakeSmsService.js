/**
 * Fake SMS Service — localStorage + console logging.
 * Real API ga o'tkazish uchun sendSms() ichidagi TODO qismini almashtiring.
 */

const SMS_LOG_KEY = "ktri_sms_log_v1";

export const SMS_EVENTS = {
  ARTICLE_PAYMENT_PENDING: "article_payment_pending", // Muallif: to'lov kerak
  ARTICLE_ACCEPTED:        "article_accepted",         // Muallif: maqola qabul qilindi
  ARTICLE_REJECTED:        "article_rejected",         // Muallif: maqola rad etildi
  REVIEWER_ASSIGNED:       "reviewer_assigned",        // Admin: taqriz uchun material keldi
  REVIEW_SUBMITTED:        "review_submitted",         // Superadmin: taqriz xulosasi keldi
  ARTICLE_PAID:            "article_paid",             // Superadmin: to'lov qabul qilindi
  REVISION_REQUIRED:       "revision_required",        // Muallif: qayta ko'rib chiqish kerak
};

const SMS_TEMPLATES = {
  [SMS_EVENTS.ARTICLE_PAYMENT_PENDING]: (d) =>
    `KTRI: "${d.articleTitle}" maqolangiz dastlabki ko'rikdan o'tdi. To'lovni amalga oshiring: ktri.uz/panel`,

  [SMS_EVENTS.ARTICLE_ACCEPTED]: (d) =>
    `KTRI: "${d.articleTitle}" maqolangiz qabul qilindi va nashrga tavsiya etildi. Tafsilotlar: ktri.uz/panel`,

  [SMS_EVENTS.ARTICLE_REJECTED]: (d) =>
    `KTRI: "${d.articleTitle}" maqolangiz rad etildi. ${d.reason ? `Sabab: ${d.reason}. ` : ""}Murojaat: ktri.uz/contact`,

  [SMS_EVENTS.REVIEWER_ASSIGNED]: (d) =>
    `KTRI: Sizga yangi maqola taqriz uchun tayinlandi. "${d.articleTitle}" maqolasini ko'rish: ktri.uz/panel`,

  [SMS_EVENTS.REVIEW_SUBMITTED]: (d) =>
    `KTRI: Taqrizchi xulosasi keldi. "${d.articleTitle}" maqolasi uchun yakuniy qaror chiqaring: ktri.uz/panel`,

  [SMS_EVENTS.ARTICLE_PAID]: (d) =>
    `KTRI: "${d.articleTitle}" maqolasi uchun CLICK to'lovi qabul qilindi. Ref: ${d.ref || "-"}`,

  [SMS_EVENTS.REVISION_REQUIRED]: (d) =>
    `KTRI: "${d.articleTitle}" maqolangizni qayta ko'rib chiqishingiz so'ralmoqda. Izoh: ktri.uz/panel`,
};

/**
 * @param {object} opts
 * @param {string} opts.to           - Telefon raqami "+998901234567"
 * @param {string} opts.toName       - Qabul qiluvchi ismi (log uchun)
 * @param {string} opts.event        - SMS_EVENTS.* qiymatlaridan biri
 * @param {object} opts.data         - Template uchun ma'lumotlar
 */
export function sendSms({ to, toName = "", event, data = {} }) {
  if (!to) return null;

  const template = SMS_TEMPLATES[event];
  const message = template ? template(data) : `KTRI: ${event}`;

  const smsRecord = {
    id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    to,
    toName,
    event,
    message,
    sentAt: new Date().toISOString(),
    status: "sent",
  };

  console.log(
    `%c📱 [FAKE SMS]\n  To: ${toName} (${to})\n  Event: ${event}\n  Message: ${message}`,
    "color:#7c3aed; font-weight:bold;"
  );

  try {
    const logs = JSON.parse(localStorage.getItem(SMS_LOG_KEY) || "[]");
    logs.unshift(smsRecord);
    if (logs.length > 300) logs.splice(300);
    localStorage.setItem(SMS_LOG_KEY, JSON.stringify(logs));
  } catch {
    // localStorage to'la bo'lishi mumkin — e'tibor bermaslik
  }

  // TODO: Real SMS API ga o'tkazish uchun quyidagini ulang:
  // try {
  //   await fetch(`${import.meta.env.VITE_BASE_URL}/sms/send/`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getAccessToken() },
  //     body: JSON.stringify({ to, message, event }),
  //   });
  // } catch (err) { console.error("SMS yuborishda xatolik:", err); }

  return smsRecord;
}

export function getSmsLog() {
  try {
    return JSON.parse(localStorage.getItem(SMS_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearSmsLog() {
  localStorage.removeItem(SMS_LOG_KEY);
}
