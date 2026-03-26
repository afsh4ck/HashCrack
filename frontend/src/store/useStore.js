import { create } from 'zustand'

const API = 'http://localhost:8000'
const DEFAULT_WORDLIST_NAME = 'rockyou-35.txt'

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
  strategies: ['rainbow', 'dictionary', 'rules'],
  selectedWordlistId: null,
  timeout: 300,
  maxLength: 12,
  toggleStrategy: (s) =>
    set((state) => ({
      strategies: state.strategies.includes(s)
        ? state.strategies.filter((x) => x !== s)
        : [...state.strategies, s],
    })),
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
  setSelectedCategory: (c) => set({ selectedCategory: c }),

  // Stats
  stats: null,

  // ─── Actions ───────────────────────────────────────────────
  fetchWordlists: async () => {
    set({ loadingWordlists: true })
    try {
      const [wlRes, catRes] = await Promise.all([
        fetch(`${API}/api/wordlists`),
        fetch(`${API}/api/wordlists/categories`),
      ])
      const data = await wlRes.json()
      const categories = await catRes.json()
      set({ wordlists: data, wordlistCategories: categories })
      // Auto-select default wordlist if none selected yet
      const { selectedWordlistId } = get()
      if (!selectedWordlistId && data.length > 0) {
        const defaultWl = data.find((w) => w.name === DEFAULT_WORDLIST_NAME)
        if (defaultWl) {
          set({ selectedWordlistId: defaultWl.id })
        }
      }
    } catch (e) {
      console.error('fetchWordlists', e)
    } finally {
      set({ loadingWordlists: false })
    }
  },

  scanWordlists: async () => {
    set({ loadingWordlists: true })
    try {
      const res = await fetch(`${API}/api/wordlists/scan`, { method: 'POST' })
      const data = await res.json()
      set({ wordlists: data.wordlists || [] })
      // Refresh categories after scan
      try {
        const catRes = await fetch(`${API}/api/wordlists/categories`)
        const categories = await catRes.json()
        set({ wordlistCategories: categories })
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
    if (!hashes.length) return

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
      const data = await res.json()
      set({ taskId: data.task_id, results: [], taskStatus: { status: 'queued', processed: 0, cracked: 0, total: hashes.length, results: [] } })

      // Open WebSocket
      const ws = new WebSocket(`ws://localhost:8000/ws/${data.task_id}`)
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

  exportResults: async (fmt) => {
    window.open(`${API}/api/results/export/${fmt}`, '_blank')
  },
}))

export default useStore
