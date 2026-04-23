// ─── Pattern types ────────────────────────────────────────────────────────────

export type PatternType = 'melody' | 'chords' | 'drums' | 'bass'

// ─── Keys ─────────────────────────────────────────────────────────────────────

/** Chromatic root note 0 = C, 1 = C#/Db … 11 = B */
export type RootNote = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export type ScaleMode = 'major' | 'minor'

export interface MusicalKey {
  root: RootNote
  mode: ScaleMode
  /** Display label e.g. "C Major", "F# Minor" */
  label: string
}

// ─── Vibe presets ─────────────────────────────────────────────────────────────

export type VibeName =
  | 'Cinematic'
  | 'Lo-fi'
  | 'Hyperpop'
  | 'Afrobeats'
  | 'Jazz'
  | 'Dark Trap'

export interface VibeConfig {
  name: VibeName
  /** 0–1 probability of placing a note on an off-beat (syncopation) */
  syncopationProbability: number
  /** ±velocity added/subtracted per note for humanisation */
  velocityVariance: number
  /** Base MIDI velocity (0–127) */
  baseVelocity: number
  /** Fraction of a beat that a note lasts (e.g. 0.9 = near-legato) */
  noteDurationRatio: number
  /** 0–1 probability of a rest instead of a note at each grid step */
  restProbability: number
  /** Swing factor 0 = straight, 0.5 = full triplet swing */
  swing: number
  /** Preferred note grid subdivision: 4 = quarter, 8 = eighth, 16 = sixteenth */
  subdivision: 4 | 8 | 16
  /** Whether to prefer 7th chord voicings over triads */
  prefer7ths: boolean
}

// ─── Generation parameters ────────────────────────────────────────────────────

export interface GenerationParams {
  patternType: PatternType
  key: MusicalKey
  bpm: number
  bars: number
  /** 1 = sparse … 10 = dense */
  noteDensity: number
  vibe: VibeName
}

// ─── Internal note representation ────────────────────────────────────────────

/** Pulses per quarter note — standard DAW resolution */
export const PPQ = 480

/** One bar in ticks (4/4 time) */
export const TICKS_PER_BAR = PPQ * 4

/** One 16th note in ticks */
export const TICKS_PER_SIXTEENTH = PPQ / 4

/** One eighth note in ticks */
export const TICKS_PER_EIGHTH = PPQ / 2

/** One quarter note in ticks */
export const TICKS_PER_QUARTER = PPQ

export interface MidiNote {
  pitch: number
  startTick: number
  durationTicks: number
  velocity: number
}

/** A chord is simply a simultaneous cluster of notes */
export type MidiChord = MidiNote[]

// ─── GM drum map constants ────────────────────────────────────────────────────

export const GM_DRUM = {
  KICK: 36,
  SNARE: 38,
  CLAP: 39,
  CLOSED_HIHAT: 42,
  OPEN_HIHAT: 46,
  CRASH: 49,
  RIDE: 51,
  TOM_HIGH: 50,
  TOM_MID: 47,
  TOM_LOW: 41,
} as const

// ─── MIDI channel assignments ─────────────────────────────────────────────────

export const MIDI_CHANNELS = {
  MELODY: 0,
  CHORDS: 1,
  BASS: 2,
  DRUMS: 9, // Channel 10 (0-indexed) is GM drums
} as const

// ─── Generated pattern ────────────────────────────────────────────────────────

export interface GeneratedPattern {
  notes: MidiNote[]
  params: GenerationParams
  totalTicks: number
}
