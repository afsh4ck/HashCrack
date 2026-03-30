import { useState, useEffect, useRef } from 'react'
import { Flask, Copy, CheckCircle, DownloadSimple, CaretDown, ArrowCounterClockwise } from '@phosphor-icons/react'
import useStore from '../store/useStore'
import { t } from '../i18n'
import { computeHash, isClientSupported } from '../hashUtils'

const UNIQUE_ALGORITHMS = [
  { id: 'md5',       name: 'MD5',        color: 'cyan' },
  { id: 'md4',       name: 'MD4',        color: 'cyan' },
  { id: 'sha1',      name: 'SHA1',       color: 'emerald' },
  { id: 'sha224',    name: 'SHA-224',    color: 'emerald' },
  { id: 'sha256',    name: 'SHA-256',    color: 'emerald' },
  { id: 'sha384',    name: 'SHA-384',    color: 'emerald' },
  { id: 'sha512',    name: 'SHA-512',    color: 'emerald' },
  { id: 'sha3-256',  name: 'SHA3-256',   color: 'violet' },
  { id: 'sha3-512',  name: 'SHA3-512',   color: 'violet' },
  { id: 'ntlm',      name: 'NTLM',       color: 'amber' },
  { id: 'ripemd160',  name: 'RIPEMD-160', color: 'cyan' },
  { id: 'whirlpool',  name: 'Whirlpool',  color: 'cyan' },
  { id: 'mysql323',   name: 'MySQL 3.23', color: 'amber' },
]

