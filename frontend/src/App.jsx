import { useEffect } from 'react'
import Header from './components/Header'
import InputArea from './components/InputArea'
import CrackingOptions from './components/CrackingOptions'
import ProgressPanel from './components/ProgressPanel'
import Results from './components/Results'
import HashGeneratorPage from './components/HashGeneratorPage'
import WordlistManager from './components/WordlistManager'
import StatsView from './components/StatsView'
import useStore from './store/useStore'
import { t } from './i18n'

export default function App() {
  const { activeTab, theme, fetchWordlists, language } = useStore()

  useEffect(() => { fetchWordlists() }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen flex flex-col bg-surface-900 bg-grid relative">
      <div className="noise-overlay" />
      <Header />

      <main className="relative flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Cracker Tab */}
        {activeTab === 'cracker' && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 animate-fade-in">
            {/* Left column */}
            <div className="space-y-6">
              <InputArea />
              <Results />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <CrackingOptions />
              <ProgressPanel />
            </div>
          </div>
        )}

        {/* Wordlists Tab */}
        {activeTab === 'wordlists' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">{t('wl.management', language)}</h1>
              <span className="badge badge-cyan">{t('general.local', language)}</span>
            </div>
            <WordlistManager />
          </div>
        )}

        {/* Generator Tab */}
        {activeTab === 'generator' && (
          <HashGeneratorPage />
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">{t('stats.title', language)}</h1>
            </div>
            <StatsView />
          </div>
        )}
      </main>

      <footer className="relative text-center py-6 border-t border-white/[0.04]">
        <p className="text-xs text-white/25">
          Developed by{' '}
          <a
            href="https://www.instagram.com/afsh4ck/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400/60 hover:text-cyan-300 transition-colors"
          >
            afsh4ck
          </a>
        </p>
      </footer>
    </div>
  )
}
