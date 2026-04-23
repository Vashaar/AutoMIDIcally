/**
 * drumEngine.ts
 *
 * Generates a 16-step drum pattern using the GM drum map.
 *
 * Architecture:
 *  - Patterns are represented as 16-step boolean arrays per drum voice.
 *  - Template patterns encode genre-typical rhythms (kick/snare placement).
 *  - Hi-hats are filled procedurally based on vibe density/swing.
 *  - Bars are repeated with slight variation each repeat (fills, ghost notes).
 */

import type { GenerationParams, MidiNote } from '../types/midi'
import { GM_DRUM, TICKS_PER_SIXTEENTH } from '../types/midi'
import type { VibeConfig } from '../types/midi'
import { createSeededRandom, varyVelocity } from './scaleUtils'

/** 16 steps = one bar of 16th notes */
type StepGrid = readonly boolean[]

interface DrumVoice {
  pitch: number
  baseVelocity: number
  steps: StepGrid
}

// ─── Rhythm templates (one bar, 16 steps) ────────────────────────────────────

/** Standard four-on-the-floor kick pattern */
const KICK_FOUR_ON_FLOOR: StepGrid =
  [true,false,false,false, true,false,false,false, true,false,false,false, true,false,false,false]

/** Trap-style kick: steps 0, 3, 6, 8, 12 */
const KICK_TRAP: StepGrid =
  [true,false,false,true, false,false,true,false, true,false,false,false, true,false,false,false]

/** Standard backbeat snare (beats 2 and 4) */
const SNARE_BACKBEAT: StepGrid =
  [false,false,false,false, true,false,false,false, false,false,false,false, true,false,false,false]

/** Clap on 2 and 4 (same as backbeat) */
const CLAP_ON_2_4: StepGrid = SNARE_BACKBEAT

/** Jazz-style ride: dotted pattern */
const RIDE_JAZZ: StepGrid =
  [true,false,true,false, true,false,false,false, true,false,true,false, true,false,false,false]

/** Afro clave-derived hi-hat */
const HIHAT_AFRO: StepGrid =
  [true,false,true,true, false,true,false,true, true,false,true,true, false,true,false,true]

interface VibePattern {
  kick: StepGrid
  snare: StepGrid
  clap: StepGrid
  hihatClosed: StepGrid | null // null = generate procedurally
  hihatOpen: StepGrid
}

const VIBE_PATTERNS: Record<string, VibePattern> = {
  Cinematic: {
    kick: KICK_FOUR_ON_FLOOR,
    snare: SNARE_BACKBEAT,
    clap: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
    hihatClosed: null, // procedural, sparse
    hihatOpen: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
  },
  'Lo-fi': {
    kick:  [true,false,false,false, true,false,true,false, false,false,true,false, true,false,false,false],
    snare: SNARE_BACKBEAT,
    clap: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
    hihatClosed: null,
    hihatOpen: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false],
  },
  Hyperpop: {
    kick:  [true,false,true,false, false,true,false,false, true,false,false,true, false,false,true,false],
    snare: SNARE_BACKBEAT,
    clap: CLAP_ON_2_4,
    hihatClosed: null, // very dense
    hihatOpen: [false,false,false,true, false,false,true,false, false,false,true,false, false,true,false,false],
  },
  Afrobeats: {
    kick:  [true,false,false,false, false,false,true,false, false,true,false,false, false,false,false,false],
    snare: SNARE_BACKBEAT,
    clap: CLAP_ON_2_4,
    hihatClosed: HIHAT_AFRO,
    hihatOpen: [false,false,false,false,false,false,false,true, false,false,false,false,false,false,true,false],
  },
  Jazz: {
    kick:  [true,false,false,false, false,false,false,false, true,false,false,false, false,false,false,false],
    snare: [false,false,true,false, false,false,false,false, false,false,true,false, false,false,false,false],
    clap: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
    hihatClosed: RIDE_JAZZ,
    hihatOpen: [false,false,false,false,true,false,false,false, false,false,false,false,true,false,false,false],
  },
  'Dark Trap': {
    kick: KICK_TRAP,
    snare: SNARE_BACKBEAT,
    clap: CLAP_ON_2_4,
    hihatClosed: null, // 16th hi-hat roll
    hihatOpen: [false,false,false,false,false,false,false,true, false,false,false,false,false,false,false,true],
  },
}

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateDrums(params: GenerationParams, vibe: VibeConfig): MidiNote[] {
  const rng = createSeededRandom(
    params.key.root * 50 + params.bpm * 2 + params.bars * 5 + params.noteDensity * 17,
  )

  const pattern = VIBE_PATTERNS[vibe.name] ?? VIBE_PATTERNS['Lo-fi']
  const totalSteps = 16 * params.bars
  const notes: MidiNote[] = []

  // Density factor: scale how many hi-hats to fill in procedurally (1–10 → 0.3–1.0)
  const hihatFill = 0.3 + (params.noteDensity / 10) * 0.7

  // Build list of voices to render
  const voices: DrumVoice[] = [
    { pitch: GM_DRUM.KICK,        baseVelocity: 100, steps: pattern.kick },
    { pitch: GM_DRUM.SNARE,       baseVelocity: 90,  steps: pattern.snare },
    { pitch: GM_DRUM.CLAP,        baseVelocity: 85,  steps: pattern.clap },
    { pitch: GM_DRUM.OPEN_HIHAT,  baseVelocity: 75,  steps: pattern.hihatOpen },
  ]

  // Add closed hi-hat (template or procedural)
  const hihatSteps: boolean[] = pattern.hihatClosed
    ? [...pattern.hihatClosed]
    : generateHihatSteps(hihatFill, vibe.subdivision, rng)

  voices.push({ pitch: GM_DRUM.CLOSED_HIHAT, baseVelocity: 70, steps: hihatSteps })

  for (const voice of voices) {
    for (let step = 0; step < totalSteps; step++) {
      const templateStep = step % 16 // loop the template every 16 steps
      if (!voice.steps[templateStep]) continue

      // Occasional variation on repeated bars (ghost notes, fill drops)
      const barIndex = Math.floor(step / 16)
      if (barIndex > 0 && rng() < 0.15) continue // subtle bar-to-bar variation

      const swingOffset = vibe.swing > 0 && step % 2 === 1
        ? Math.round(TICKS_PER_SIXTEENTH * vibe.swing * 0.5)
        : 0

      const startTick = step * TICKS_PER_SIXTEENTH + swingOffset
      const velocity = varyVelocity(voice.baseVelocity, vibe.velocityVariance * 0.5, rng)

      notes.push({
        pitch: voice.pitch,
        startTick,
        durationTicks: TICKS_PER_SIXTEENTH,
        velocity,
      })
    }
  }

  return notes
}

/** Generates a procedural hi-hat pattern based on fill density and subdivision. */
function generateHihatSteps(fillFactor: number, subdivision: 4 | 8 | 16, rng: () => number): boolean[] {
  const steps = new Array<boolean>(16).fill(false)
  // Determine which steps are "on-grid" for the chosen subdivision
  const stride = 16 / subdivision // e.g. stride=1 for 16th, stride=2 for 8th
  for (let i = 0; i < 16; i += stride) {
    steps[i] = rng() < fillFactor
  }
  return steps
}