const COLOR_MAP = {
  cyan:    { pill: 'bg-cyan-400/10 border-cyan-400/25 text-cyan-300', active: 'bg-cyan-400/20 border-cyan-400/40 text-cyan-200 shadow-cyan-400/10 shadow-lg' },
  emerald: { pill: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-300', active: 'bg-emerald-400/20 border-emerald-400/40 text-emerald-200 shadow-emerald-400/10 shadow-lg' },
  violet:  { pill: 'bg-violet-400/10 border-violet-400/25 text-violet-300', active: 'bg-violet-400/20 border-violet-400/40 text-violet-200 shadow-violet-400/10 shadow-lg' },
  amber:   { pill: 'bg-amber-400/10 border-amber-400/25 text-amber-300', active: 'bg-amber-400/20 border-amber-400/40 text-amber-200 shadow-amber-400/10 shadow-lg' },
}

export default function HashGeneratorPage() {
  const { language } = useStore()
  const [algorithm, setAlgorithm] = useState('md5')
  const [plaintext, setPlaintext] = useState('')
  const [hashes, setHashes] = useState('')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const lines = plaintext.split('\n')
    if (!lines.some(l => l.length > 0)) {
      setHashes('')
      return
    }

    let cancelled = false

    const generate = async () => {
      if (isClientSupported(algorithm)) {
        const results = await Promise.all(
          lines.map(line => line.length > 0 ? computeHash(line, algorithm) : Promise.resolve(''))
        )
        if (!cancelled) setHashes(results.join('\n'))
      } else {
        // Fallback to backend for RIPEMD-160, Whirlpool
        const body = JSON.stringify({ texts: lines, algorithm })
        const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
        try {
          let res
          try { res = await fetch('/api/generator/batch', opts) }
          catch { res = await fetch('http://localhost:8000/api/generator/batch', opts) }
          if (!cancelled && res.ok) {
            const data = await res.json()
            setHashes((data.hashes || []).join('\n'))
          } else if (!cancelled) {
            setHashes(lines.map(() => '(backend required)').join('\n'))
          }
        } catch {
          if (!cancelled) setHashes(lines.map(() => '(backend required)').join('\n'))
        }
      }
    }

    timerRef.current = setTimeout(generate, 80)
    return () => { cancelled = true; clearTimeout(timerRef.current) }
  }, [plaintext, algorithm])

  const handleAlgoChange = (algo) => {
    setAlgorithm(algo)
  }

  const copyOutput = () => {
    if (hashes) {
      navigator.clipboard.writeText(hashes)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const clearAll = () => {
    setPlaintext('')
    setHashes('')
  }

  const exportOutput = (format) => {
    const lines = plaintext.split('\n')
    const hashLines = hashes.split('\n')
    const pairs = lines.map((l, i) => ({ plaintext: l, hash: hashLines[i] || '' })).filter(p => p.plaintext || p.hash)
    if (!pairs.length) return
    let content, filename, type
    if (format === 'json') {
      content = JSON.stringify(pairs.map(p => ({ ...p, algorithm })), null, 2)
      filename = 'hashes.json'
      type = 'application/json'
    } else if (format === 'csv') {
      content = 'plaintext,algorithm,hash\n' + pairs.map(p => `"${p.plaintext}","${algorithm}","${p.hash}"`).join('\n')
      filename = 'hashes.csv'
      type = 'text/csv'
    } else {
      content = pairs.map(p => `${p.plaintext}:${p.hash}`).join('\n')
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

  const lineCount = plaintext ? plaintext.split('\n').length : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('gen.title', language)}</h1>
          <span className="badge badge-cyan">{t('general.local', language)}</span>
        </div>
        <div className="flex items-center gap-2">
          {hashes && (
            <>
              <button onClick={copyOutput} className="btn-ghost text-xs flex items-center gap-1.5">
                {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? t('results.copied', language) : t('gen.copyAll', language)}
              </button>
              <ExportDropdown language={language} onExport={exportOutput} />
            </>
          )}
          <button onClick={clearAll} className="btn-ghost text-xs flex items-center gap-1.5">
            <ArrowCounterClockwise size={12} /> {t('gen.clear', language)}
          </button>
        </div>
      </div>

      {/* Algorithm selector */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-violet-400/[0.08]">
            <Flask size={16} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">{t('gen.selectAlgo', language)}</h2>
            <p className="text-[11px] text-white/30 mt-0.5">{t('gen.selectAlgoDesc', language)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {UNIQUE_ALGORITHMS.map(({ id, name, color }) => {
            const isActive = algorithm === id
            const cls = isActive ? COLOR_MAP[color].active : COLOR_MAP[color].pill
            return (
              <button
                key={id}
                onClick={() => handleAlgoChange(id)}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer ${cls}`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Textareas */}
      <div className="card !p-0 overflow-hidden">
        {/* Input textarea */}
        <div className="border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02]">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{t('gen.input', language)}</span>
            {lineCount > 0 && (
              <span className="text-[10px] text-white/20">{lineCount} {lineCount === 1 ? 'línea' : 'líneas'}</span>
            )}
          </div>
          <textarea
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder={t('gen.inputPlaceholder', language)}
            className="w-full bg-transparent text-sm text-white/80 placeholder-white/20 px-4 py-3 resize-y min-h-[140px] focus:outline-none font-mono"
            spellCheck={false}
          />
        </div>

        {/* Output textarea */}
        <div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{t('gen.output', language)}</span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${COLOR_MAP[UNIQUE_ALGORITHMS.find(a => a.id === algorithm)?.color || 'cyan'].pill}`}>
                {UNIQUE_ALGORITHMS.find(a => a.id === algorithm)?.name || algorithm.toUpperCase()}
              </span>
            </div>
            <button
              onClick={copyOutput}
              disabled={!hashes}
              className="p-1 rounded-md text-white/20 hover:text-cyan-300 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              title={t('gen.copy', language)}
            >
              {copied ? <CheckCircle size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
          <textarea
            value={hashes}
            readOnly
            placeholder={t('gen.outputPlaceholder', language)}
            className="w-full bg-transparent text-sm text-emerald-300/80 placeholder-white/10 px-4 py-3 resize-y min-h-[140px] focus:outline-none font-mono select-all"
          />
        </div>
      </div>
    </div>
  )
}

function ExportDropdown({ language, onExport }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
          open ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300' : 'bg-white/[0.04] border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
        }`}
      >
        <DownloadSimple size={12} />
        {t('results.export', language)}
        <CaretDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
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
