import { ChevronDown, Settings2, Zap, BookOpen, Wand2, Check, Cpu } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { t } from '../i18n'

const colorMap = {
  cyan: { bg: 'bg-cyan-400/[0.06]', border: 'border-cyan-400/20', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  emerald: { bg: 'bg-emerald-400/[0.06]', border: 'border-emerald-400/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  violet: { bg: 'bg-violet-400/[0.06]', border: 'border-violet-400/20', text: 'text-violet-300', dot: 'bg-violet-400' },
  amber: { bg: 'bg-amber-400/[0.06]', border: 'border-amber-400/20', text: 'text-amber-300', dot: 'bg-amber-400' },
}

export default function CrackingOptions() {
  const {
    strategies, toggleStrategy,
    wordlists, selectedWordlistId, setSelectedWordlistId,
    loadingWordlists, language,
  } = useStore()

  const [showWlDropdown, setShowWlDropdown] = useState(false)
  const wlRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (wlRef.current && !wlRef.current.contains(e.target)) setShowWlDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedWl = wordlists.find((w) => w.id === selectedWordlistId)

  const STRATEGY_OPTIONS = [
    { id: 'rainbow',    label: t('strategy.rainbow', language),    desc: t('strategy.rainbow.desc', language),    icon: Zap,      color: 'cyan'   },
    { id: 'dictionary', label: t('strategy.dictionary', language),  desc: t('strategy.dictionary.desc', language), icon: BookOpen, color: 'emerald' },
    { id: 'rules',      label: t('strategy.rules', language),       desc: t('strategy.rules.desc', language),      icon: Wand2,    color: 'violet' },
    { id: 'bruteforce', label: t('strategy.bruteforce', language),   desc: t('strategy.bruteforce.desc', language), icon: Cpu,      color: 'amber'  },
  ]

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-400/[0.08]">
          <Settings2 size={16} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            {t('options.title', language)}
          </h2>
          <p className="text-[11px] text-white/30 mt-0.5">{t('options.subtitle', language)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {STRATEGY_OPTIONS.map(({ id, label, desc, icon: Icon, color }) => {
          const active = strategies.includes(id)
          const c = colorMap[color]
          return (
            <button
              key={id}
              onClick={() => toggleStrategy(id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                active
                  ? `${c.bg} ${c.border} border`
                  : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${active ? c.bg : 'bg-white/[0.03]'}`}>
                <Icon size={14} className={active ? c.text : 'text-white/30'} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${active ? 'text-white' : 'text-white/40'}`}>
                  {label}
                </span>
                <p className="text-[11px] text-white/20 mt-0.5">{desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                active
                  ? `${c.border} ${c.bg}`
                  : 'border-white/10'
              }`}>
                {active && <Check size={11} className={c.text} />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Wordlist Selector */}
      {strategies.includes('dictionary') || strategies.includes('rules') ? (
        <div className="pt-3 border-t border-white/[0.04]">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2.5 block">
            {t('options.wordlist', language)}
          </label>
          <div ref={wlRef} className="relative">
            <button
              onClick={() => setShowWlDropdown(!showWlDropdown)}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
                selectedWl
                  ? 'bg-emerald-400/[0.08] border-emerald-400/25 text-emerald-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/15 hover:text-white/70'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen size={12} />
                <span className="truncate">
                  {selectedWl ? selectedWl.name : t('options.selectWordlist', language)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedWl && (
                  <span className="text-[10px] text-white/25 font-mono">
                    {selectedWl.total_words > 1e6
                      ? `${(selectedWl.total_words / 1e6).toFixed(1)}M`
                      : `${selectedWl.total_words?.toLocaleString()}`}
                  </span>
                )}
                <ChevronDown size={12} className={`transition-transform duration-200 ${showWlDropdown ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showWlDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-[60] dropdown-menu rounded-xl shadow-2xl shadow-black/50 max-h-64 overflow-y-auto animate-slide-in py-1">
                <button
                  onClick={() => { setSelectedWordlistId(null); setShowWlDropdown(false) }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    !selectedWordlistId ? 'text-cyan-300 bg-cyan-400/[0.06]' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                  }`}
                >
                  <span>{t('options.noWordlist', language)}</span>
                  {!selectedWordlistId && <Check size={12} className="text-cyan-400" />}
                </button>
                <div className="border-t border-white/[0.06] my-1" />
                {loadingWordlists ? (
                  <p className="px-3.5 py-4 text-xs text-white/20 text-center">{t('options.loading', language)}</p>
                ) : wordlists.length === 0 ? (
                  <p className="px-3.5 py-4 text-xs text-white/20 text-center">
                    {t('options.noWordlists', language)}
                  </p>
                ) : (
                  wordlists.map((wl) => (
                    <button
                      key={wl.id}
                      onClick={() => { setSelectedWordlistId(wl.id); setShowWlDropdown(false) }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                        selectedWordlistId === wl.id ? 'text-cyan-300 bg-cyan-400/[0.06]' : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                      }`}
                    >
                      <span className="font-medium truncate max-w-[180px]">{wl.name}</span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {wl.success_rate > 0 && (
                          <span className="badge badge-green text-[10px]">{wl.success_rate.toFixed(1)}%</span>
                        )}
                        <span className="text-[10px] text-white/25 font-mono">
                          {wl.total_words > 1e6
                            ? `${(wl.total_words / 1e6).toFixed(1)}M`
                            : `${wl.total_words?.toLocaleString()}`}
                        </span>
                        {selectedWordlistId === wl.id && <Check size={12} className="text-cyan-400" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
