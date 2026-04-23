import type { PatternType } from '../types/midi'

interface Props {
  value: PatternType
  onChange: (type: PatternType) => void
}

const PATTERN_TYPES: { type: PatternType; label: string; description: string }[] = [
  { type: 'melody', label: 'Melody', description: 'Single-line melodic phrase' },
  { type: 'chords', label: 'Chords', description: 'Diatonic chord progression' },
  { type: 'drums', label: 'Drums', description: '16-step GM drum pattern' },
  { type: 'bass', label: 'Bass', description: 'Root-driven bass groove' },
]

export function PatternTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/70">
        Pattern Type
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {PATTERN_TYPES.map(({ type, label, description }) => {
          const active = value === type
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              aria-pressed={active}
              title={description}
              className={[
                'group flex min-h-24 flex-col justify-between rounded-2xl border p-3 text-left',
                'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                active
                  ? 'border-accent bg-accent/15 text-white shadow-[0_0_24px_rgba(24,215,212,0.18)]'
                  : 'border-white/10 bg-white/[0.035] text-gray-400 hover:border-accent/40 hover:text-gray-100',
              ].join(' ')}
            >
              <PatternIcon type={type} active={active} />
              <span className="text-sm font-bold">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PatternIcon({ type, active }: { type: PatternType; active: boolean }) {
  const color = active ? 'text-accent' : 'text-violet-300/70 group-hover:text-accent'
  const common = `h-7 w-7 ${color}`

  if (type === 'melody') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={common}>
        <path d="M8 22c5-15 8 11 12-8 2-9 4-3 4-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="7" cy="23" r="3" fill="currentColor" />
      </svg>
    )
  }

  if (type === 'chords') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={common}>
        <rect x="5" y="9" width="7" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="13" y="5" width="7" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="21" y="12" width="6" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  }

  if (type === 'drums') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={common}>
        <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2.5" />
        <path d="M9 9 5 5M23 9l4-4M12 16h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 32 32" fill="none" className={common}>
      <path d="M9 7v18M16 11v14M23 5v20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M7 25h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
