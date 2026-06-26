import { create } from 'zustand'

const useNotificationStore = create((set, get) => ({
  notifications: [],

  getAll: () => get().notifications,

  setAll: (list) => set({ notifications: Array.isArray(list) ? list.slice(0, 500) : [] }),

  addOne: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 500),
    })),

  update: (updater) =>
    set((state) => ({ notifications: state.notifications.map(updater) })),

  remove: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clear: () => set({ notifications: [] }),
}))

export default useNotificationStore
