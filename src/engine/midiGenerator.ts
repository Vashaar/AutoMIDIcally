/**
 * midiGenerator.ts
 *
 * Orchestrates the pattern engines and serializes the result to a Type 1
 * MIDI file (multi-track) using @tonejs/midi.
 *
 * Track layout:
 *   Track 0 — Tempo + time signature (meta track)
 *   Track 1 — Pattern notes (melody / chords / bass)
 *   Track 2 — Drums (channel 9, GM drum map)  ← only for drum pattern type
 *
 * Type 1 MIDI is required for DAW compatibility; each voice on its own track.
 */

import { Midi } from '@tonejs/midi'
import type { GenerationParams, GeneratedPattern, MidiNote } from '../types/midi'
import { PPQ, TICKS_PER_BAR, MIDI_CHANNELS } from '../types/midi'
import { VIBE_PRESETS } from './vibePresets'
import { generateMelody } from './melodyEngine'
import { generateChords } from './chordEngine'
import { generateDrums } from './drumEngine'
import { generateBass } from './bassEngine'

// ─── Pattern generation ───────────────────────────────────────────────────────

/** Entry point: generate notes for the selected pattern type. */
export function generatePattern(params: GenerationParams): GeneratedPattern {
  const vibe = VIBE_PRESETS[params.vibe]
  const totalTicks = params.bars * TICKS_PER_BAR

  let notes: MidiNote[]
  switch (params.patternType) {
    case 'melody':
      notes = generateMelody(params, vibe)
      break
    case 'chords':
      notes = generateChords(params, vibe)
      break
    case 'drums':
      notes = generateDrums(params, vibe)
      break
    case 'bass':
      notes = generateBass(params, vibe)
      break
  }

  return { notes, params, totalTicks }
}

// ─── MIDI serialization ───────────────────────────────────────────────────────

/**
 * Converts a GeneratedPattern to a binary MIDI file (Uint8Array).
 * Returns a Uint8Array that can be written to a .mid file.
 */
export function serializeToMidi(pattern: GeneratedPattern): Uint8Array {
  const { notes, params } = pattern
  const midi = new Midi()

  // ── Header
  midi.header.setTempo(params.bpm)
  midi.header.timeSignatures.push({ ticks: 0, timeSignature: [4, 4] })
  // PPQ is read-only on Midi header after construction; @tonejs/midi defaults to 480

  const isDrums = params.patternType === 'drums'
  const channel = isDrums ? MIDI_CHANNELS.DRUMS : channelForType(params.patternType)

  // ── Main track
  const track = midi.addTrack()
  track.channel = channel
  track.name = `AutoMIDIcally ${params.patternType}`

  for (const note of notes) {
    const startSeconds = ticksToSeconds(note.startTick, params.bpm)
    const durationSeconds = ticksToSeconds(note.durationTicks, params.bpm)

    track.addNote({
      midi: note.pitch,
      time: startSeconds,
      duration: durationSeconds,
      velocity: note.velocity / 127,
    })
  }

  return midi.toArray()
}

/**
 * Triggers a browser download of the generated MIDI file.
 * Filename format: automidically_{patternType}_{key}_{bpm}bpm.mid
 */
export function downloadMidi(pattern: GeneratedPattern): void {
  const bytes = serializeToMidi(pattern)
  const blob = new Blob([bytes], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)

  const { params } = pattern
  const keyLabel = params.key.label.replace(/\s+/g, '_').replace(/#/g, 'sharp')
  const filename = `automidically_${params.patternType}_${keyLabel}_${params.bpm}bpm.mid`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function channelForType(type: GenerationParams['patternType']): number {
  switch (type) {
    case 'melody': return MIDI_CHANNELS.MELODY
    case 'chords': return MIDI_CHANNELS.CHORDS
    case 'bass':   return MIDI_CHANNELS.BASS
    case 'drums':  return MIDI_CHANNELS.DRUMS
  }
}

/** Convert MIDI ticks to seconds at the given BPM. */
export function ticksToSeconds(ticks: number, bpm: number): number {
  // 1 quarter note = 60/bpm seconds; PPQ ticks = 1 quarter note
  return (ticks / PPQ) * (60 / bpm)
}
