/**
 * chordEngine.ts
 *
 * Generates diatonic chord progressions.
 *
 * Strategy:
 *  1. Choose a chord progression template based on vibe (I-IV-V-I type patterns).
 *  2. Each chord lasts a configurable number of bars.
 *  3. Build voicings using scaleUtils.buildChord (triads or 7ths per vibe).
 *  4. Velocity variation and note duration applied per vibe config.
 *
 * All chords stay diatonic — no accidentals unless a future "tension" param adds them.
 */

import type { GenerationParams, MidiNote } from '../types/midi'
import { TICKS_PER_BAR } from '../types/midi'
import type { VibeConfig } from '../types/midi'
import { buildChord, createSeededRandom, varyVelocity } from './scaleUtils'

/**
 * Chord progression templates as scale-degree indices (0-based).
 * Each sub-array is a sequence of degrees to cycle through.
 * Named after common genre conventions.
 */
const PROGRESSION_TEMPLATES: Record<string, number[][]> = {
  // I – V – vi – IV  (pop / cinematic)
  pop:       [[0, 4, 5, 3]],
  // i – VI – III – VII  (minor, emotional)
  minorPop:  [[0, 5, 2, 6]],
  // I – IV – V  (blues/jazz base)
  blues:     [[0, 3, 4]],
  // ii – V – I  (jazz turnaround)
  jazzTurn:  [[1, 4, 0]],
  // i – iv – i – V  (dark minor)
  darkMinor: [[0, 3, 0, 4]],
  // I – IV – I – V  (afrobeats feel)
  afro:      [[0, 3, 0, 4]],
  // Short: I – V  (hyperpop stabs)
  stabs:     [[0, 4]],
}

const VIBE_PROGRESSION_MAP: Record<string, string> = {
  Cinematic:   'minorPop',
  'Lo-fi':     'pop',
  Hyperpop:    'stabs',
  Afrobeats:   'afro',
  Jazz:        'jazzTurn',
  'Dark Trap': 'darkMinor',
}

export function generateChords(params: GenerationParams, vibe: VibeConfig): MidiNote[] {
  const rng = createSeededRandom(
    params.key.root * 200 + params.bpm * 3 + params.bars * 11,
  )

  const progressionKey = VIBE_PROGRESSION_MAP[vibe.name] ?? 'pop'
  const templates = PROGRESSION_TEMPLATES[progressionKey]
  // Pick one of the available templates (currently one per genre)
  const degreeSequence = templates[Math.floor(rng() * templates.length)]

  // Each chord lasts: totalBars / chordCount bars (minimum 1 bar per chord)
  const chordCount = degreeSequence.length
  const barsPerChord = Math.max(1, Math.round(params.bars / chordCount))
  const ticksPerChord = barsPerChord * TICKS_PER_BAR

  // Chord voicing octave: sit below melody (octave 3 = C3–B3)
  const chordOctave = 3

  const notes: MidiNote[] = []
  let currentTick = 0
  const totalTicks = params.bars * TICKS_PER_BAR

  // Cycle through the progression to fill all bars
  let degreeIndex = 0
  while (currentTick < totalTicks) {
    const degree = degreeSequence[degreeIndex % degreeSequence.length]
    const pitches = buildChord(
      degree,
      params.key.root,
      params.key.mode,
      chordOctave,
      vibe.prefer7ths,
    )

    const chordEnd = Math.min(currentTick + ticksPerChord, totalTicks)
    const durationTicks = Math.round((chordEnd - currentTick) * vibe.noteDurationRatio)

    for (const pitch of pitches) {
      const velocity = varyVelocity(vibe.baseVelocity - 10, vibe.velocityVariance, rng)
      notes.push({ pitch, startTick: currentTick, durationTicks, velocity })
    }

    currentTick = chordEnd
    degreeIndex++
  }

  return notes
}
