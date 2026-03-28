import { useState, useEffect, useCallback } from 'react'
import { FlaskConical, Plus, Trash2, Copy, CheckCircle2, Download, ChevronDown, RotateCcw } from 'lucide-react'
import useStore from '../store/useStore'
import { t } from '../i18n'

const API = 'http://localhost:8000'

const ALGORITHMS = [
  { id: 'md5',      name: 'MD5',       color: 'cyan',    group: 'MD' },
  { id: 'md4',      name: 'MD4',       color: 'cyan',    group: 'MD' },
  { id: 'sha1',     name: 'SHA1',      color: 'emerald', group: 'SHA' },
  { id: 'sha224',   name: 'SHA-224',   color: 'emerald', group: 'SHA' },
  { id: 'sha256',   name: 'SHA-256',   color: 'emerald', group: 'SHA' },
  { id: 'sha384',   name: 'SHA-384',   color: 'emerald', group: 'SHA' },
  { id: 'sha512',   name: 'SHA-512',   color: 'emerald', group: 'SHA' },
  { id: 'sha3-256', name: 'SHA3-256',  color: 'violet',  group: 'SHA3' },
  { id: 'sha3-512', name: 'SHA3-512',  color: 'violet',  group: 'SHA3' },
  { id: 'ntlm',     name: 'NTLM',      color: 'amber',   group: 'Windows' },
  { id: 'md4',      name: 'MD4 (raw)', color: 'amber',   group: 'Windows' },
  { id: 'ripemd160', name: 'RIPEMD-160', color: 'cyan',  group: 'Otros' },
  { id: 'whirlpool', name: 'Whirlpool', color: 'cyan',   group: 'Otros' },
  { id: 'mysql323', name: 'MySQL 3.23', color: 'amber',  group: 'Otros' },
]

// Deduplicate by id (md4 appears twice with different names)
const UNIQUE_ALGORITHMS = ALGORITHMS.filter((a, i, arr) => arr.findIndex(b => b.id === a.id) === i)

const COLOR_MAP = {
  cyan:    { pill: 'bg-cyan-400/10 border-cyan-400/25 text-cyan-300', active: 'bg-cyan-400/20 border-cyan-400/40 text-cyan-200 shadow-cyan-400/10 shadow-lg' },
  emerald: { pill: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-300', active: 'bg-emerald-400/20 border-emerald-400/40 text-emerald-200 shadow-emerald-400/10 shadow-lg' },
  violet:  { pill: 'bg-violet-400/10 border-violet-400/25 text-violet-300', active: 'bg-violet-400/20 border-violet-400/40 text-violet-200 shadow-violet-400/10 shadow-lg' },
  amber:   { pill: 'bg-amber-400/10 border-amber-400/25 text-amber-300', active: 'bg-amber-400/20 border-amber-400/40 text-amber-200 shadow-amber-400/10 shadow-lg' },
}

let rowIdCounter = 1

function createRow() {
  return { id: rowIdCounter++, algorithm: 'md5', plaintext: '', hash: '', copied: false }
}

export default function HashGeneratorPage() {
  const { language } = useStore()
  const [rows, setRows] = useState([createRow()])
  const [selectedAlgo, setSelectedAlgo] = useState(null) // for batch algo selector

  const generateHash = useCallback(async (text, algorithm) => {
    if (!text) return ''
    try {
      const res = await fetch(`${API}/api/generator/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, algorithm }),
      })
      const data = await res.json()
      return data.hash || ''
    } catch {
      return ''
    }
  }, [])

  const updateRow = useCallback(async (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    if (field === 'plaintext' || field === 'algorithm') {
      const row = rows.find(r => r.id === id) || {}
      const text = field === 'plaintext' ? value : row.plaintext
      const algo = field === 'algorithm' ? value : row.algorithm
      if (text) {
        const hash = await generateHash(text, algo)
        setRows(prev => prev.map(r => r.id === id ? { ...r, hash, [field]: value } : r))
      } else {
        setRows(prev => prev.map(r => r.id === id ? { ...r, hash: '', [field]: value } : r))
      }
    }
  }, [rows, generateHash])

  const addRow = () => setRows(prev => [...prev, createRow()])

  const removeRow = (id) => {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)
  }

  const copyHash = (id) => {
    const row = rows.find(r => r.id === id)
    if (row?.hash) {
      navigator.clipboard.writeText(row.hash)
      setRows(prev => prev.map(r => r.id === id ? { ...r, copied: true } : r))
      setTimeout(() => setRows(prev => prev.map(r => r.id === id ? { ...r, copied: false } : r)), 1500)
    }
  }

  const copyAll = () => {
    const text = rows.filter(r => r.hash).map(r => `${r.hash}`).join('\n')
    if (text) navigator.clipboard.writeText(text)
  }

  const exportAll = (format) => {
    const data = rows.filter(r => r.hash)
    if (!data.length) return
    let content, filename, type
    if (format === 'json') {
      content = JSON.stringify(data.map(r => ({ plaintext: r.plaintext, algorithm: r.algorithm, hash: r.hash })), null, 2)
      filename = 'hashes.json'
      type = 'application/json'
    } else if (format === 'csv') {
      content = 'plaintext,algorithm,hash\n' + data.map(r => `"${r.plaintext}","${r.algorithm}","${r.hash}"`).join('\n')
      filename = 'hashes.csv'
      type = 'text/csv'
    } else {
      content = data.map(r => `${r.plaintext}:${r.hash}`).join('\n')
      filename = 'hashes.txt'
      type = 'text/plain'
    }
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyAlgoToAll = async (algo) => {
    setSelectedAlgo(algo)
    const updated = rows.map(r => ({ ...r, algorithm: algo }))
    setRows(updated)
    const results = await Promise.all(
      updated.map(async (r) => {
        if (r.plaintext) {
          const hash = await generateHash(r.plaintext, algo)
          return { ...r, hash }
        }
        return r
      })
    )
    setRows(results)
  }

  const clearAll = () => {
    rowIdCounter = 1
    setRows([createRow()])
    setSelectedAlgo(null)
  }

  const hasResults = rows.some(r => r.hash)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('gen.title', language)}</h1>
          <span className="badge badge-cyan">{t('general.local', language)}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasResults && (
            <>
              <button onClick={copyAll} className="btn-ghost text-xs flex items-center gap-1.5">
                <Copy size={12} /> {t('gen.copyAll', language)}
              </button>
              <ExportDropdown language={language} onExport={exportAll} />
            </>
          )}
          <button onClick={clearAll} className="btn-ghost text-xs flex items-center gap-1.5">
            <RotateCcw size={12} /> {t('gen.clear', language)}
          </button>
        </div>
      </div>

      {/* Quick algorithm selector */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-violet-400/[0.08]">
            <FlaskConical size={16} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">{t('gen.selectAlgo', language)}</h2>
            <p className="text-[11px] text-white/30 mt-0.5">{t('gen.selectAlgoDesc', language)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {UNIQUE_ALGORITHMS.map(({ id, name, color }) => {
            const isActive = selectedAlgo === id
            const cls = isActive ? COLOR_MAP[color].active : COLOR_MAP[color].pill
            return (
              <button
                key={id}
                onClick={() => applyAlgoToAll(id)}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer ${cls}`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hash rows */}
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <HashRow
            key={row.id}
            row={row}
            index={idx}
            language={language}
            onUpdate={updateRow}
            onRemove={removeRow}
            onCopy={copyHash}
            canRemove={rows.length > 1}
          />
        ))}
      </div>

      {/* Add row button */}
      <button
        onClick={addRow}
        className="w-full py-3 rounded-xl border border-dashed border-white/10 text-white/30 text-xs font-medium hover:border-cyan-400/30 hover:text-cyan-400/60 hover:bg-cyan-400/[0.02] transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Plus size={14} /> {t('gen.addRow', language)}
      </button>
    </div>
  )
}

