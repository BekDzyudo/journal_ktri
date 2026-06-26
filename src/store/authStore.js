import { create } from 'zustand'

const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  role: null,

  setAuth: (token, userData) => set({
    accessToken: token,
    user: {
      id: userData.id,
      ism: userData.ism,
      familiya: userData.familiya,
      rol: userData.rol || userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name,
    },
    role: userData.rol || userData.role || null,
  }),

  // Faqat tokenni yangilash (refresh so'ng)
  setAccessToken: (token) => set({ accessToken: token }),

  // Faqat user ma'lumotlarini yangilash
  setUser: (userData) => set({ user: userData }),

  // Faqat rolni yangilash
  setRole: (role) => set({ role }),

  clearAuth: () => set({
    accessToken: null,
    user: null,
    role: null,
  }),
}))

export default useAuthStore
