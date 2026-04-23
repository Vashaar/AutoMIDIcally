/**
 * vibePresets.ts
 *
 * Each vibe encodes how a genre/mood affects rhythm, dynamics, and phrasing.
 * These values are consumed by every engine to shape the generated pattern.
 */

import type { VibeName, VibeConfig } from '../types/midi'

export const VIBE_PRESETS: Record<VibeName, VibeConfig> = {
  Cinematic: {
    name: 'Cinematic',
    // Slow, spacious — lots of rests, long notes, minimal syncopation
    syncopationProbability: 0.1,
    velocityVariance: 18,
    baseVelocity: 72,
    noteDurationRatio: 1.4,   // notes ring longer than their grid slot
    restProbability: 0.45,
    swing: 0,
    subdivision: 8,
    prefer7ths: true,
  },

  'Lo-fi': {
    name: 'Lo-fi',
    // Mellow, slightly swung, moderate density, soft velocities
    syncopationProbability: 0.25,
    velocityVariance: 22,
    baseVelocity: 62,
    noteDurationRatio: 0.95,
    restProbability: 0.35,
    swing: 0.18,
    subdivision: 16,
    prefer7ths: true,
  },

  Hyperpop: {
    name: 'Hyperpop',
    // Dense, straight, aggressive — very few rests, high velocity
    syncopationProbability: 0.4,
    velocityVariance: 30,
    baseVelocity: 100,
    noteDurationRatio: 0.55,  // short, punchy notes
    restProbability: 0.1,
    swing: 0,
    subdivision: 16,
    prefer7ths: false,
  },

  Afrobeats: {
    name: 'Afrobeats',
    // Heavy syncopation, swung 16ths, medium density, lively velocity
    syncopationProbability: 0.55,
    velocityVariance: 20,
    baseVelocity: 82,
    noteDurationRatio: 0.7,
    restProbability: 0.25,
    swing: 0.12,
    subdivision: 16,
    prefer7ths: true,
  },

  Jazz: {
    name: 'Jazz',
    // Heavy swing, lots of 7ths/extensions, moderate density
    syncopationProbability: 0.45,
    velocityVariance: 25,
    baseVelocity: 70,
    noteDurationRatio: 0.85,
    restProbability: 0.3,
    swing: 0.33,  // strong triplet swing
    subdivision: 8,
    prefer7ths: true,
  },

  'Dark Trap': {
    name: 'Dark Trap',
    // Sparse melody, heavy bass, straight 16ths, dramatic velocity shifts
    syncopationProbability: 0.3,
    velocityVariance: 35,
    baseVelocity: 88,
    noteDurationRatio: 0.6,
    restProbability: 0.5,    // intentionally sparse melody
    swing: 0,
    subdivision: 16,
    prefer7ths: false,
  },
}
