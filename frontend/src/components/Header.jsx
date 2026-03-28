import { Lock, Moon, Sun, BarChart2, List, Hash, Wifi, Globe, FlaskConical } from 'lucide-react'
import useStore from '../store/useStore'
import { t } from '../i18n'

export default function Header() {
  const { activeTab, setActiveTab, theme, toggleTheme, language, setLanguage } = useStore()

  const tabs = [
    { id: 'cracker', label: t('tab.cracker', language), icon: Hash },
    { id: 'wordlists', label: t('tab.wordlists', language), icon: List },
    { id: 'generator', label: t('tab.generator', language), icon: FlaskConical },
    { id: 'stats', label: t('tab.stats', language), icon: BarChart2 },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-2xl">
      <div className="header-glow" />
      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-2 cursor-pointer" onClick={() => setActiveTab('cracker')}>
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-lg blur-md" />
            <div className="relative bg-gradient-to-br from-cyan-400 to-cyan-600 p-1.5 rounded-lg">
              <Lock size={18} className="text-surface-900" />
            </div>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-extrabold tracking-tight text-cyan-300 glow-text">
              HASH
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">
              CRACK
            </span>
          </div>
          <span className="badge badge-cyan text-[9px] tracking-widest uppercase ml-1">v1.0</span>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1 flex-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'text-cyan-300 bg-cyan-400/[0.08]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
              }`}
            >
              <Icon size={15} />
              {label}
              {activeTab === id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
          title={t('lang.toggle', language)}
        >
          <Globe size={14} />
          <span className="text-[11px] font-bold uppercase tracking-wider">{language === 'es' ? 'ES' : 'EN'}</span>
        </button>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
          title={t('theme.toggle', language)}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
          <Wifi size={12} className="text-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-400/80 tracking-wide">{t('status.online', language)}</span>
        </div>
      </div>
    </header>
  )
}
