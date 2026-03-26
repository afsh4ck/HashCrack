import { useRef, useState } from 'react'
import { Upload, Clipboard, Trash2, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import useStore from '../store/useStore'
import { t } from '../i18n'

export default function InputArea() {
  const { hashInput, setHashInput, detectedHashes, detectHashes, language } = useStore()
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const handleChange = (e) => {
    const val = e.target.value
    setHashInput(val)
    if (val.trim()) detectHashes(val)
  }

  const handleFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setHashInput(text)
      detectHashes(text)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const hashCount = hashInput.split('\n').filter((l) => l.trim()).length

  return (
    <div className="card-glow space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-400/[0.08]">
            <FileText size={16} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              {t('input.title', language)}
            </h2>
            <p className="text-[11px] text-white/30 mt-0.5">{t('input.subtitle', language)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hashCount > 0 && (
            <span className="badge badge-cyan font-mono">{hashCount}</span>
          )}
          <button
            onClick={() => { setHashInput(''); useStore.setState({ detectedHashes: [] }) }}
            className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/[0.06] transition-all duration-200"
            title={t('input.clear', language)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div
        className={`relative rounded-xl border transition-all duration-300 ${
          dragging
            ? 'border-cyan-400/50 bg-cyan-400/[0.03] shadow-[0_0_30px_rgba(0,243,255,0.08)]'
            : 'border-white/[0.06] hover:border-white/[0.12]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          value={hashInput}
          onChange={handleChange}
          placeholder={t('input.placeholder', language)}
          className="w-full h-44 bg-transparent px-5 py-4 text-sm font-mono text-white/80 placeholder-white/15 resize-none focus:outline-none leading-relaxed"
          spellCheck={false}
        />
        {!hashInput && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white/15 mt-8">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <Upload size={20} />
              </div>
              <p className="text-xs font-medium">{t('input.dragText', language)}</p>
              <p className="text-[11px] mt-1.5 text-white/10">{t('input.supportedTypes', language)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input ref={fileRef} type="file" className="hidden" accept=".txt,.lst,.hash"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs flex items-center gap-2">
          <Upload size={13} /> {t('input.loadFile', language)}
        </button>
        <button
          onClick={async () => {
            const text = await navigator.clipboard.readText()
            setHashInput(text)
            detectHashes(text)
          }}
          className="btn-ghost text-xs flex items-center gap-2"
        >
          <Clipboard size={13} /> {t('input.paste', language)}
        </button>
      </div>

      {/* Detection badges — show variants when confidence is low */}
      {detectedHashes.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {[...new Map(detectedHashes.map((d) => [d.detected_type, d])).values()]
            .slice(0, 8)
            .map((d) => (
              <span key={d.detected_type} className={`badge gap-1.5 ${d.confidence >= 0.8 ? 'badge-green' : 'badge-yellow'}`}>
                {d.confidence >= 0.8 ? (
                  <CheckCircle size={10} />
                ) : (
                  <AlertCircle size={10} />
                )}
                {d.variants && d.variants.length > 1
                  ? d.variants.join(' / ')
                  : d.detected_type}
                {d.hashcat_mode && (
                  <span className="opacity-50">-m {d.hashcat_mode}</span>
                )}
                <span className="opacity-50">{Math.round(d.confidence * 100)}%</span>
              </span>
            ))}
        </div>
      )}
    </div>
  )
}
