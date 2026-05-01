import { createContext, useCallback, useEffect, useState } from "react";
import { refreshAccessToken } from "../components/authentication/auth";
import { jwtDecode } from "jwt-decode";
import { ROLES, normalizeRole } from "../constants/roles";
import {
  clearAuthStorage,
  clearLegacyAuthStorage,
  getAccessToken,
  getRefreshToken,
  getUserData,
  getUserRole,
  setAccessToken,
  setAuthTokens,
  setRefreshToken,
  setUserData as saveUserDataToStorage,
  setUserRole as saveUserRoleToStorage,
} from "../utils/authStorage";

export const AuthContext = createContext();

const TOKEN_REFRESH_SKEW_SECONDS = 30;

const apiBase = () => (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

function unwrapUserPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.user && typeof payload.user === "object") return payload.user;
  if (payload.data && typeof payload.data === "object") return payload.data;
  if (Array.isArray(payload.results)) return payload.results[0] || null;
  if (Array.isArray(payload)) return payload[0] || null;
  return payload;
}

/** Login / profil javoblarini UI (first_name, last_name, role) bilan bir xil qiladi */
function normalizeUser(raw) {
  const user = unwrapUserPayload(raw);
  if (!user || typeof user !== "object") return null;

  const role = normalizeRole(user.role ?? user.rol ?? user.user_role);
  const firstName = user.first_name ?? user.ism ?? user.name ?? "";
  const lastName = user.last_name ?? user.familiya ?? user.surname ?? "";

  return {
    ...user,
    first_name: firstName,
    last_name: lastName,
    role,
  };
}

function saveUser(user, setUserData, setUserRole) {
  const normalized = normalizeUser(user);
  if (!normalized) return null;

  saveUserDataToStorage(normalized);
  saveUserRoleToStorage(normalized.role);
  setUserData(normalized);
  setUserRole(normalized.role);
  return normalized;
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(
    Boolean(getAccessToken() || getRefreshToken())
  );
  const [userData, setUserData] = useState(
    getUserData()
  );
  const [userRole, setUserRole] = useState(
    getUserRole() || ROLES.USER
  );

  // Token muddatini tekshirish
  const isTokenExpired = useCallback((token, skewSeconds = 0) => {
    try {
      if (!token || typeof token !== "string") {
        return true;
      }
      const decoded = jwtDecode(token);
      if (!decoded.exp) return false;
      const currentTime = Date.now() / 1000;
      return decoded.exp <= currentTime + skewSeconds;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  }, []);

  const fetchProfile = useCallback(async (accessToken, baseUser = null) => {
    if (!accessToken) return baseUser;

    const endpoints = [`${apiBase()}/profil/`, `${apiBase()}/profil`];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 404) {
          lastError = new Error("Profil endpoint topilmadi");
          continue;
        }

        if (!response.ok) {
          throw new Error(`Profil so'rovi xato: ${response.status}`);
        }

        const payload = await response.json();
        const normalizedProfile = normalizeUser(payload);
        if (!normalizedProfile) return baseUser;

        return normalizeUser({
          ...(baseUser || {}),
          ...normalizedProfile,
        });
      } catch (error) {
        lastError = error;
      }
    }

    console.warn("Profil ma'lumotlari olinmadi:", lastError);
    return baseUser;
  }, []);

  // Login - access va refresh tokenlarni saqlash; ixtiyoriy user — login javobidan
  const login = async (access, refresh, role = ROLES.USER, userFromLogin = null) => {
    if (!access || !refresh) {
      console.error("login: access va refresh token talab qilinadi");
      return;
    }

    const resolvedRole = normalizeRole(
      userFromLogin != null
        ? userFromLogin.role ?? userFromLogin.rol ?? role
        : role
    );

    setAuthTokens({ access, refresh });
    saveUserRoleToStorage(resolvedRole);
    setAuth(true);
    setUserRole(resolvedRole);

    const baseFromLogin = userFromLogin
      ? normalizeUser({ ...userFromLogin, role: resolvedRole })
      : null;
    if (baseFromLogin) {
      saveUser(baseFromLogin, setUserData, setUserRole);
    }

    // Profil endpointi qo'shimcha maydonlar berishi mumkin — login user bilan birlashtiramiz
    const profileUser = await fetchProfile(access, baseFromLogin);
    if (profileUser) {
      saveUser(profileUser, setUserData, setUserRole);
    }
  };

  // Logout
  const logout = useCallback(() => {
    setAuth(false);
    clearAuthStorage();
    setUserData(null);
    setUserRole(ROLES.USER);
  }, []);

  // Refresh token
  const refresh = useCallback(async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken || isTokenExpired(refreshToken)) {
      logout();
      return null;
    }

    try {
      const newTokens = await refreshAccessToken(refreshToken);
      if (newTokens.access) {
        setAccessToken(newTokens.access);
        if (newTokens.refresh) {
          setRefreshToken(newTokens.refresh);
        }
        setAuth(true);
        return newTokens.access;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout();
      return null;
    }
  }, [isTokenExpired, logout]);

  // Component mount bo'lganda tokenlarni tekshirish
  useEffect(() => {
    let cancelled = false;
    clearLegacyAuthStorage();

    const initAuth = async () => {
      const storedAccessToken = getAccessToken();
      const storedRefreshToken = getRefreshToken();
      const storedRole = getUserRole();
      const storedUserData = getUserData();

      if (storedUserData && !cancelled) {
        const normalizedStoredUser = normalizeUser(storedUserData);
        if (normalizedStoredUser) {
          setUserData(normalizedStoredUser);
          setUserRole(normalizeRole(normalizedStoredUser.role || storedRole));
        }
      } else if (storedRole && !cancelled) {
        setUserRole(storedRole);
      }

      let activeAccessToken = storedAccessToken;

      if (!activeAccessToken || isTokenExpired(activeAccessToken, TOKEN_REFRESH_SKEW_SECONDS)) {
        if (storedRefreshToken && !isTokenExpired(storedRefreshToken)) {
          activeAccessToken = await refresh();
        } else {
          logout();
          return;
        }
      }

      if (!activeAccessToken || cancelled) return;

      setAuth(true);
      const profileUser = await fetchProfile(activeAccessToken, storedUserData);
      if (profileUser && !cancelled) {
        saveUser(profileUser, setUserData, setUserRole);
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [fetchProfile, isTokenExpired, logout, refresh]);

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        refresh,
        isTokenExpired,
        userData,
        userRole,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};