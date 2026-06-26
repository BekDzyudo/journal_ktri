import useAuthStore from '../store/authStore'
import { clearLegacyStorage } from './clearLegacyStorage'

// ── Getters ─────────────────────────────────────────────────────────────────

export function getAccessToken() {
  return useAuthStore.getState().accessToken
}

// TODO: Backend HttpOnly cookie qo'llab-quvvatlagandan keyin bu qatorni o'chir.
// Vaqtinchalik: sessionStorage ishlatiladi (localStorage dan xavfsizroq —
// brauzer yopilganda avtomatik o'chadi, tab izolyatsiyalangan).
export function getRefreshToken() {
  return sessionStorage.getItem('refreshToken')
}

export function getUserRole() {
  return useAuthStore.getState().role
}

export function getUserData() {
  return useAuthStore.getState().user
}

// ── Setters ─────────────────────────────────────────────────────────────────

export function setAuthTokens({ access, refresh }) {
  if (access) useAuthStore.getState().setAccessToken(access)
  if (refresh) sessionStorage.setItem('refreshToken', refresh)
  clearLegacyStorage()
}

export function setAccessToken(access) {
  if (access) useAuthStore.getState().setAccessToken(access)
  clearLegacyStorage()
}

// TODO: Backend HttpOnly cookie tayyor bo'lganda bu funksiyani o'chir.
export function setRefreshToken(refresh) {
  if (refresh) sessionStorage.setItem('refreshToken', refresh)
  clearLegacyStorage()
}

export function setUserRole(role) {
  if (role) useAuthStore.getState().setRole(role)
  clearLegacyStorage()
}

export function setUserData(userData) {
  if (userData) {
    useAuthStore.getState().setUser({
      id: userData.id,
      ism: userData.ism,
      familiya: userData.familiya,
      first_name: userData.first_name,
      last_name: userData.last_name,
      rol: userData.rol || userData.role,
      role: userData.role || userData.rol,
    })
  }
  clearLegacyStorage()
}

// ── Clear ────────────────────────────────────────────────────────────────────

export function clearAuthStorage() {
  useAuthStore.getState().clearAuth()
  sessionStorage.removeItem('refreshToken')
  clearLegacyStorage()
}

export function clearLegacyAuthStorage() {
  clearLegacyStorage()
}
