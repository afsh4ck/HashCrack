import { create } from 'zustand'

const API = ''
const WS_BASE = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
const DEFAULT_WORDLIST_NAME = 'rockyou-50.txt'

const useStore = create((set, get) => ({
  // UI
  activeTab: 'cracker',
  theme: 'dark',
  language: 'es',
  setActiveTab: (t) => set({ activeTab: t }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setLanguage: (lang) => set({ language: lang }),

  // Input
  hashInput: '',
  setHashInput: (v) => set({ hashInput: v }),
  detectedHashes: [],
  setDetectedHashes: (d) => set({ detectedHashes: d }),

  // Options
  strategies: ['rainbow', 'dictionary', 'rules', 'bruteforce'],
  selectedWordlistId: null,
  timeout: 300,
  maxLength: 12,
  toggleStrategy: (s) =>
    set((state) => ({
      strategies: state.strategies.includes(s)
        ? state.strategies.filter((x) => x !== s)
        : [...state.strategies, s],
    })),
  setStrategies: (list) => set({ strategies: list }),
  setSelectedWordlistId: (id) => set({ selectedWordlistId: id }),

  // Task / Progress
  taskId: null,
  taskStatus: null,
  setTaskStatus: (s) => set({ taskStatus: s }),

  // Results
  results: [],
  setResults: (r) => set({ results: r }),

  // Wordlists
  wordlists: [],
  setWordlists: (w) => set({ wordlists: w }),
  loadingWordlists: false,
  wordlistCategories: [],
  selectedCategory: null,
  setSelectedCategory: (c) => set({ selectedCategory: c, selectedSubcategory: null }),
  wordlistSubcategories: [],
  selectedSubcategory: null,
  setSelectedSubcategory: (s) => set({ selectedSubcategory: s }),

  // Stats
  stats: null,

  // ─── Actions ───────────────────────────────────────────────
  fetchSubcategories: async (category) => {
    if (!category) { set({ wordlistSubcategories: [] }); return }
    try {
      const res = await fetch(`${API}/api/wordlists/subcategories?category=${encodeURIComponent(category)}`)
      const data = await res.json()
      set({ wordlistSubcategories: data })
    } catch (e) {
      console.error('fetchSubcategories', e)
      set({ wordlistSubcategories: [] })
    }
  },

  fetchWordlists: async (retry = 0) => {
    // Skip fetch if wordlists are already loaded (cache)
    const { wordlists: cached, loadingWordlists: alreadyLoading } = get()
    if (alreadyLoading) return
    if (cached.length > 0 && retry === 0) return
    set({ loadingWordlists: true })
    try {
      const [wlRes, catRes] = await Promise.all([
        fetch(`${API}/api/wordlists`),
        fetch(`${API}/api/wordlists/categories`),
      ])
      const data = await wlRes.json()
      const categories = await catRes.json()
      set({ wordlists: data, wordlistCategories: categories, wordlistSubcategories: [] })
      // Auto-select default wordlist if none selected yet
      const { selectedWordlistId } = get()
      if (!selectedWordlistId && data.length > 0) {
        const defaultWl = data.find((w) => w.name.toLowerCase().includes('rockyou-50'))
          || data.find((w) => w.name.toLowerCase().includes('rockyou'))
          || data[0]
        if (defaultWl) set({ selectedWordlistId: defaultWl.id })
      }
      // If backend returned empty list but we know wordlists should exist, retry once
      if (data.length === 0 && retry < 2) {
        setTimeout(() => get().fetchWordlists(retry + 1), 1500)
      }
    } catch (e) {
      console.error('fetchWordlists', e)
      // Retry on network error (backend may not be ready yet)
      if (retry < 2) {
        setTimeout(() => get().fetchWordlists(retry + 1), 2000)
      }
    } finally {
      set({ loadingWordlists: false })
    }
  },

  scanWordlists: async () => {
    set({ loadingWordlists: true })
    try {
      const res = await fetch(`${API}/api/wordlists/scan`, { method: 'POST' })
      const data = await res.json()
      const allWordlists = data.wordlists || []
      set({ wordlists: allWordlists })
      // Refresh categories after scan
      try {
        const catRes = await fetch(`${API}/api/wordlists/categories`)
        const categories = await catRes.json()
        set({ wordlistCategories: categories, wordlistSubcategories: [] })
      } catch {}
      return data
    } catch (e) {
      console.error('scanWordlists', e)
    } finally {
      set({ loadingWordlists: false })
    }
  },

  deleteWordlist: async (id) => {
    await fetch(`${API}/api/wordlists/${id}`, { method: 'DELETE' })
    set((s) => ({ wordlists: s.wordlists.filter((w) => w.id !== id) }))
  },

  detectHashes: async (text) => {
    const hashes = text.split('\n').map((h) => h.trim()).filter(Boolean)
    if (!hashes.length) return
    try {
      const res = await fetch(`${API}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashes }),
      })
      const data = await res.json()
      set({ detectedHashes: data })
    } catch (e) {
      console.error('detectHashes', e)
    }
  },

  startCracking: async () => {
    const { hashInput, strategies, selectedWordlistId } = get()
    const hashes = hashInput.split('\n').map((h) => h.trim()).filter(Boolean)
    if (!hashes.length || !strategies.length) return

    try {
      const res = await fetch(`${API}/api/crack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashes,
          strategies,
          wordlist_id: selectedWordlistId || null,
        }),
      })
      if (!res.ok) {
        console.error('startCracking: API error', res.status, await res.text())
        return
      }
      const data = await res.json()
      if (!data.task_id) return
      set({ taskId: data.task_id, results: [], taskStatus: { status: 'queued', processed: 0, cracked: 0, total: hashes.length, results: [] } })

      // Open WebSocket
      const ws = new WebSocket(`${WS_BASE}/ws/${data.task_id}`)
      ws.onmessage = (e) => {
        const payload = JSON.parse(e.data)
        set({ taskStatus: payload })
        if (payload.results) set({ results: payload.results })
        if (payload.status === 'completed' || payload.status === 'stopped') ws.close()
      }
      ws.onerror = () => ws.close()

      return data.task_id
    } catch (e) {
      console.error('startCracking', e)
    }
  },

  stopTask: async () => {
    const { taskId } = get()
    if (!taskId) return
    await fetch(`${API}/api/crack/${taskId}/stop`, { method: 'POST' })
  },

  fetchStats: async () => {
    try {
      const res = await fetch(`${API}/api/stats`)
      set({ stats: await res.json() })
    } catch (e) {}
  },

  clearStats: async () => {
    try {
      await fetch(`${API}/api/stats`, { method: 'DELETE' })
      const res = await fetch(`${API}/api/stats`)
      set({ stats: await res.json(), results: [] })
    } catch (e) {}
  },

  exportResults: async (fmt) => {
    window.open(`${API}/api/results/export/${fmt}`, '_blank')
  },
}))

export default useStore
