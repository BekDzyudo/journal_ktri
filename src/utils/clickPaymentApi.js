import { fetchWithAuth } from "./authenticatedFetch.js";
import { parseApiError } from "./apiError.js";

/**
 * Click to'lovi: backend `api/v1/tolov/boshlash/<maqola_id>/` va `.../tolov/holati/<maqola_id>/`
 */

export function getApiBase() {
  return (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
}

function normalizeTolovArticleId(maqolaId) {
  if (maqolaId == null) return "";
  const id = typeof maqolaId === "number" ? String(maqolaId) : String(maqolaId).trim();
  if (!id || id === "[object Object]") return "";
  return id;
}

export function tolovBoshlashUrl(base, maqolaId) {
  const id = normalizeTolovArticleId(maqolaId);
  return `${base}/v1/tolov/boshlash/${encodeURIComponent(id)}/`;
}

export function tolovHolatiUrl(base, maqolaId) {
  const id = normalizeTolovArticleId(maqolaId);
  return `${base}/v1/tolov/holati/${encodeURIComponent(id)}/`;
}

/** Backend JSON ichidan Click sahifasiga yo'naltirish URLini ajratadi */
export function extractPaymentRedirectUrl(payload) {
  if (payload == null || typeof payload !== "object") return null;
  const candidates = [
    payload.redirect_url,
    payload.redirectUrl,
    payload.checkout_url,
    payload.checkoutUrl,
    payload.click_url,
    payload.clickUrl,
    payload.payment_url,
    payload.paymentUrl,
    payload.url,
    payload.link,
    payload.next,
    payload.data?.redirect_url,
    payload.data?.redirectUrl,
    payload.data?.url,
    payload.data?.click_url,
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (/^https?:\/\//i.test(t)) return t;
    }
  }
  return null;
}

/** To'lov yakunlanganmi (javob strukturalarining turli variantlari) */
export function isTolanganFromHolati(payload) {
  if (payload == null || typeof payload !== "object") return false;
  if (payload.paid === true || payload.tolangan === true || payload.is_paid === true) return true;

  const s = `${payload.tolov_holati ?? payload.payment_status ?? payload.status ?? ""}`.toLowerCase();
  if (["paid", "success", "completed", "tolangan", "muvaffaq"].some((x) => s.includes(x))) return true;

  const holat = `${payload.holat ?? ""}`.toUpperCase();
  if (holat.includes("TOLOV") && holat.includes("QILINDI")) return true;

  return false;
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function processStartTolovResponse(res, base) {
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const loc = (res.headers.get("Location") || res.headers.get("location") || "").trim();
    if (loc) {
      try {
        const href = /^https?:\/\//i.test(loc) ? loc : new URL(loc, `${base.replace(/\/$/, "")}/`).href;
        return { redirect: href, raw: null, response: res };
      } catch {
        /* fall through */
      }
    }
  }
  return null;
}

/**
 * To'lovni boshlash.
 * Backend GET yoki POST dan birini qabul qilishi mumkin; avval POST ({}), 405 bo'lsa GET.
 * Oldin GET-birinchi bo'lganda POST-only serverda brauzer konsoleda har doim 405 qizil chiziq qolardi.
 */
export async function startTolovSession(maqolaId, getAccessToken, refreshAccessToken, init = {}) {
  const base = getApiBase();
  if (!base) throw new Error("API bazaviy URL sozlanmagan (VITE_BASE_URL)");

  const idNorm = normalizeTolovArticleId(maqolaId);
  if (!idNorm) throw new Error("Noto'g'ri maqola ID (id/pk yuboring).");

  const url = tolovBoshlashUrl(base, idNorm);
  const redirectManual = init.redirect ?? "manual";

  const tryGet = async () =>
    fetchWithAuth(
      url,
      {
        ...init,
        method: "GET",
        redirect: redirectManual,
        body: undefined,
        headers: (() => {
          const h = new Headers(init.headers || {});
          h.delete("Content-Type");
          return h;
        })(),
      },
      getAccessToken,
      refreshAccessToken
    );

  const tryPost = async () => {
    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetchWithAuth(
      url,
      {
        ...init,
        method: "POST",
        headers,
        body: init.body ?? "{}",
        redirect: redirectManual,
      },
      getAccessToken,
      refreshAccessToken
    );
  };

  let res = await tryPost();

  if (res.status === 405) {
    res = await tryGet();
  }

  const fromRedirect = processStartTolovResponse(res, base);
  if (fromRedirect) return fromRedirect;

  const json = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(parseApiError(json, `To'lovni boshlashda xatolik (${res.status})`));
  }

  const redirect = extractPaymentRedirectUrl(json);
  return { redirect, raw: json, response: res };
}

/**
 * Maqola to'lov holatini tekshirish.
 */
export async function fetchTolovHolati(maqolaId, getAccessToken, refreshAccessToken) {
  const base = getApiBase();
  if (!base) throw new Error("API bazaviy URL sozlanmagan (VITE_BASE_URL)");

  const idNorm = normalizeTolovArticleId(maqolaId);
  if (!idNorm) throw new Error("Noto'g'ri maqola ID.");

  const url = tolovHolatiUrl(base, idNorm);
  const res = await fetchWithAuth(url, { method: "GET" }, getAccessToken, refreshAccessToken);
  const json = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(parseApiError(json, `Holatni olishda xatolik (${res.status})`));
  }

  return { paid: isTolanganFromHolati(json), raw: json };
}
