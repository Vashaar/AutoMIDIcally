/**
 * bassEngine.ts
 *
 * Generates a bass line driven by the chord progression root notes,
 * with passing tones drawn from the scale.
 *
 * Strategy:
 *  1. Follow the same chord progression as chordEngine (same degree sequence).
 *  2. For each chord block, generate a bass phrase: root → passing tone → root.
 *  3. Keep bass notes in octave 2 (deep sub-bass region, MIDI 24–47).
 *  4. Passing tones are chosen from adjacent scale notes (smooth voice leading).
 */

import type { GenerationParams, MidiNote } from '../types/midi'
import { TICKS_PER_BAR, TICKS_PER_SIXTEENTH } from '../types/midi'
import type { VibeConfig } from '../types/midi'
import {
  getScaleNotes,
  buildChord,
  createSeededRandom,
  varyVelocity,
} from './scaleUtils'

const VIBE_PROGRESSION_MAP: Record<string, number[]> = {
  Cinematic:   [0, 5, 2, 6],
  'Lo-fi':     [0, 4, 5, 3],
  Hyperpop:    [0, 4],
  Afrobeats:   [0, 3, 0, 4],
  Jazz:        [1, 4, 0],
  'Dark Trap': [0, 3, 0, 4],
}

export function generateBass(params: GenerationParams, vibe: VibeConfig): MidiNote[] {
  const rng = createSeededRandom(
    params.key.root * 300 + params.bpm * 7 + params.bars * 3 + params.noteDensity * 23,
  )

  // Bass scale range: octaves 2–3 (MIDI 24–47)
  const bassNotes = getScaleNotes(params.key.root, params.key.mode, 2, 3)

  const degreeSequence = VIBE_PROGRESSION_MAP[vibe.name] ?? [0, 4, 5, 3]
  const chordCount = degreeSequence.length
  const barsPerChord = Math.max(1, Math.round(params.bars / chordCount))
  const ticksPerChord = barsPerChord * TICKS_PER_BAR
  const totalTicks = params.bars * TICKS_PER_BAR

  // Density: steps per chord block for bass rhythm
  const stepsPerChord = Math.round(barsPerChord * 4 * (0.3 + (params.noteDensity / 10) * 0.7))

  const notes: MidiNote[] = []
  let currentTick = 0
  let degreeIndex = 0

  while (currentTick < totalTicks) {
    const degree = degreeSequence[degreeIndex % degreeSequence.length]
    const chordEnd = Math.min(currentTick + ticksPerChord, totalTicks)
    const blockTicks = chordEnd - currentTick

    // Get the root pitch for this chord degree (lowest note of the chord, bass register)
    const chordPitches = buildChord(degree, params.key.root, params.key.mode, 2, false)
    const rootPitch = chordPitches[0] // root is always first

    // Place bass notes across this chord block
    const stepTicks = Math.round(blockTicks / stepsPerChord)

    for (let step = 0; step < stepsPerChord; step++) {
      const isRest = rng() < vibe.restProbability * 0.6 // bass is less sparse than melody
      if (isRest) continue

      const stepStart = currentTick + step * stepTicks

      // Choose pitch: root on strong beats, passing tones on weak beats
      let pitch: number
      if (step === 0 || step === Math.floor(stepsPerChord / 2)) {
        // Strong beat: always root note
        pitch = rootPitch
      } else {
        // Weak beat: passing tone from adjacent scale note
        pitch = pickPassingTone(rootPitch, bassNotes, rng)
      }

      const swingOffset = vibe.swing > 0 && step % 2 === 1
        ? Math.round(TICKS_PER_SIXTEENTH * vibe.swing * 0.4)
        : 0

      const durationTicks = Math.round(stepTicks * vibe.noteDurationRatio * 0.8)
      const velocity = varyVelocity(vibe.baseVelocity + 5, vibe.velocityVariance, rng)

      notes.push({
        pitch,
        startTick: Math.max(0, stepStart + swingOffset),
        durationTicks,
        velocity,
      })
    }

    currentTick = chordEnd
    degreeIndex++
  }

  return notes
}

/**
 * Chooses a passing tone from the bass scale adjacent to the root pitch.
 * Passing tones are within 2 scale steps of the root.
 */
function pickPassingTone(rootPitch: number, bassNotes: number[], rng: () => number): number {
  const rootIndex = bassNotes.indexOf(rootPitch)
  if (rootIndex === -1) return rootPitch

  // Candidate passing tones: 1 or 2 scale steps away
  const candidates: number[] = []
  for (const offset of [-2, -1, 1, 2]) {
    const idx = rootIndex + offset
    if (idx >= 0 && idx < bassNotes.length) {
      candidates.push(bassNotes[idx])
    }
  }

  if (candidates.length === 0) return rootPitch
  return candidates[Math.floor(rng() * candidates.length)]
}

