/**
 * Django REST / umumiy API xato javoblarini foydalanuvchi uchun qisqa matnga aylantiradi.
 */
export function parseApiError(data, fallback = "Xatolik yuz berdi") {
  if (data == null) return fallback;
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map(String).join(" ");

  const messages = [];
  if (Array.isArray(data.non_field_errors)) {
    messages.push(...data.non_field_errors.map(String));
  }

  for (const [key, val] of Object.entries(data)) {
    if (key === "detail" || key === "non_field_errors") continue;
    if (Array.isArray(val)) {
      messages.push(...val.map(String));
    } else if (typeof val === "string" || typeof val === "number") {
      messages.push(String(val));
    }
  }

  return messages.length ? messages.join(" ") : fallback;
}

/**
 * DRF field xatolarini { fieldName: firstMessage } ko'rinishiga keltiradi.
 */
export function mapApiFieldErrors(data) {
  const fieldErrors = {};
  if (!data || typeof data !== "object") return fieldErrors;

  for (const [key, val] of Object.entries(data)) {
    if (key === "detail" || key === "non_field_errors") continue;
    if (Array.isArray(val) && val.length) {
      fieldErrors[key] = String(val[0]);
    } else if (typeof val === "string") {
      fieldErrors[key] = val;
    }
  }

  return fieldErrors;
}
