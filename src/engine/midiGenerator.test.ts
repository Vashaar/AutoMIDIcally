import { describe, it, expect } from 'vitest'
import { generatePattern, ticksToSeconds } from './midiGenerator'
import { ALL_KEYS } from './scaleUtils'
import type { GenerationParams } from '../types/midi'
import { TICKS_PER_BAR } from '../types/midi'

const BASE_PARAMS: GenerationParams = {
  patternType: 'melody',
  key: ALL_KEYS[0], // C Major
  bpm: 120,
  bars: 2,
  noteDensity: 5,
  vibe: 'Lo-fi',
}

describe('generatePattern', () => {
  it('returns a GeneratedPattern with correct totalTicks', () => {
    const result = generatePattern(BASE_PARAMS)
    expect(result.totalTicks).toBe(BASE_PARAMS.bars * TICKS_PER_BAR)
  })

  it('returns notes array for melody', () => {
    const result = generatePattern(BASE_PARAMS)
    expect(Array.isArray(result.notes)).toBe(true)
  })

  it('generates chords pattern', () => {
    const result = generatePattern({ ...BASE_PARAMS, patternType: 'chords' })
    expect(result.notes.length).toBeGreaterThan(0)
  })

  it('generates drums pattern', () => {
    const result = generatePattern({ ...BASE_PARAMS, patternType: 'drums', bars: 2 })
    expect(result.notes.length).toBeGreaterThan(0)
  })

  it('generates bass pattern', () => {
    const result = generatePattern({ ...BASE_PARAMS, patternType: 'bass' })
    expect(result.notes.length).toBeGreaterThan(0)
  })

  it('all notes have valid MIDI pitches (0–127)', () => {
    for (const patternType of ['melody', 'chords', 'drums', 'bass'] as const) {
      const result = generatePattern({ ...BASE_PARAMS, patternType })
      for (const note of result.notes) {
        expect(note.pitch).toBeGreaterThanOrEqual(0)
        expect(note.pitch).toBeLessThanOrEqual(127)
      }
    }
  })

  it('all notes have valid velocities (1–127)', () => {
    for (const patternType of ['melody', 'chords', 'drums', 'bass'] as const) {
      const result = generatePattern({ ...BASE_PARAMS, patternType })
      for (const note of result.notes) {
        expect(note.velocity).toBeGreaterThanOrEqual(1)
        expect(note.velocity).toBeLessThanOrEqual(127)
      }
    }
  })

  it('all note startTicks are within pattern bounds', () => {
    const result = generatePattern({ ...BASE_PARAMS, bars: 4 })
    const totalTicks = 4 * TICKS_PER_BAR
    for (const note of result.notes) {
      expect(note.startTick).toBeGreaterThanOrEqual(0)
      expect(note.startTick).toBeLessThan(totalTicks)
    }
  })

  it('all note durations are positive', () => {
    for (const patternType of ['melody', 'chords', 'drums', 'bass'] as const) {
      const result = generatePattern({ ...BASE_PARAMS, patternType })
      for (const note of result.notes) {
        expect(note.durationTicks).toBeGreaterThan(0)
      }
    }
  })

  it('works for all 24 keys', () => {
    for (const key of ALL_KEYS) {
      const result = generatePattern({ ...BASE_PARAMS, key })
      expect(result.notes).toBeDefined()
    }
  })

  it('works for all 6 vibes', () => {
    for (const vibe of ['Cinematic', 'Lo-fi', 'Hyperpop', 'Afrobeats', 'Jazz', 'Dark Trap'] as const) {
      const result = generatePattern({ ...BASE_PARAMS, vibe })
      expect(result.notes).toBeDefined()
    }
  })

  it('velocity varies across notes (not all the same)', () => {
    const result = generatePattern({ ...BASE_PARAMS, bars: 8 })
    if (result.notes.length < 2) return // skip if too sparse
    const velocities = result.notes.map(n => n.velocity)
    const allSame = velocities.every(v => v === velocities[0])
    expect(allSame).toBe(false)
  })

  it('higher noteDensity produces more notes than lower', () => {
    const sparse = generatePattern({ ...BASE_PARAMS, noteDensity: 1, bars: 4, patternType: 'melody' })
    const dense = generatePattern({ ...BASE_PARAMS, noteDensity: 10, bars: 4, patternType: 'melody' })
    // Dense should have >= sparse; not guaranteed to be strictly more but usually true
    expect(dense.notes.length).toBeGreaterThanOrEqual(sparse.notes.length)
  })
})

describe('ticksToSeconds', () => {
  it('converts 480 ticks at 120 BPM to 0.5 seconds', () => {
    // 480 PPQ = 1 quarter note; at 120 BPM, 1 beat = 0.5s
    expect(ticksToSeconds(480, 120)).toBeCloseTo(0.5)
  })

  it('converts 960 ticks at 60 BPM to 2 seconds', () => {
    // 960 ticks = 2 beats; at 60 BPM each beat = 1s
    expect(ticksToSeconds(960, 60)).toBeCloseTo(2)
  })

  it('scales with BPM', () => {
    const slow = ticksToSeconds(480, 60)
    const fast = ticksToSeconds(480, 120)
    expect(slow).toBeGreaterThan(fast)
  })
})
