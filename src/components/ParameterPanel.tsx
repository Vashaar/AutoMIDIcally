import type { GenerationParams, VibeName } from '../types/midi'
import { ALL_KEYS } from '../engine/scaleUtils'

interface Props {
  params: GenerationParams
  onKeyChange: (label: string) => void
  onBpmChange: (bpm: number) => void
  onBarsChange: (bars: number) => void
  onDensityChange: (density: number) => void
  onVibeChange: (vibe: VibeName) => void
}

const VIBES: VibeName[] = ['Cinematic', 'Lo-fi', 'Hyperpop', 'Afrobeats', 'Jazz', 'Dark Trap']

const VIBE_COLORS: Record<VibeName, string> = {
  Cinematic:   'from-blue-900/40 to-purple-900/40 border-blue-700/50',
  'Lo-fi':     'from-amber-900/40 to-orange-900/40 border-amber-700/50',
  Hyperpop:    'from-pink-900/40 to-fuchsia-900/40 border-pink-700/50',
  Afrobeats:   'from-green-900/40 to-teal-900/40 border-green-700/50',
  Jazz:        'from-yellow-900/40 to-amber-900/40 border-yellow-700/50',
  'Dark Trap': 'from-gray-900/40 to-zinc-900/40 border-gray-600/50',
}

export function ParameterPanel({
  params, onKeyChange, onBpmChange, onBarsChange, onDensityChange, onVibeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Parameters
      </h2>

      {/* ── Key selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="key-select" className="text-sm font-medium text-gray-300">
          Key
        </label>
        <select
          id="key-select"
          value={params.key.label}
          onChange={e => onKeyChange(e.target.value)}
          className="rounded-lg border border-surface-500 bg-surface-700 px-3 py-2 text-sm
            text-gray-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {ALL_KEYS.map(k => (
            <option key={k.label} value={k.label}>{k.label}</option>
          ))}
        </select>
      </div>

      {/* ── BPM */}
      <SliderField
        id="bpm"
        label="BPM"
        value={params.bpm}
        min={60}
        max={180}
        step={1}
        displayValue={`${params.bpm}`}
        onChange={onBpmChange}
      />

      {/* ── Bars */}
      <SliderField
        id="bars"
        label="Bars"
        value={params.bars}
        min={1}
        max={16}
        step={1}
        displayValue={`${params.bars}`}
        onChange={onBarsChange}
      />

      {/* ── Note density */}
      <SliderField
        id="density"
        label="Density"
        value={params.noteDensity}
        min={1}
        max={10}
        step={1}
        displayValue={`${params.noteDensity}`}
        onChange={onDensityChange}
      />

      {/* ── Vibe presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-300">Vibe</span>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {VIBES.map(vibe => {
            const active = params.vibe === vibe
            return (
              <button
                key={vibe}
                onClick={() => onVibeChange(vibe)}
                aria-pressed={active}
                className={[
                  'rounded-lg border bg-gradient-to-br px-2 py-2 text-xs font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  active
                    ? `${VIBE_COLORS[vibe]} text-white`
                    : 'border-surface-500 bg-surface-700 bg-none text-gray-400 hover:text-gray-200',
                ].join(' ')}
              >
                {vibe}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Reusable slider ──────────────────────────────────────────────────────────

interface SliderFieldProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onChange: (value: number) => void
}

function SliderField({ id, label, value, min, max, step, displayValue, onChange }: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>
        <span className="font-mono text-sm text-accent">{displayValue}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-500
          accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
