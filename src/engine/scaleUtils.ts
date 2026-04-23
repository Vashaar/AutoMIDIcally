/**
 * scaleUtils.ts
 *
 * Music theory primitives: scales, key names, chord intervals.
 * All pitch values are absolute MIDI note numbers (0–127).
 * Middle C = 60 = C4.
 */

import type { MusicalKey, RootNote, ScaleMode } from '../types/midi'

// ─── Interval patterns ────────────────────────────────────────────────────────

/**
 * Interval steps (in semitones) from root for each scale mode.
 * Major scale: W W H W W W H  →  2 2 1 2 2 2 1
 * Natural minor:              →  2 1 2 2 1 2 2
 */
export const SCALE_INTERVALS: Record<ScaleMode, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
}

// ─── Note name tables ─────────────────────────────────────────────────────────

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

/** Roots that conventionally use flats in their key signature */
const FLAT_ROOTS = new Set<RootNote>([5, 8, 10, 3, 1]) // F, Ab, Bb, Eb, Db

export function rootNoteName(root: RootNote): string {
  return FLAT_ROOTS.has(root) ? FLAT_NAMES[root] : SHARP_NAMES[root]
}

// ─── Key catalogue ────────────────────────────────────────────────────────────

/** All 24 musical keys, ordered for display in a selector. */
export const ALL_KEYS: MusicalKey[] = (() => {
  const keys: MusicalKey[] = []
  for (let root = 0; root < 12; root++) {
    for (const mode of ['major', 'minor'] as ScaleMode[]) {
      const name = rootNoteName(root as RootNote)
      keys.push({
        root: root as RootNote,
        mode,
        label: `${name} ${mode === 'major' ? 'Major' : 'Minor'}`,
      })
    }
  }
  return keys
})()

// ─── Scale note generation ────────────────────────────────────────────────────

/**
 * Returns MIDI note numbers for the given key across the specified octave range.
 *
 * @param root     Chromatic root (0 = C … 11 = B)
 * @param mode     'major' or 'minor'
 * @param minOctave  Lowest octave to include (MIDI octave 0 = notes 0–11)
 * @param maxOctave  Highest octave to include
 */
export function getScaleNotes(
  root: RootNote,
  mode: ScaleMode,
  minOctave = 3,
  maxOctave = 6,
): number[] {
  const intervals = SCALE_INTERVALS[mode]
  const notes: number[] = []
  for (let octave = minOctave; octave <= maxOctave; octave++) {
    for (const interval of intervals) {
      // +12 offset so C4 = 60 (standard MIDI / DAW convention)
      const pitch = (octave + 1) * 12 + root + interval
      if (pitch >= 0 && pitch <= 127) notes.push(pitch)
    }
  }
  return notes
}

/**
 * Returns the 7 scale degrees for a single octave (no octave wrapping).
 * Useful for chord building where we need specific degrees.
 */
export function getScaleDegrees(root: RootNote, mode: ScaleMode): number[] {
  return SCALE_INTERVALS[mode].map(i => root + i)
}

/**
 * Snaps an arbitrary MIDI pitch to the nearest note in the given scale.
 * Used to correct any out-of-key values without outright discarding them.
 */
export function snapToScale(pitch: number, root: RootNote, mode: ScaleMode): number {
  const chroma = ((pitch % 12) + 12) % 12
  const intervals = SCALE_INTERVALS[mode]
  // Find the interval closest to our chromatic value
  let closest = intervals[0]
  let minDist = Math.abs(chroma - intervals[0])
  for (const interval of intervals) {
    const dist = Math.min(
      Math.abs(chroma - interval),
      Math.abs(chroma - interval + 12),
      Math.abs(chroma - interval - 12),
    )
    if (dist < minDist) {
      minDist = dist
      closest = interval
    }
  }
  const octave = Math.floor(pitch / 12)
  return octave * 12 + root + closest
}

// ─── Chord intervals ──────────────────────────────────────────────────────────

