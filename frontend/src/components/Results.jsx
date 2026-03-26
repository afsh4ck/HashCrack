import { useState } from 'react'
import { Copy, Download, CheckCircle2, Table2 } from 'lucide-react'
import useStore from '../store/useStore'
import { t } from '../i18n'

const STRATEGY_BADGE = {
  rainbow: 'badge-cyan', dictionary: 'badge-green',
  rules: 'badge-purple', mask: 'badge-yellow',
}

export default function Results() {
  const { results, exportResults, taskStatus, language } = useStore()
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    const text = results.map((r) => `${r.hash}:${r.plaintext}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!results.length && !taskStatus) return null

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-400/[0.08]">
            <Table2 size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-white tracking-tight">{t('results.title', language)}</h2>
            {results.length > 0 && (
              <span className="badge badge-green">{results.length} {t('results.cracked', language)}</span>
            )}
          </div>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={copyAll} className="btn-ghost text-xs flex items-center gap-2">
              {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? t('results.copied', language) : t('results.copy', language)}
            </button>
            <div className="relative group">
              <button className="btn-ghost text-xs flex items-center gap-2">
                <Download size={12} /> {t('results.export', language)}
              </button>
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-surface-700 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 hidden group-hover:block min-w-[130px] animate-slide-in overflow-hidden">
                {['json', 'csv', 'txt', 'potfile'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => exportResults(fmt)}
                    className="w-full text-left px-4 py-2.5 text-xs text-white/50 hover:text-cyan-300 hover:bg-white/[0.04] uppercase font-medium transition-colors"
                  >
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xs text-white/15">
            {taskStatus?.status === 'running' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {t('results.searching', language)}
              </span>
            ) : t('results.noResults', language)}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[t('results.hash', language), t('results.type', language), t('results.password', language), t('results.strategy', language), t('results.time', language)].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-white/25 font-semibold uppercase tracking-widest text-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="hash-row border-b border-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 font-mono text-white/30 max-w-[160px]">
                    <span title={r.hash} className="block truncate">{r.hash.slice(0, 20)}…</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="badge badge-cyan">{r.hash_type}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-300 font-bold">{r.plaintext}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`badge ${STRATEGY_BADGE[r.strategy] || 'badge-cyan'}`}>{r.strategy}</span>
                  </td>
                  <td className="py-2.5 px-3 text-white/20 font-mono">
                    {r.time_ms != null ? `${r.time_ms.toFixed(2)}ms` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
