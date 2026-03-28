import { Zap, Square, CheckCircle2, Activity } from 'lucide-react'
import useStore from '../store/useStore'
import { t } from '../i18n'

const STRATEGY_BADGE = {
  rainbow: 'badge-cyan',
  dictionary: 'badge-green',
  rules: 'badge-purple',
  mask: 'badge-yellow',
  bruteforce: 'badge-red',
}

export default function ProgressPanel() {
  const { taskStatus, results, startCracking, stopTask, hashInput, language } = useStore()
  const hashCount = hashInput.split('\n').filter((l) => l.trim()).length

  const running = taskStatus?.status === 'running'
  const done = taskStatus?.status === 'completed' || taskStatus?.status === 'stopped'

  // Use phase_progress (0-1 from backend) for real-time progress bar
  const phaseProgress = taskStatus?.phase_progress ?? 0
  const pct = done ? 100 : Math.round(phaseProgress * 100)

  const rate = taskStatus?.cracked && taskStatus?.total
    ? ((taskStatus.cracked / taskStatus.total) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-4">
      {/* Start / Stop Button */}
      <button
        onClick={running ? stopTask : startCracking}
        disabled={!hashCount && !running}
        className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 ${
          running
            ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/15 hover:border-red-500/40'
            : 'btn-primary animate-glow-pulse'
        } disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none disabled:animate-none`}
      >
        {running ? (
          <><Square size={14} /> {t('progress.stop', language)}</>
        ) : (
          <><Zap size={14} /> {t('progress.start', language)}</>
        )}
      </button>

      {/* Progress */}
      {taskStatus && (
        <div className="card space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {running && (
                <div className="relative">
                  <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-30" />
                  <span className="relative w-2.5 h-2.5 rounded-full bg-cyan-400 block" />
                </div>
              )}
              <span className={`text-xs font-bold uppercase tracking-widest ${
                running ? 'text-cyan-300' :
                done ? 'text-emerald-400' :
                'text-white/40'
              }`}>
                {running ? t('progress.running', language) :
                 done ? (taskStatus.status === 'completed' ? t('progress.completed', language) : t('progress.stopped', language)) :
                 taskStatus.status}
              {running && taskStatus.phase && taskStatus.phase !== 'done' && (
                <span className="ml-1.5 text-white/30">— {t(`progress.phase.${taskStatus.phase}`, language)}</span>
              )}
              </span>
            </div>
            <span className="text-[11px] text-white/25 font-mono">
              {taskStatus.cracked?.toLocaleString()} / {taskStatus.total?.toLocaleString()}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: done
                  ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                  : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
              }}
            />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t('progress.cracked', language), value: taskStatus.cracked?.toLocaleString() || 0, color: 'text-emerald-400' },
              { label: t('progress.rate', language), value: `${rate}%`, color: 'text-cyan-300' },
              { label: t('progress.progress', language), value: `${pct}%`, color: 'text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/[0.03]">
                <div className={`text-xl font-bold tracking-tight ${color}`}>{value}</div>
                <div className="text-[10px] text-white/25 uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Live feed */}
          {results.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={12} className="text-white/20" />
                <p className="text-[11px] text-white/25 uppercase tracking-widest font-semibold">{t('progress.lastFound', language)}</p>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {[...results].reverse().slice(0, 20).map((r, i) => (
                  <div key={i} className="hash-row flex items-center gap-2 py-1.5 px-2.5 text-xs animate-fade-in">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                    <span className="text-white/30 font-mono truncate max-w-[100px]">{r.hash.slice(0, 12)}…</span>
                    <span className="text-emerald-300 font-semibold">{r.plaintext}</span>
                    <span className={`badge ${STRATEGY_BADGE[r.strategy] || 'badge-cyan'} ml-auto text-[10px]`}>{r.strategy}</span>
                    {r.time_ms != null && (
                      <span className="text-white/15 font-mono text-[10px]">{r.time_ms.toFixed(1)}ms</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