/**
 * Triad intervals above the root: [0, 3rd, 5th]
 * Major triad:  0, 4, 7   Minor triad: 0, 3, 7
 */
export const TRIAD_INTERVALS: Record<'major' | 'minor' | 'diminished' | 'augmented', readonly number[]> = {
  major:      [0, 4, 7],
  minor:      [0, 3, 7],
  diminished: [0, 3, 6],
  augmented:  [0, 4, 8],
}

/**
 * 7th chord intervals above the root.
 * maj7: 0 4 7 11  |  min7: 0 3 7 10  |  dom7: 0 4 7 10  |  dim7: 0 3 6 9
 */
export const SEVENTH_INTERVALS: Record<'maj7' | 'min7' | 'dom7' | 'dim7' | 'half-dim7', readonly number[]> = {
  maj7:       [0, 4, 7, 11],
  min7:       [0, 3, 7, 10],
  dom7:       [0, 4, 7, 10],
  dim7:       [0, 3, 6, 9],
  'half-dim7':[0, 3, 6, 10],
}

/**
 * Diatonic chord qualities for each scale degree (1–7) in major and minor.
 * Used by chordEngine to determine whether to use major/minor/diminished.
 *
 * Major:  I   ii  iii IV  V   vi  vii°
 * Minor:  i   ii° III iv  v   VI  VII
 */
export const DIATONIC_CHORD_QUALITIES: Record<ScaleMode, readonly ('major' | 'minor' | 'diminished')[]> = {
  major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
  minor: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'],
}

/**
 * Returns the absolute MIDI pitches for a chord built on the given scale degree.
 *
 * @param degreeIndex  0-based scale degree (0 = root/I, 6 = VII)
 * @param root         Key root
 * @param mode         Scale mode
 * @param octave       Octave for the chord root (default 3 = below middle C)
 * @param use7th       Whether to add the 7th
 */
export function buildChord(
  degreeIndex: number,
  root: RootNote,
  mode: ScaleMode,
  octave = 3,
  use7th = false,
): number[] {
  const scaleIntervals = SCALE_INTERVALS[mode]
  const chordRootInterval = scaleIntervals[degreeIndex % 7]
  // +12 offset so octave 4 = middle C = 60 (standard MIDI convention)
  const chordRootPitch = (octave + 1) * 12 + root + chordRootInterval

  const quality = DIATONIC_CHORD_QUALITIES[mode][degreeIndex % 7]

  if (use7th) {
    // Map triad quality + scale context to 7th chord type
    const seventh7thMap: Record<string, readonly number[]> = {
      major: mode === 'major' && degreeIndex % 7 === 4
        ? SEVENTH_INTERVALS.dom7   // V7 is dominant
        : SEVENTH_INTERVALS.maj7,
      minor: SEVENTH_INTERVALS.min7,
      diminished: SEVENTH_INTERVALS['half-dim7'],
    }
    const intervals = seventh7thMap[quality] ?? SEVENTH_INTERVALS.min7
    return intervals.map(i => chordRootPitch + i)
  }

  return TRIAD_INTERVALS[quality].map(i => chordRootPitch + i)
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Clamps a MIDI pitch to the valid range 0–127. */
export function clampPitch(pitch: number): number {
  return Math.max(0, Math.min(127, pitch))
}

/** Transposes a pitch by the given number of octaves. */
export function transposeOctave(pitch: number, octaves: number): number {
  return clampPitch(pitch + octaves * 12)
}

/**
 * Pseudo-random number generator (seeded) for reproducible patterns.
 * Uses a simple xorshift32 so tests can be deterministic.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >> 17
    state ^= state << 5
    return (state >>> 0) / 0xffffffff
  }
}

/**
 * Picks a random element from an array using the provided RNG.
 */
export function randomChoice<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

/**
 * Varies a velocity value by ±variance, clamped to 1–127.
 */
export function varyVelocity(base: number, variance: number, rng: () => number): number {
  const delta = (rng() * 2 - 1) * variance
  return Math.max(1, Math.min(127, Math.round(base + delta)))
}
