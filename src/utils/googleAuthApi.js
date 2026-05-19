import { parseApiError } from "./apiError";

/** @returns {string} Trimlangan Google OAuth Web Client ID yoki bo'sh qator */
export function getGoogleClientId() {
  const raw = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * VITE_BASE_URL odatda `/api` bilan tugaydi (masalan https://journal.ktri.uz/api).
 * Agar faqat VITE_API_URL (origin) berilgan bo'lsa — `/api` qo'shiladi.
 */
export function resolveApiBaseUrl() {
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  if (base) return base;
  const origin = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return origin ? `${origin}/api` : "";
}

/**
 * POST /api/auth/google/ — backend Google id_token ni tekshiradi, user + JWT qaytaradi.
 */
export async function postGoogleIdToken(idToken) {
  const base = resolveApiBaseUrl();
  if (!base) {
    throw new Error(
      "API bazaviy URL sozlanmagan (VITE_BASE_URL yoki VITE_API_URL)",
    );
  }

  const res = await fetch(`${base}/auth/google/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    throw new Error(
      parseApiError(data, "Google orqali kirishda xatolik yuz berdi"),
    );
  }

  return data;
}
