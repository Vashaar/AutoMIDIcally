import type { PatternType } from '../types/midi'

interface Props {
  value: PatternType
  onChange: (type: PatternType) => void
}

const PATTERN_TYPES: { type: PatternType; label: string; icon: string; description: string }[] = [
  { type: 'melody',  label: 'Melody',     icon: '♩', description: 'Single-line melodic phrase' },
  { type: 'chords',  label: 'Chords',     icon: '♦', description: 'Diatonic chord progression' },
  { type: 'drums',   label: 'Drums',      icon: '◉', description: '16-step GM drum pattern' },
  { type: 'bass',    label: 'Bass Line',  icon: '▬', description: 'Root-driven bass groove' },
]

export function PatternTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Pattern Type
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PATTERN_TYPES.map(({ type, label, icon, description }) => {
          const active = value === type
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              aria-pressed={active}
              title={description}
              className={[
                'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3',
                'text-sm font-medium transition-all duration-150 focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                'focus-visible:ring-offset-surface-800',
                active
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-surface-500 bg-surface-700 text-gray-400 hover:border-accent/40 hover:text-gray-200',
              ].join(' ')}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
