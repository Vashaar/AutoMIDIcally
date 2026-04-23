/**
 * PianoRoll.tsx
 *
 * Visual grid display for generated MIDI notes.
 *
 * - X axis: time (ticks → pixels), scrolls horizontally for long patterns
 * - Y axis: pitch (MIDI note number), higher = higher up
 * - Each note is a colored rectangle; drums use lane names instead of pitches
 * - Drum mode maps GM drum pitches to labeled rows
 */

import { useMemo } from 'react'
import type { GeneratedPattern } from '../types/midi'
import { GM_DRUM } from '../types/midi'

interface Props {
  pattern: GeneratedPattern | null
  isGenerating: boolean
}

const PIXELS_PER_TICK = 0.12
const ROW_HEIGHT = 14
const PIANO_KEY_WIDTH = 36
const NOTE_BORDER_RADIUS = 3

// Pitch range for melodic patterns (show a window around the notes)
// GM drum voices to show, in display order (top = highest on grid)
const DRUM_ROWS = [
  { pitch: GM_DRUM.CRASH,        label: 'Crash',  color: '#818cf8' },
  { pitch: GM_DRUM.OPEN_HIHAT,   label: 'O.Hat',  color: '#a78bfa' },
  { pitch: GM_DRUM.CLOSED_HIHAT, label: 'C.Hat',  color: '#7c3aed' },
  { pitch: GM_DRUM.RIDE,         label: 'Ride',   color: '#6d28d9' },
  { pitch: GM_DRUM.CLAP,         label: 'Clap',   color: '#f472b6' },
  { pitch: GM_DRUM.SNARE,        label: 'Snare',  color: '#fb923c' },
  { pitch: GM_DRUM.TOM_HIGH,     label: 'Tom H',  color: '#4ade80' },
  { pitch: GM_DRUM.TOM_MID,      label: 'Tom M',  color: '#34d399' },
  { pitch: GM_DRUM.TOM_LOW,      label: 'Tom L',  color: '#2dd4bf' },
  { pitch: GM_DRUM.KICK,         label: 'Kick',   color: '#f87171' },
]

// Piano key colors for the left-side piano guide
const isBlackKey = (pitch: number) => [1, 3, 6, 8, 10].includes(pitch % 12)

