/**
 * 401 bo‘lsa refresh orqali qayta urinadi.
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {() => string | null} getAccessToken
 * @param {() => Promise<string | null>} refresh
 */
export async function fetchWithAuth(url, init = {}, getAccessToken, refresh) {
  const build = (token) => {
    const next = { ...init };
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    next.headers = headers;
    return next;
  };

  let token = getAccessToken?.() ?? null;
  let res = await fetch(url, build(token));
  if (res.status === 401 && typeof refresh === "function") {
    const newToken = await refresh();
    res = await fetch(url, build(newToken));
  }
  return res;
}
