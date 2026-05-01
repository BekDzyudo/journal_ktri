const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_DATA_KEY = "userData";
const USER_ROLE_KEY = "userRole";

const AUTH_KEYS = [
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
  USER_ROLE_KEY,
];

const LEGACY_LOCAL_KEYS = [
  ACCESS_TOKEN_KEY,
  USER_DATA_KEY,
  USER_ROLE_KEY,
];

// Eski localStorage sessiyalaridan access/user ma'lumotlarini qoldirmaymiz.
// Refresh token persistent qoladi, shunda browser qayta ochilganda access yangilanadi.
export function clearLegacyAuthStorage() {
  LEGACY_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return (
    sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
    localStorage.getItem(REFRESH_TOKEN_KEY)
  );
}

export function getUserRole() {
  return sessionStorage.getItem(USER_ROLE_KEY);
}

export function setAuthTokens({ access, refresh }) {
  if (access) sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  clearLegacyAuthStorage();
}

export function setAccessToken(access) {
  if (access) sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
  clearLegacyAuthStorage();
}

export function setRefreshToken(refresh) {
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  clearLegacyAuthStorage();
}

export function setUserRole(role) {
  if (role) sessionStorage.setItem(USER_ROLE_KEY, role);
  clearLegacyAuthStorage();
}

export function getUserData() {
  try {
    const value = sessionStorage.getItem(USER_DATA_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    sessionStorage.removeItem(USER_DATA_KEY);
    return null;
  }
}

export function setUserData(userData) {
  if (userData) {
    sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }
  clearLegacyAuthStorage();
}

export function clearAuthStorage() {
  AUTH_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}