export function PianoRoll({ pattern, isGenerating }: Props) {
  const isDrums = pattern?.params.patternType === 'drums'

  const { pitchMin, pitchMax, totalWidth, height } = useMemo(() => {
    if (!pattern || pattern.notes.length === 0) {
      return { pitchMin: 48, pitchMax: 72, totalWidth: 400, height: 200, noteRows: [] }
    }

    if (isDrums) {
      const totalWidth = Math.max(400, pattern.totalTicks * PIXELS_PER_TICK)
      const height = DRUM_ROWS.length * ROW_HEIGHT
      return { pitchMin: 0, pitchMax: 0, totalWidth, height }
    }

    const pitches = pattern.notes.map(n => n.pitch)
    const rawMin = Math.min(...pitches)
    const rawMax = Math.max(...pitches)
    const pitchMin = Math.max(0, rawMin - 4)
    const pitchMax = Math.min(127, rawMax + 4)
    const totalWidth = Math.max(400, pattern.totalTicks * PIXELS_PER_TICK)
    const numRows = pitchMax - pitchMin + 1
    const height = numRows * ROW_HEIGHT

    return { pitchMin, pitchMax, totalWidth, height }
  }, [pattern, isDrums])

  if (isGenerating) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-surface-500 bg-surface-800">
        <span className="animate-pulse text-sm text-gray-500">Generating…</span>
      </div>
    )
  }

  if (!pattern || pattern.notes.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-surface-500 bg-surface-800">
        <span className="text-sm text-gray-600">No pattern generated yet</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Piano Roll Preview
      </h2>
      <div
        className="overflow-x-auto rounded-xl border border-surface-500 bg-surface-800"
        style={{ maxHeight: '280px' }}
      >
        <div className="relative flex" style={{ minWidth: totalWidth + PIANO_KEY_WIDTH }}>
          {/* ── Piano key guide */}
          {isDrums ? (
            <DrumLabels />
          ) : (
            <PianoKeys pitchMin={pitchMin} pitchMax={pitchMax} rowHeight={ROW_HEIGHT} />
          )}

          {/* ── Grid + notes */}
          <div
            className="relative overflow-hidden"
            style={{ width: totalWidth, height: isDrums ? DRUM_ROWS.length * ROW_HEIGHT : height }}
          >
            {isDrums ? (
              <DrumGrid pattern={pattern} totalWidth={totalWidth} />
            ) : (
              <MelodicGrid
                pattern={pattern}
                pitchMin={pitchMin}
                pitchMax={pitchMax}
                totalWidth={totalWidth}
                rowHeight={ROW_HEIGHT}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Melodic grid ─────────────────────────────────────────────────────────────

function MelodicGrid({
  pattern, pitchMin, pitchMax, totalWidth, rowHeight,
}: {
  pattern: GeneratedPattern
  pitchMin: number
  pitchMax: number
  totalWidth: number
  rowHeight: number
}) {
  const numRows = pitchMax - pitchMin + 1
  const height = numRows * rowHeight

  return (
    <svg width={totalWidth} height={height} className="select-none">
      {/* Row backgrounds */}
      {Array.from({ length: numRows }, (_, i) => {
        const pitch = pitchMax - i
        const y = i * rowHeight
        const black = isBlackKey(pitch)
        return (
          <rect
            key={pitch}
            x={0} y={y}
            width={totalWidth} height={rowHeight}
            fill={black ? '#1a1a1f' : '#18181c'}
          />
        )
      })}

      {/* Beat grid lines */}
      {Array.from({ length: Math.ceil(pattern.totalTicks / 480) + 1 }, (_, beat) => (
        <line
          key={beat}
          x1={beat * 480 * PIXELS_PER_TICK} x2={beat * 480 * PIXELS_PER_TICK}
          y1={0} y2={height}
          stroke={beat % 4 === 0 ? '#3a3a3f' : '#242427'}
          strokeWidth={beat % 4 === 0 ? 1.5 : 0.5}
        />
      ))}

      {/* Notes */}
      {pattern.notes.map((note, i) => {
        if (note.pitch < pitchMin || note.pitch > pitchMax) return null
        const x = note.startTick * PIXELS_PER_TICK
        const w = Math.max(3, note.durationTicks * PIXELS_PER_TICK - 1)
        const y = (pitchMax - note.pitch) * rowHeight + 1
        const h = rowHeight - 2
        const opacity = 0.55 + (note.velocity / 127) * 0.45
        return (
          <rect
            key={i}
            x={x} y={y} width={w} height={h}
            rx={NOTE_BORDER_RADIUS}
            fill={`rgba(124,58,237,${opacity})`}
          />
        )
      })}
    </svg>
  )
}

// ─── Drum grid ────────────────────────────────────────────────────────────────

function DrumGrid({ pattern, totalWidth }: { pattern: GeneratedPattern; totalWidth: number }) {
  const height = DRUM_ROWS.length * ROW_HEIGHT
  const notesByPitch = new Map<number, typeof pattern.notes>()
  for (const note of pattern.notes) {
    if (!notesByPitch.has(note.pitch)) notesByPitch.set(note.pitch, [])
    notesByPitch.get(note.pitch)!.push(note)
  }

  return (
    <svg width={totalWidth} height={height} className="select-none">
      {DRUM_ROWS.map(({ pitch, color }, rowIdx) => {
        const y = rowIdx * ROW_HEIGHT
        return (
          <g key={pitch}>
            <rect x={0} y={y} width={totalWidth} height={ROW_HEIGHT}
              fill={rowIdx % 2 === 0 ? '#16161a' : '#18181c'} />
            {(notesByPitch.get(pitch) ?? []).map((note, i) => {
              const x = note.startTick * PIXELS_PER_TICK
              const w = Math.max(4, ROW_HEIGHT - 2)
              const opacity = 0.6 + (note.velocity / 127) * 0.4
              return (
                <rect key={i}
                  x={x} y={y + 2} width={w} height={ROW_HEIGHT - 4}
                  rx={2}
                  fill={color}
                  fillOpacity={opacity}
                />
              )
            })}
          </g>
        )
      })}

      {/* Beat grid */}
      {Array.from({ length: Math.ceil(pattern.totalTicks / 480) + 1 }, (_, beat) => (
        <line key={beat}
          x1={beat * 480 * PIXELS_PER_TICK} x2={beat * 480 * PIXELS_PER_TICK}
          y1={0} y2={height}
          stroke={beat % 4 === 0 ? '#3a3a3f' : '#1e1e22'}
          strokeWidth={beat % 4 === 0 ? 1.5 : 0.5}
        />
      ))}
    </svg>
  )
}

// ─── Piano key strip ──────────────────────────────────────────────────────────

function PianoKeys({ pitchMin, pitchMax, rowHeight }: { pitchMin: number; pitchMax: number; rowHeight: number }) {
  const numRows = pitchMax - pitchMin + 1
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  return (
    <div
      className="flex-shrink-0 border-r border-surface-600"
      style={{ width: PIANO_KEY_WIDTH, height: numRows * rowHeight }}
    >
      {Array.from({ length: numRows }, (_, i) => {
        const pitch = pitchMax - i
        const black = isBlackKey(pitch)
        const isC = pitch % 12 === 0
        return (
          <div
            key={pitch}
            style={{ height: rowHeight }}
            className={[
              'flex items-center justify-end pr-1 text-[9px]',
              black ? 'bg-surface-800 text-gray-600' : 'bg-surface-700 text-gray-500',
            ].join(' ')}
          >
            {isC && <span>{NOTE_NAMES[pitch % 12]}{Math.floor(pitch / 12) - 1}</span>}
          </div>
        )
      })}
    </div>
  )
}

function DrumLabels() {
  return (
    <div
      className="flex flex-shrink-0 flex-col border-r border-surface-600"
      style={{ width: PIANO_KEY_WIDTH }}
    >
      {DRUM_ROWS.map(({ label, color }) => (
        <div
          key={label}
          style={{ height: ROW_HEIGHT, color }}
          className="flex items-center justify-end pr-1 text-[9px] font-medium"
        >
          {label}
        </div>
      ))}
    </div>
  )
}

