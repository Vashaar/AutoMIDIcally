import { describe, it, expect } from 'vitest'
import {
  getScaleNotes,
  getScaleDegrees,
  snapToScale,
  buildChord,
  createSeededRandom,
  varyVelocity,
  ALL_KEYS,
  SCALE_INTERVALS,
} from './scaleUtils'

describe('getScaleNotes', () => {
  it('returns 7 notes per octave in C Major across two octaves', () => {
    const notes = getScaleNotes(0, 'major', 4, 5)
    expect(notes.length).toBe(14)
  })

  it('C Major octave 4 starts at MIDI 60 (middle C)', () => {
    const notes = getScaleNotes(0, 'major', 4, 4)
    expect(notes[0]).toBe(60)
  })

  it('C Major scale degrees match W W H W W W H pattern', () => {
    // Span two octaves so the 7th interval (B→C) is captured
    const notes = getScaleNotes(0, 'major', 4, 5)
    const steps = notes.slice(1, 8).map((n, i) => n - notes[i])
    expect(steps).toEqual([2, 2, 1, 2, 2, 2, 1])
  })

  it('C Natural Minor scale degrees match W H W W H W W pattern', () => {
    const notes = getScaleNotes(0, 'minor', 4, 5)
    const steps = notes.slice(1, 8).map((n, i) => n - notes[i])
    expect(steps).toEqual([2, 1, 2, 2, 1, 2, 2])
  })

  it('returns notes in ascending order', () => {
    const notes = getScaleNotes(5, 'minor', 3, 5)
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i]).toBeGreaterThan(notes[i - 1])
    }
  })

  it('all returned pitches are in range 0–127', () => {
    for (const key of ALL_KEYS) {
      const notes = getScaleNotes(key.root, key.mode, 0, 10)
      for (const n of notes) {
        expect(n).toBeGreaterThanOrEqual(0)
        expect(n).toBeLessThanOrEqual(127)
      }
    }
  })
})

describe('getScaleDegrees', () => {
  it('returns 7 degrees', () => {
    expect(getScaleDegrees(0, 'major').length).toBe(7)
  })

  it('first degree is the root', () => {
    expect(getScaleDegrees(5, 'major')[0]).toBe(5)
    expect(getScaleDegrees(9, 'minor')[0]).toBe(9)
  })
})

describe('snapToScale', () => {
  it('leaves a note already in the scale unchanged', () => {
    // C major: C D E F G A B — MIDI 60 = C4, already in scale
    expect(snapToScale(60, 0, 'major')).toBe(60)
  })

  it('snaps a non-scale note to the nearest scale note', () => {
    // C# (61) in C Major should snap to C (60) or D (62) — whichever is nearer
    const snapped = snapToScale(61, 0, 'major')
    expect([60, 62]).toContain(snapped)
  })

  it('handles notes in all 24 keys without throwing', () => {
    for (const key of ALL_KEYS) {
      for (let pitch = 21; pitch <= 108; pitch++) {
        expect(() => snapToScale(pitch, key.root, key.mode)).not.toThrow()
      }
    }
  })
})

describe('buildChord', () => {
  it('builds a C Major triad correctly (C4 E4 G4)', () => {
    const chord = buildChord(0, 0, 'major', 4, false)
    expect(chord).toEqual([60, 64, 67])
  })

  it('builds a C Major 7th chord (C4 E4 G4 B4)', () => {
    const chord = buildChord(0, 0, 'major', 4, true)
    expect(chord).toEqual([60, 64, 67, 71])
  })

  it('builds a D minor triad on degree ii of C Major', () => {
    // Degree 1 (0-indexed) in C Major = D, quality = minor → D F A = 62 65 69
    const chord = buildChord(1, 0, 'major', 4, false)
    expect(chord).toEqual([62, 65, 69])
  })

  it('returns 4 notes when use7th is true', () => {
    for (let deg = 0; deg < 7; deg++) {
      const chord = buildChord(deg, 0, 'major', 4, true)
      expect(chord.length).toBe(4)
    }
  })

  it('all chord pitches are in 0–127', () => {
    for (const key of ALL_KEYS) {
      for (let deg = 0; deg < 7; deg++) {
        const chord = buildChord(deg, key.root, key.mode, 3, true)
        for (const p of chord) {
          expect(p).toBeGreaterThanOrEqual(0)
          expect(p).toBeLessThanOrEqual(127)
        }
      }
    }
  })
})

describe('createSeededRandom', () => {
  it('produces values in [0, 1)', () => {
    const rng = createSeededRandom(42)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('same seed produces same sequence', () => {
    const a = createSeededRandom(123)
    const b = createSeededRandom(123)
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b())
    }
  })

  it('different seeds produce different sequences', () => {
    const a = createSeededRandom(1)
    const b = createSeededRandom(2)
    const aVals = Array.from({ length: 10 }, () => a())
    const bVals = Array.from({ length: 10 }, () => b())
    expect(aVals).not.toEqual(bVals)
  })
})

describe('varyVelocity', () => {
  it('stays within 1–127', () => {
    const rng = createSeededRandom(99)
    for (let i = 0; i < 500; i++) {
      const v = varyVelocity(80, 40, rng)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(127)
    }
  })
})

describe('ALL_KEYS', () => {
  it('contains exactly 24 keys', () => {
    expect(ALL_KEYS.length).toBe(24)
  })

  it('covers all 12 chromatic roots in major and minor', () => {
    for (let root = 0; root < 12; root++) {
      expect(ALL_KEYS.some(k => k.root === root && k.mode === 'major')).toBe(true)
      expect(ALL_KEYS.some(k => k.root === root && k.mode === 'minor')).toBe(true)
    }
  })

  it('all labels are unique', () => {
    const labels = ALL_KEYS.map(k => k.label)
    expect(new Set(labels).size).toBe(24)
  })
})

describe('SCALE_INTERVALS', () => {
  it('major scale has 7 intervals starting at 0', () => {
    expect(SCALE_INTERVALS.major[0]).toBe(0)
    expect(SCALE_INTERVALS.major.length).toBe(7)
  })

  it('minor scale has 7 intervals starting at 0', () => {
    expect(SCALE_INTERVALS.minor[0]).toBe(0)
    expect(SCALE_INTERVALS.minor.length).toBe(7)
  })
})
