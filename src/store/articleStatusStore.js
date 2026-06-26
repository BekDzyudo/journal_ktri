import { create } from 'zustand'

// ktri_article_status_snapshot_v1 o'rniga — in-memory, localStorage'ga yozilmaydi
const useArticleStatusStore = create((set, get) => ({
  snapshots: {},

  getSnapshot: (key) => get().snapshots[key] || {},

  setSnapshot: (key, data) =>
    set((state) => ({
      snapshots: { ...state.snapshots, [key]: data },
    })),
}))

export default useArticleStatusStore
