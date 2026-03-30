import { ArrowSquareOut, Flask } from '@phosphor-icons/react'
import useStore from '../store/useStore'
import { t } from '../i18n'

const CYBERCHEF = 'https://gchq.github.io/CyberChef/'

const RECIPES = [
  { name: 'MD5',      recipe: 'MD5()',       color: 'cyan' },
  { name: 'MD4',      recipe: 'MD4()',       color: 'cyan' },
  { name: 'SHA1',     recipe: 'SHA1()',      color: 'emerald' },
  { name: 'SHA-224',  recipe: "SHA2('224')", color: 'emerald' },
  { name: 'SHA-256',  recipe: "SHA2('256')", color: 'emerald' },
  { name: 'SHA-384',  recipe: "SHA2('384')", color: 'emerald' },
  { name: 'SHA-512',  recipe: "SHA2('512')", color: 'emerald' },
  { name: 'SHA3-256', recipe: "SHA3('256')", color: 'violet' },
  { name: 'SHA3-512', recipe: "SHA3('512')", color: 'violet' },
  { name: 'NT Hash',  recipe: 'NT_Hash()',   color: 'amber' },
  { name: 'LM Hash',  recipe: 'LM_Hash()',   color: 'amber' },
  { name: 'Bcrypt',   recipe: 'Bcrypt(10)',  color: 'red' },
  { name: 'Whirlpool', recipe: 'Whirlpool()', color: 'cyan' },
]

const COLOR_CLASSES = {
  cyan:    'bg-cyan-400/[0.06] text-cyan-400 border-cyan-400/20 hover:bg-cyan-400/[0.12] hover:border-cyan-400/30',
  emerald: 'bg-emerald-400/[0.06] text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/[0.12] hover:border-emerald-400/30',
  violet:  'bg-violet-400/[0.06] text-violet-400 border-violet-400/20 hover:bg-violet-400/[0.12] hover:border-violet-400/30',
  amber:   'bg-amber-400/[0.06] text-amber-400 border-amber-400/20 hover:bg-amber-400/[0.12] hover:border-amber-400/30',
  red:     'bg-red-400/[0.06] text-red-400 border-red-400/20 hover:bg-red-400/[0.12] hover:border-red-400/30',
}

export default function HashGenerator() {
  const { language } = useStore()

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-400/[0.08]">
          <Flask size={16} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            {t('generator.title', language)}
          </h2>
          <p className="text-[11px] text-white/30 mt-0.5">{t('generator.subtitle', language)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {RECIPES.map(({ name, recipe, color }) => (
          <a
            key={name}
            href={`${CYBERCHEF}#recipe=${recipe}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold tracking-wide transition-all duration-200 ${COLOR_CLASSES[color]}`}
          >
            {name}
            <ArrowSquareOut size={10} className="opacity-40" />
          </a>
        ))}
      </div>
    </div>
  )
}
