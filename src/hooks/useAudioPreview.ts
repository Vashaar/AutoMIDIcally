/**
 * useAudioPreview.ts
 *
 * Wraps Tone.js to provide in-browser MIDI playback.
 *
 * Architecture:
 *  - Synth instances are created once and reused.
 *  - Drum voices map GM drum pitches to membrane/metal synths.
 *  - On play(), schedule all notes into a Tone.js Part, then start Transport.
 *  - On stop(), cancel all events and stop Transport.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { GeneratedPattern } from '../types/midi'
import { GM_DRUM } from '../types/midi'
import { ticksToSeconds } from '../engine/midiGenerator'

// Lazy-load Tone.js so it doesn't block initial render
type ToneModule = typeof import('tone')

let toneCache: ToneModule | null = null
async function getTone(): Promise<ToneModule> {
  if (!toneCache) toneCache = await import('tone')
  return toneCache
}

export type PlayState = 'stopped' | 'playing' | 'loading'

export function useAudioPreview() {
  const [playState, setPlayState] = useState<PlayState>('stopped')
  const partsRef = useRef<import('tone').Part[]>([])
  const synthsRef = useRef<import('tone').PolySynth | null>(null)
  const drumSynthsRef = useRef<Map<number, import('tone').MembraneSynth | import('tone').MetalSynth>>(new Map())

  // ── Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopPlayback = useCallback(async () => {
    const Tone = await getTone()
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    for (const part of partsRef.current) {
      part.dispose()
    }
    partsRef.current = []
    setPlayState('stopped')
  }, [])

  const startPlayback = useCallback(async (pattern: GeneratedPattern) => {
    setPlayState('loading')

    try {
      const Tone = await getTone()
      await Tone.start() // resume AudioContext (required after user gesture)

      // Stop any existing playback
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      for (const part of partsRef.current) part.dispose()
      partsRef.current = []

      // Set tempo
      Tone.getTransport().bpm.value = pattern.params.bpm

      const isDrums = pattern.params.patternType === 'drums'

      if (isDrums) {
        // ── Drum synths
        if (drumSynthsRef.current.size === 0) {
          const drumMap = new Map<number, import('tone').MembraneSynth | import('tone').MetalSynth>()
          // Kick / toms → MembraneSynth
          for (const pitch of [GM_DRUM.KICK, GM_DRUM.TOM_HIGH, GM_DRUM.TOM_MID, GM_DRUM.TOM_LOW]) {
            const s = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4 }).toDestination()
            drumMap.set(pitch, s)
          }
          // Snare / clap / hats → MetalSynth
          for (const pitch of [GM_DRUM.SNARE, GM_DRUM.CLAP, GM_DRUM.CLOSED_HIHAT, GM_DRUM.OPEN_HIHAT, GM_DRUM.CRASH, GM_DRUM.RIDE]) {
            const resonance = pitch === GM_DRUM.CLOSED_HIHAT ? 400 : pitch === GM_DRUM.OPEN_HIHAT ? 200 : 300
            const decayTime = pitch === GM_DRUM.OPEN_HIHAT ? 0.4 : pitch === GM_DRUM.CLOSED_HIHAT ? 0.05 : 0.15
            const s = new Tone.MetalSynth({ resonance, envelope: { attack: 0.001, decay: decayTime, sustain: 0, release: 0.1 } }).toDestination()
            drumMap.set(pitch, s)
          }
          drumSynthsRef.current = drumMap
        }

        // Schedule drum notes
        const drumNotes = pattern.notes.map(note => ({
          time: ticksToSeconds(note.startTick, pattern.params.bpm),
          pitch: note.pitch,
          velocity: note.velocity / 127,
        }))

        const drumPart = new Tone.Part((time, event: { pitch: number; velocity: number }) => {
          const synth = drumSynthsRef.current.get(event.pitch)
          if (!synth) return
          if (synth instanceof Tone.MembraneSynth) {
            const freq = drumPitchToFreq(event.pitch)
            synth.triggerAttackRelease(freq, '16n', time, event.velocity)
          } else {
            synth.triggerAttackRelease('16n', time, event.velocity)
          }
        }, drumNotes)

        drumPart.start(0)
        partsRef.current.push(drumPart as unknown as import('tone').Part)
      } else {
        // ── Melodic synth
        if (!synthsRef.current) {
          synthsRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 },
          }).toDestination()
        }

        const melNotes = pattern.notes.map(note => ({
          time: ticksToSeconds(note.startTick, pattern.params.bpm),
          duration: ticksToSeconds(note.durationTicks, pattern.params.bpm),
          note: note.pitch,
          velocity: note.velocity / 127,
        }))

        const melPart = new Tone.Part(
          (time, event: { note: number; duration: number; velocity: number }) => {
            synthsRef.current!.triggerAttackRelease(
              Tone.Frequency(event.note, 'midi').toFrequency(),
              event.duration,
              time,
              event.velocity,
            )
          },
          melNotes,
        )
        melPart.start(0)
        partsRef.current.push(melPart as unknown as import('tone').Part)
      }

      // Calculate total duration and loop
      const totalSeconds = ticksToSeconds(pattern.totalTicks, pattern.params.bpm)
      Tone.getTransport().loopStart = 0
      Tone.getTransport().loopEnd = totalSeconds
      Tone.getTransport().loop = true
      Tone.getTransport().start()

      setPlayState('playing')
    } catch (err) {
      console.error('Audio preview error:', err)
      setPlayState('stopped')
    }
  }, [])

  return { playState, startPlayback, stopPlayback }
}

/** Map GM drum pitches to approximate playable frequencies for MembraneSynth. */
function drumPitchToFreq(pitch: number): string {
  switch (pitch) {
    case GM_DRUM.KICK:     return 'C1'
    case GM_DRUM.TOM_LOW:  return 'E1'
    case GM_DRUM.TOM_MID:  return 'A1'
    case GM_DRUM.TOM_HIGH: return 'D2'
    default:               return 'C2'
  }
}
