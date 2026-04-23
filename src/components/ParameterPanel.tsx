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
  Cinematic: 'from-violet-900/50 to-cyan-900/30 border-accent/50',
  'Lo-fi': 'from-violet-900/40 to-fuchsia-900/30 border-violetglow-light/50',
  Hyperpop: 'from-fuchsia-900/50 to-cyan-900/30 border-accent/50',
  Afrobeats: 'from-cyan-900/40 to-emerald-900/30 border-accent/50',
  Jazz: 'from-violet-900/40 to-sky-900/30 border-violetglow-light/50',
  'Dark Trap': 'from-surface-800 to-violet-950/60 border-surface-400/50',
}

export function ParameterPanel({
  params, onKeyChange, onBpmChange, onBarsChange, onDensityChange, onVibeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/70">
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
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm
            text-gray-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
        <div className="grid grid-cols-2 gap-2">
          {VIBES.map(vibe => {
            const active = params.vibe === vibe
            return (
              <button
                key={vibe}
                onClick={() => onVibeChange(vibe)}
                aria-pressed={active}
                className={[
                  'rounded-xl border bg-gradient-to-br px-2 py-2.5 text-xs font-semibold transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  active
                    ? `${VIBE_COLORS[vibe]} text-white`
                    : 'border-white/10 bg-white/[0.035] bg-none text-gray-400 hover:border-accent/30 hover:text-gray-100',
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
        <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-sm font-semibold text-accent">{displayValue}</span>
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
