import { CaretDown, GearSix, Lightning, BookOpen, MagicWand, Check, Cpu, MagnifyingGlass, X } from '@phosphor-icons/react'
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
    strategies, toggleStrategy, setStrategies,
    wordlists, selectedWordlistId, setSelectedWordlistId,
    loadingWordlists, language,
  } = useStore()

  const [showWlDropdown, setShowWlDropdown] = useState(false)
  const [wlSearch, setWlSearch] = useState('')
  const wlRef = useRef(null)
  const wlSearchRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (wlRef.current && !wlRef.current.contains(e.target)) { setShowWlDropdown(false); setWlSearch('') } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (showWlDropdown && wlSearchRef.current) {
      wlSearchRef.current.focus()
    }
  }, [showWlDropdown])

  const selectedWl = wordlists.find((w) => w.id === selectedWordlistId)

  const STRATEGY_OPTIONS = [
    { id: 'rainbow',    label: t('strategy.rainbow', language),    desc: t('strategy.rainbow.desc', language),    icon: Lightning,      color: 'cyan'   },
    { id: 'dictionary', label: t('strategy.dictionary', language),  desc: t('strategy.dictionary.desc', language), icon: BookOpen, color: 'emerald' },
    { id: 'rules',      label: t('strategy.rules', language),       desc: t('strategy.rules.desc', language),      icon: MagicWand,    color: 'violet' },
    { id: 'bruteforce', label: t('strategy.bruteforce', language),   desc: t('strategy.bruteforce.desc', language), icon: Cpu,      color: 'amber'  },
  ]

  return (
    <div className={`card space-y-5 ${showWlDropdown ? 'z-[70] relative' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-400/[0.08]">
          <GearSix size={16} className="text-violet-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-white tracking-tight">
            {t('options.title', language)}
          </h2>
          <p className="text-[11px] text-white/30 mt-0.5">{t('options.subtitle', language)}</p>
        </div>
        <button
          onClick={() => {
            const allIds = STRATEGY_OPTIONS.map(s => s.id)
            const allActive = allIds.every(id => strategies.includes(id))
            setStrategies(allActive ? [] : allIds)
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 cursor-pointer
            border-violet-400/20 bg-violet-400/[0.06] hover:bg-violet-400/[0.12]"
          title={STRATEGY_OPTIONS.every(s => strategies.includes(s.id)) ? (language === 'es' ? 'Desmarcar todo' : 'Uncheck all') : (language === 'es' ? 'Marcar todo' : 'Check all')}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            STRATEGY_OPTIONS.every(s => strategies.includes(s.id))
              ? 'border-violet-400/40 bg-violet-400/20'
              : STRATEGY_OPTIONS.some(s => strategies.includes(s.id))
                ? 'border-violet-400/30 bg-violet-400/10'
                : 'border-white/15'
          }`}>
            {STRATEGY_OPTIONS.every(s => strategies.includes(s.id)) && <Check size={10} className="text-violet-300" />}
            {!STRATEGY_OPTIONS.every(s => strategies.includes(s.id)) && STRATEGY_OPTIONS.some(s => strategies.includes(s.id)) && (
              <div className="w-2 h-0.5 bg-violet-400/60 rounded-full" />
            )}
          </div>
          <span className="text-[11px] font-medium text-violet-300/80">
            {STRATEGY_OPTIONS.every(s => strategies.includes(s.id))
              ? (language === 'es' ? 'Todo' : 'All')
              : (language === 'es' ? 'Todo' : 'All')}
          </span>
        </button>
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
                <CaretDown size={12} className={`transition-transform duration-200 ${showWlDropdown ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showWlDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-[60] dropdown-menu rounded-xl shadow-2xl shadow-black/50 max-h-72 animate-slide-in py-1 flex flex-col">
                {/* Search input */}
                {wordlists.length > 0 && (
                  <div className="px-2.5 pt-1.5 pb-1 sticky top-0 bg-inherit z-10">
                    <div className="relative">
                      <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                      <input
                        ref={wlSearchRef}
                        type="text"
                        value={wlSearch}
                        onChange={(e) => setWlSearch(e.target.value)}
                        placeholder={language === 'es' ? 'Buscar wordlist...' : 'Search wordlist...'}
                        className="w-full pl-7 pr-7 py-1.5 rounded-lg text-[11px] font-medium border border-white/[0.08] bg-white/[0.03] text-white/70 placeholder:text-white/20 focus:border-cyan-400/30 focus:bg-cyan-400/[0.03] focus:outline-none transition-all duration-200"
                      />
                      {wlSearch && (
                        <button
                          onClick={() => setWlSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="overflow-y-auto flex-1">
                  {!wlSearch && (
                    <>
                      <button
                        onClick={() => { setSelectedWordlistId(null); setShowWlDropdown(false); setWlSearch('') }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                          !selectedWordlistId ? 'text-cyan-300 bg-cyan-400/[0.06]' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                        }`}
                      >
                        <span>{t('options.noWordlist', language)}</span>
                        {!selectedWordlistId && <Check size={12} className="text-cyan-400" />}
                      </button>
                      <div className="border-t border-white/[0.06] my-1" />
                    </>
                  )}
                  {loadingWordlists ? (
                    <p className="px-3.5 py-4 text-xs text-white/20 text-center">{t('options.loading', language)}</p>
                  ) : wordlists.length === 0 ? (
                    <p className="px-3.5 py-4 text-xs text-white/20 text-center">
                      {t('options.noWordlists', language)}
                    </p>
                  ) : (() => {
                    const q = wlSearch.toLowerCase()
                    const filtered = q
                      ? wordlists.filter((wl) => wl.name.toLowerCase().includes(q) || (wl.path && wl.path.toLowerCase().includes(q)) || (wl.category && wl.category.toLowerCase().includes(q)))
                      : wordlists
                    return filtered.length === 0 ? (
                      <p className="px-3.5 py-4 text-xs text-white/20 text-center">
                        {language === 'es' ? 'Sin resultados' : 'No results'}
                      </p>
                    ) : (
                      filtered.map((wl) => (
                        <button
                          key={wl.id}
                          onClick={() => { setSelectedWordlistId(wl.id); setShowWlDropdown(false); setWlSearch('') }}
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
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