function HashRow({ row, index, language, onUpdate, onRemove, onCopy, canRemove }) {
  const algo = UNIQUE_ALGORITHMS.find(a => a.id === row.algorithm) || UNIQUE_ALGORITHMS[0]
  const color = COLOR_MAP[algo.color]

  return (
    <div className="card !p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white/20 w-5 text-center">#{index + 1}</span>
          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${color.pill}`}>
            {algo.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onCopy(row.id)}
            disabled={!row.hash}
            className="p-1.5 rounded-lg text-white/30 hover:text-cyan-300 hover:bg-white/[0.04] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            title={t('gen.copy', language)}
          >
            {row.copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          {canRemove && (
            <button
              onClick={() => onRemove(row.id)}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/[0.06] transition-colors"
              title={t('gen.remove', language)}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-[200px_1fr] gap-3">
        {/* Algorithm selector */}
        <div className="relative">
          <select
            value={row.algorithm}
            onChange={(e) => onUpdate(row.id, 'algorithm', e.target.value)}
            className="w-full dropdown-select rounded-xl px-3 py-2.5 text-xs font-medium appearance-none cursor-pointer pr-8"
          >
            {UNIQUE_ALGORITHMS.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        {/* Plaintext input */}
        <input
          type="text"
          value={row.plaintext}
          onChange={(e) => onUpdate(row.id, 'plaintext', e.target.value)}
          placeholder={t('gen.placeholder', language)}
          className="input-field !py-2.5 text-xs"
        />
      </div>

      {/* Output hash */}
      {row.hash && (
        <div className="relative group">
          <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs font-mono text-emerald-300/80 break-all select-all">
            {row.hash}
          </div>
        </div>
      )}
    </div>
  )
}

function ExportDropdown({ language, onExport }) {
  const [open, setOpen] = useState(false)
  const ref = useState(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref[0] && !ref[0].contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref])

  return (
    <div ref={(el) => (ref[0] = el)} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
          open ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300' : 'bg-white/[0.04] border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
        }`}
      >
        <Download size={12} />
        {t('results.export', language)}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-[60] dropdown-menu rounded-xl shadow-2xl shadow-black/50 min-w-[130px] animate-slide-in overflow-hidden py-1">
          {['json', 'csv', 'txt'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => { onExport(fmt); setOpen(false) }}
              className="w-full text-left px-3.5 py-2 text-xs text-white/50 hover:text-cyan-300 hover:bg-white/[0.04] uppercase font-medium transition-colors"
            >
              .{fmt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
