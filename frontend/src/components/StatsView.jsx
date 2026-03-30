import { useEffect, useState, useRef } from 'react'
import { TrendUp, Hash, Lightning, Trophy, CircleNotch, CaretDown, CaretUp, Check, Trash } from '@phosphor-icons/react'
import useStore from '../store/useStore'
import { t } from '../i18n'

function FilterDropdown({ value, onChange, options, placeholder, icon: Icon }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = value === 'all' ? placeholder : options.find(o => o.value === value)?.label || value

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200 cursor-pointer ${
          value !== 'all'
            ? 'bg-cyan-400/[0.08] border-cyan-400/25 text-cyan-300'
            : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/15 hover:text-white/70'
        }`}
      >
        {Icon && <Icon size={11} />}
        <span className="truncate max-w-[120px]">{label}</span>
        <CaretDown size={11} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-[60] dropdown-menu rounded-xl shadow-2xl shadow-black/50 min-w-[180px] animate-slide-in overflow-hidden py-1">
          <button
            onClick={() => { onChange('all'); setOpen(false) }}
            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
              value === 'all' ? 'text-cyan-300 bg-cyan-400/[0.06]' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
            }`}
          >
            <span>{placeholder}</span>
            {value === 'all' && <Check size={12} className="text-cyan-400" />}
          </button>
          <div className="border-t border-white/[0.06] my-1" />
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                value === opt.value ? 'text-cyan-300 bg-cyan-400/[0.06]' : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
              }`}
            >
              <span className="font-medium uppercase">{opt.label}</span>
              {value === opt.value && <Check size={12} className="text-cyan-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, gradient }) {
  return (
    <div className="card-glow group hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <div className="text-3xl font-extrabold tracking-tight text-white">{value}</div>
          <div className="text-[11px] text-white/30 font-medium uppercase tracking-wider mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function StatsView() {
  const { stats, fetchStats, clearStats, language } = useStore()
  const [expandedHash, setExpandedHash] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStrategy, setFilterStrategy] = useState('all')

  useEffect(() => { fetchStats() }, [])

  if (!stats) return (
    <div className="flex items-center justify-center py-24 text-white/15 gap-3">
      <CircleNotch size={20} className="animate-spin" />
      <p className="text-sm">{t('stats.loading', language)}</p>
    </div>
  )

  // Unique values for filters
  const hashTypes = [...new Set(stats.recent_cracks.map(r => r.hash_type))].filter(Boolean)
  const strategyTypes = [...new Set(stats.recent_cracks.map(r => r.strategy))].filter(Boolean)

  // Filtered recent cracks
  const filteredCracks = stats.recent_cracks.filter(r => {
    if (filterType !== 'all' && r.hash_type !== filterType) return false
    if (filterStrategy !== 'all' && r.strategy !== filterStrategy) return false
    return true
  })

  const handleClear = async () => {
    await clearStats()
    setConfirmClear(false)
  }

  return (
    <div className="space-y-8">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white tracking-tight">{t('stats.title', language)}</h2>
        {stats.total_cracked > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <div className="flex items-center gap-2 animate-slide-in">
                <span className="text-[11px] text-red-400">{t('stats.confirmClear', language)}</span>
                <button onClick={handleClear} className="btn-danger text-[11px] px-3 py-1 rounded-lg">
                  {t('stats.yes', language)}
                </button>
                <button onClick={() => setConfirmClear(false)} className="btn-ghost text-[11px] px-3 py-1 rounded-lg">
                  {t('stats.no', language)}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="btn-ghost text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                <Trash size={12} /> {t('stats.clear', language)}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('stats.totalCracked', language)} value={stats.total_cracked.toLocaleString()} icon={Hash}
          gradient="bg-gradient-to-br from-cyan-500 to-cyan-700" />
        <StatCard label={t('stats.tasksCompleted', language)} value={stats.tasks_completed} icon={Lightning}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" />
        <StatCard label={t('stats.tasksTotal', language)} value={stats.tasks_total} icon={TrendUp}
          gradient="bg-gradient-to-br from-amber-500 to-amber-700" />
        <StatCard label={t('stats.topWordlists', language)} value={stats.top_wordlists.length} icon={Trophy}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Hash types */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-tight">{t('stats.hashTypeDist', language)}</h3>
          {stats.hash_type_distribution.length === 0 ? (
            <p className="text-xs text-white/15 py-6 text-center">{t('stats.noData', language)}</p>
          ) : (
            <div className="space-y-3">
              {stats.hash_type_distribution.map(({ hash_type, cnt }) => {
                const max = stats.hash_type_distribution[0].cnt
                const pct = Math.round((cnt / max) * 100)
                return (
                  <div key={hash_type} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60 font-medium">{hash_type}</span>
                      <span className="text-white/30 font-mono">{cnt.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-700"
                           style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Strategy dist */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-tight">{t('stats.strategyDist', language)}</h3>
          {stats.strategy_distribution.length === 0 ? (
            <p className="text-xs text-white/15 py-6 text-center">{t('stats.noData', language)}</p>
          ) : (
            <div className="space-y-3">
              {stats.strategy_distribution.map(({ strategy, cnt }) => {
                const max = stats.strategy_distribution[0].cnt
                const colors = {
                  rainbow: 'from-cyan-500 to-cyan-300',
                  dictionary: 'from-emerald-500 to-emerald-300',
                  rules: 'from-violet-500 to-violet-300',
                  mask: 'from-amber-500 to-amber-300',
                  bruteforce: 'from-red-500 to-red-300'
                }
                return (
                  <div key={strategy} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60 font-medium capitalize">{strategy}</span>
                      <span className="text-white/30 font-mono">{cnt}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${colors[strategy] || 'from-cyan-500 to-cyan-300'} transition-all duration-700`}
                           style={{ width: `${Math.round((cnt / max) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top wordlists */}
      {stats.top_wordlists.length > 0 && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-tight">{t('stats.bestWordlists', language)}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[t('stats.name', language), t('stats.wordsCol', language), t('stats.cracksCol', language), t('stats.successRate', language)].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-white/25 uppercase text-[10px] font-semibold tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.top_wordlists.map((w, i) => (
                  <tr key={i} className="hash-row border-b border-white/[0.03]">
                    <td className="py-2.5 px-3 font-medium text-white/70 truncate max-w-[200px]">{w.name}</td>
                    <td className="py-2.5 px-3 text-white/40 font-mono">{w.total_words?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{w.total_cracks}</td>
                    <td className="py-2.5 px-3">
                      <span className="badge badge-green">{(w.success_rate || 0).toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent cracks with filters and expandable hashes */}
      {stats.recent_cracks.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-white tracking-tight">{t('stats.recentCracks', language)}</h3>
            <div className="flex items-center gap-2">
              <FilterDropdown
                value={filterType}
                onChange={setFilterType}
                options={hashTypes.map(ht => ({ value: ht, label: ht }))}
                placeholder={t('stats.filterHashType', language)}
                icon={Hash}
              />
              <FilterDropdown
                value={filterStrategy}
                onChange={setFilterStrategy}
                options={strategyTypes.map(s => ({ value: s, label: s }))}
                placeholder={t('stats.filterStrategy', language)}
                icon={Lightning}
              />
            </div>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredCracks.length === 0 ? (
              <p className="text-xs text-white/15 py-6 text-center">{t('stats.noData', language)}</p>
            ) : (
              filteredCracks.map((r, i) => (
                <div key={i} className="hash-row py-2 px-3 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedHash(expandedHash === i ? null : i)}
                      className="text-white/20 hover:text-white/50 transition-colors shrink-0"
                      title={expandedHash === i ? t('stats.hideFull', language) : t('stats.showFull', language)}
                    >
                      {expandedHash === i ? <CaretUp size={12} /> : <CaretDown size={12} />}
                    </button>
                    <span className="text-white/20 font-mono truncate max-w-[140px]">
                      {r.hash.slice(0, 18)}…
                    </span>
                    <span className="text-emerald-300 font-bold">{r.plaintext}</span>
                    <span className="badge badge-cyan ml-auto">{r.hash_type}</span>
                    <span className="text-white/15 text-[10px]">{new Date(r.found_at).toLocaleTimeString()}</span>
                  </div>
                  {expandedHash === i && (
                    <div className="mt-2 ml-7 p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg animate-fade-in">
                      <p className="font-mono text-[11px] text-white/40 break-all select-all">{r.hash}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
