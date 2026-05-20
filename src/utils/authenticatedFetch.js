/**
 * Django CSRF (cookie + `X-CSRFToken` jufti) uchun csrftoken o‘qiladi.
 * @param {string} name
 */
function getCookie(name) {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return m ? decodeURIComponent(m[1].trim()) : "";
}

function getCsrfToken() {
  return getCookie("csrftoken") || getCookie("csrf");
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * 401 bo‘lsa refresh orqali qayta urinadi.
 * Django CSRF uchun xavfli metodlarda `X-CSRFToken` va cookie yuboriladi.
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {() => string | null} getAccessToken
 * @param {() => Promise<string | null>} refresh
 */
export async function fetchWithAuth(url, init = {}, getAccessToken, refresh) {
  const method = (init.method || "GET").toUpperCase();
  const needsCsrf = UNSAFE_METHODS.has(method);

  const build = (token) => {
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (needsCsrf) {
      const csrf = getCsrfToken();
      if (csrf) headers.set("X-CSRFToken", csrf);
    }
    return {
      ...init,
      credentials: init.credentials ?? "same-origin",
      headers,
    };
  };

  let token = getAccessToken?.() ?? null;
  let res = await fetch(url, build(token));
  if (res.status === 401 && typeof refresh === "function") {
    const newToken = await refresh();
    res = await fetch(url, build(newToken));
  }
  return res;
}
