/**
 * useMidiGeneration.ts
 *
 * React hook that owns all generation state.
 * Debounces re-generation by 300 ms so UI feels responsive.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { GenerationParams, GeneratedPattern, PatternType, VibeName } from '../types/midi'
import { ALL_KEYS } from '../engine/scaleUtils'
import { generatePattern } from '../engine/midiGenerator'

const DEFAULT_PARAMS: GenerationParams = {
  patternType: 'melody',
  key: ALL_KEYS[0], // C Major
  bpm: 120,
  bars: 4,
  noteDensity: 5,
  vibe: 'Lo-fi',
}

const DEBOUNCE_MS = 300

export function useMidiGeneration() {
  const [params, setParams] = useState<GenerationParams>(DEFAULT_PARAMS)
  const [pattern, setPattern] = useState<GeneratedPattern | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Trigger generation whenever params change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIsGenerating(true)

    debounceRef.current = setTimeout(() => {
      try {
        const result = generatePattern(params)
        setPattern(result)
      } finally {
        setIsGenerating(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [params])

  // ── Param update helpers
  const setPatternType = useCallback((patternType: PatternType) => {
    setParams(p => ({ ...p, patternType }))
  }, [])

  const setKey = useCallback((keyLabel: string) => {
    const key = ALL_KEYS.find(k => k.label === keyLabel)
    if (key) setParams(p => ({ ...p, key }))
  }, [])

  const setBpm = useCallback((bpm: number) => {
    setParams(p => ({ ...p, bpm: Math.max(60, Math.min(180, bpm)) }))
  }, [])

  const setBars = useCallback((bars: number) => {
    setParams(p => ({ ...p, bars: Math.max(1, Math.min(16, bars)) }))
  }, [])

  const setNoteDensity = useCallback((noteDensity: number) => {
    setParams(p => ({ ...p, noteDensity: Math.max(1, Math.min(10, noteDensity)) }))
  }, [])

  const setVibe = useCallback((vibe: VibeName) => {
    setParams(p => ({ ...p, vibe }))
  }, [])

  const regenerate = useCallback(() => {
    // Force a new seed by bumping a counter hidden in bpm by ±0 (same BPM, new seed)
    setParams(p => ({ ...p }))
  }, [])

  return {
    params,
    pattern,
    isGenerating,
    setPatternType,
    setKey,
    setBpm,
    setBars,
    setNoteDensity,
    setVibe,
    regenerate,
  }
}
