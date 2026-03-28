import { useEffect, useRef, useState } from 'react'
import { Upload, RefreshCw, Trash2, Eye, FolderSearch, BookOpen, CheckCircle2, Filter, ExternalLink, Download, Search, X, FolderOpen } from 'lucide-react'
import useStore from '../store/useStore'
import { t } from '../i18n'

const API = ''

const CATEGORY_COLORS = {
  SecLists: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
  Metasploit: 'bg-red-400/10 text-red-300 border-red-400/20',
  Dirb: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  Dirbuster: 'bg-orange-400/10 text-orange-300 border-orange-400/20',
  Wfuzz: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
  John: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  Nmap: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  SQLMap: 'bg-pink-400/10 text-pink-300 border-pink-400/20',
  Rockyou: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  System: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
  Custom: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
  Other: 'bg-white/5 text-white/40 border-white/10',
}

function fmt(bytes) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`
  return `${bytes} B`
}

function fmtWords(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n
}

export default function WordlistManager() {
  const { wordlists, loadingWordlists, fetchWordlists, scanWordlists, deleteWordlist, selectedWordlistId, setSelectedWordlistId, language, wordlistCategories, selectedCategory, setSelectedCategory, wordlistSubcategories, selectedSubcategory, setSelectedSubcategory, fetchSubcategories } = useStore()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [scanMsg, setScanMsg] = useState(null)
  const [preview, setPreview] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchWordlists() }, [])

  useEffect(() => {
    fetchSubcategories(selectedCategory)
  }, [selectedCategory])

  const filteredWordlists = wordlists.filter((wl) => {
    if (selectedCategory && wl.category !== selectedCategory) return false
    if (selectedSubcategory && wl.subcategory !== selectedSubcategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return wl.name.toLowerCase().includes(q) || (wl.path && wl.path.toLowerCase().includes(q)) || (wl.category && wl.category.toLowerCase().includes(q))
    }
    return true
  })

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(`${API}/api/wordlists/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      await fetchWordlists()
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  const handleScan = async () => {
    setScanMsg(null)
    const data = await scanWordlists()
    if (data) setScanMsg(t('wl.found', language, { n: data.found }))
  }

  const loadPreview = async (wl) => {
    if (preview?.id === wl.id) { setPreview(null); return }
    const res = await fetch(`${API}/api/wordlists/${wl.id}/preview?limit=20`)
    const data = await res.json()
    setPreview({ id: wl.id, words: data.words, total: data.total })
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" className="hidden" accept=".txt,.gz,.zip,.lst,.dict"
          onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} className="btn-primary text-sm flex items-center gap-2.5" disabled={uploading}>
          <Upload size={14} />
          {uploading ? t('wl.uploading', language) : t('wl.upload', language)}
        </button>
        <button onClick={handleScan} className="btn-ghost text-sm flex items-center gap-2" disabled={loadingWordlists}>
          <FolderSearch size={14} />
          {loadingWordlists ? t('wl.scanning', language) : t('wl.scan', language)}
        </button>
        <button onClick={fetchWordlists} className="btn-ghost text-sm flex items-center gap-2">
          <RefreshCw size={14} /> {t('wl.refresh', language)}
        </button>
        {scanMsg && <span className="text-xs text-emerald-400 animate-fade-in">{scanMsg}</span>}
      </div>

      {/* Category Filters + Search */}
      <div className="flex flex-wrap items-center gap-2">
        {wordlistCategories.length > 1 && (
          <>
            <Filter size={14} className="text-white/25 shrink-0" />
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                !selectedCategory
                  ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                  : 'bg-white/[0.02] text-white/30 border-white/[0.06] hover:border-white/[0.12] hover:text-white/50'
              }`}
            >
              {t('wl.filterAll', language)} ({wordlists.length})
            </button>
            {wordlistCategories.map((cat) => {
              const count = wordlists.filter((w) => w.category === cat).length
              const colorCls = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    selectedCategory === cat
                      ? colorCls
                      : 'bg-white/[0.02] text-white/30 border-white/[0.06] hover:border-white/[0.12] hover:text-white/50'
                  }`}
                >
                  {cat} ({count})
                </button>
              )
            })}
            <div className="mx-1 w-px h-5 bg-white/[0.06]" />
          </>
        )}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('wl.searchPlaceholder', language)}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] bg-white/[0.02] text-white/70 placeholder:text-white/20 focus:border-cyan-400/30 focus:bg-cyan-400/[0.02] focus:outline-none transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Subcategory Filters (folder-level) */}
      {selectedCategory && wordlistSubcategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-in">
          <FolderOpen size={13} className="text-white/20 shrink-0" />
          <button
            onClick={() => setSelectedSubcategory(null)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
              !selectedSubcategory
                ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                : 'bg-white/[0.02] text-white/25 border-white/[0.06] hover:border-white/[0.12] hover:text-white/40'
            }`}
          >
            {t('wl.filterAll', language)} ({wordlists.filter((w) => w.category === selectedCategory).length})
          </button>
          {wordlistSubcategories.map((sub) => {
            const count = wordlists.filter((w) => w.category === selectedCategory && w.subcategory === sub).length
            const colorCls = CATEGORY_COLORS[selectedCategory] || CATEGORY_COLORS.Other
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                  selectedSubcategory === sub
                    ? colorCls
                    : 'bg-white/[0.02] text-white/25 border-white/[0.06] hover:border-white/[0.12] hover:text-white/40'
                }`}
              >
                {sub} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Upload Drop Zone */}
      <div
        className="border border-dashed border-white/[0.08] rounded-2xl p-8 text-center hover:border-cyan-400/30 hover:bg-cyan-400/[0.01] transition-all duration-300 cursor-pointer group"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files[0]) }}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4 group-hover:border-cyan-400/20 transition-colors">
          <Upload size={22} className="text-white/15 group-hover:text-cyan-400/40 transition-colors" />
        </div>
        <p className="text-sm text-white/30 font-medium">{t('wl.dragHere', language)}</p>
        <p className="text-[11px] text-white/15 mt-1.5">{t('wl.supportedFormats', language)}</p>
      </div>

      {/* CrackStation recommendation */}
      <a
        href="https://crackstation.net/crackstation-wordlist-password-cracking-dictionary.htm"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-2xl border border-amber-400/15 bg-amber-400/[0.03] hover:border-amber-400/30 hover:bg-amber-400/[0.06] transition-all duration-300 group"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/15 flex items-center justify-center shrink-0 group-hover:border-amber-400/30 transition-colors">
          <Download size={18} className="text-amber-400/60 group-hover:text-amber-400 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-300/90 group-hover:text-amber-300 transition-colors">
            CrackStation Wordlist — 64M+ {t('wl.words', language)}
          </p>
          <p className="text-[11px] text-white/25 mt-0.5">{t('wl.crackstationDesc', language)}</p>
        </div>
        <ExternalLink size={14} className="text-white/15 group-hover:text-amber-400/60 transition-colors shrink-0" />
      </a>

      {/* List */}
      {filteredWordlists.length === 0 ? (
        <div className="card text-center py-14">
          <BookOpen size={32} className="mx-auto mb-3 text-white/10" />
          <p className="text-sm text-white/20 font-medium">
            {searchQuery ? t('wl.noSearchResults', language) : selectedCategory ? t('wl.noWordlistsInCategory', language) : t('wl.noWordlists', language)}
          </p>
          <p className="text-xs mt-1.5 text-white/10">
            {searchQuery ? `"${searchQuery}"` : selectedCategory ? t('wl.tryOtherCategory', language) : t('wl.noWordlistsHint', language)}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredWordlists.map((wl) => (
            <div key={wl.id} className={`card p-3.5 transition-all duration-200 ${
              selectedWordlistId === wl.id
                ? 'border-cyan-400/20 bg-cyan-400/[0.02] shadow-[0_0_30px_rgba(0,243,255,0.04)]'
                : 'hover:border-white/[0.1]'
            }`}>
              <div className="flex items-start gap-2.5">
                <button
                  onClick={() => setSelectedWordlistId(selectedWordlistId === wl.id ? null : wl.id)}
                  className={`mt-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                    selectedWordlistId === wl.id
                      ? 'border-cyan-400 bg-cyan-400'
                      : 'border-white/15 hover:border-white/30'
                  }`}
                >
                  {selectedWordlistId === wl.id && (
                    <CheckCircle2 size={10} className="text-surface-900" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[13px] text-white truncate">{wl.name}</span>
                    {wl.category && wl.category !== 'Other' && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${CATEGORY_COLORS[wl.category] || CATEGORY_COLORS.Other}`}>
                        {wl.category}
                      </span>
                    )}
                    {selectedWordlistId === wl.id && (
                      <span className="badge badge-green">{t('general.active', language)}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/20 truncate mt-0.5">{wl.path}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/30">
                    <span className="font-mono">{fmtWords(wl.total_words)} {t('wl.words', language)}</span>
                    <span>{fmt(wl.file_size)}</span>
                    {wl.success_rate > 0 && (
                      <span className="text-emerald-400 font-medium">{wl.success_rate.toFixed(1)}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => loadPreview(wl)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-cyan-300 hover:bg-cyan-400/[0.06] transition-all duration-200"
                    title={t('wl.preview', language)}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => deleteWordlist(wl.id)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/[0.06] transition-all duration-200"
                    title={t('wl.delete', language)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Preview */}
              {preview?.id === wl.id && (
                <div className="mt-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 animate-fade-in">
                  <p className="text-[10px] text-white/25 mb-2">
                    {t('wl.previewFirst', language)} {preview.words.length} {t('wl.previewOf', language)} {preview.total.toLocaleString()} {t('wl.previewWords', language)}
                  </p>
                  <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto">
                    {preview.words.map((w, i) => (
                      <span key={i} className="text-[11px] text-white/50 font-mono truncate px-1.5 py-0.5 rounded bg-white/[0.02]">{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
