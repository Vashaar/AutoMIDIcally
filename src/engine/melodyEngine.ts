/**
 * melodyEngine.ts
 *
 * Generates a monophonic (single-note) melodic line.
 *
 * Strategy:
 *  1. Divide the pattern into a grid of steps (subdivision from vibe).
 *  2. For each step, decide: rest or note?
 *  3. If note, choose pitch via a biased random walk through the scale —
 *     small intervals are preferred to large leaps (voice-leading).
 *  4. Apply vibe swing to even-indexed 16th-note steps.
 *  5. Vary velocity per note for humanisation.
 */

import type { GenerationParams, MidiNote } from '../types/midi'
import { TICKS_PER_BAR, TICKS_PER_QUARTER } from '../types/midi'
import type { VibeConfig } from '../types/midi'
import {
  getScaleNotes,
  createSeededRandom,
  varyVelocity,
} from './scaleUtils'

/** Maximum interval leap (in scale degrees) preferred for voice leading */
const MAX_PREFERRED_LEAP = 3

export function generateMelody(params: GenerationParams, vibe: VibeConfig): MidiNote[] {
  const rng = createSeededRandom(
    params.key.root * 100 + params.bpm + params.bars * 7 + params.noteDensity * 13,
  )

  // Pull scale notes in a playable melodic range (octaves 4–6)
  const scaleNotes = getScaleNotes(params.key.root, params.key.mode, 4, 6)

  const stepsPerBar = vibe.subdivision
  const totalSteps = stepsPerBar * params.bars
  const stepTicks = (TICKS_PER_BAR / stepsPerBar)
  const noteDuration = Math.round(stepTicks * vibe.noteDurationRatio)

  // Density gate: each step has a base probability of receiving a note
  const densityGate = 0.2 + (params.noteDensity / 10) * 0.7

  const notes: MidiNote[] = []
  let lastDegreeIndex = Math.floor(scaleNotes.length / 2) // start near the middle

  for (let step = 0; step < totalSteps; step++) {
    // Decide whether to place a note
    const isRest = rng() < vibe.restProbability || rng() > densityGate
    if (isRest) continue

    // Swing: push even-indexed 8th/16th notes forward in time
    const swingOffset = vibe.subdivision >= 16 && step % 2 === 1
      ? Math.round(TICKS_PER_QUARTER / 6 * vibe.swing)
      : 0

    // Syncopation: occasionally shift a note one step earlier
    const syncopationShift = rng() < vibe.syncopationProbability
      ? -Math.round(stepTicks * 0.25)
      : 0

    const startTick = Math.max(0, step * stepTicks + swingOffset + syncopationShift)

    // Voice leading: prefer small interval steps over large leaps
    const newDegreeIndex = pickNextDegree(lastDegreeIndex, scaleNotes.length, rng)
    lastDegreeIndex = newDegreeIndex

    const pitch = scaleNotes[newDegreeIndex]
    const velocity = varyVelocity(vibe.baseVelocity, vibe.velocityVariance, rng)

    notes.push({ pitch, startTick, durationTicks: noteDuration, velocity })
  }

  return notes
}

/** Biased random walk: prefer steps ≤ MAX_PREFERRED_LEAP scale degrees. */
function pickNextDegree(current: number, total: number, rng: () => number): number {
  // 70% chance: small step; 30% chance: free jump
  if (rng() < 0.7) {
    const maxLeap = Math.min(MAX_PREFERRED_LEAP, total - 1)
    const delta = Math.round((rng() * 2 - 1) * maxLeap)
    return Math.max(0, Math.min(total - 1, current + delta))
  }
  return Math.floor(rng() * total)
}

