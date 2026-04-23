import { useMidiGeneration } from './hooks/useMidiGeneration'
import { useAudioPreview } from './hooks/useAudioPreview'
import { PatternTypeSelector } from './components/PatternTypeSelector'
import { ParameterPanel } from './components/ParameterPanel'
import { PianoRoll } from './components/PianoRoll'
import { AudioPreview } from './components/AudioPreview'
import { ExportPanel } from './components/ExportPanel'

export default function App() {
  const {
    params, pattern, isGenerating,
    setPatternType, setKey, setBpm, setBars, setNoteDensity, setVibe,
    regenerate,
  } = useMidiGeneration()

  const { playState, startPlayback, stopPlayback } = useAudioPreview()

  function handlePlay() {
    if (pattern) startPlayback(pattern)
  }

  return (
    <div className="min-h-screen bg-surface-900 text-gray-100">
      {/* ── Header */}
      <header className="border-b border-surface-600 bg-surface-800/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <img src="/logo.png" alt="AutoMIDIcally logo" className="h-9 w-9 rounded-lg object-cover" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-white">
              AutoMIDIcally
            </h1>
            <p className="text-[11px] text-gray-500">AI-powered MIDI pattern generator</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
              Phase 1
            </span>
          </div>
        </div>
      </header>

      {/* ── Main layout */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">

          {/* ── Left panel: controls */}
          <aside className="flex flex-col gap-5">
            <div className="rounded-xl border border-surface-600 bg-surface-800 p-4">
              <PatternTypeSelector
                value={params.patternType}
                onChange={type => {
                  // Stop audio when switching types
                  if (playState === 'playing') stopPlayback()
                  setPatternType(type)
                }}
              />
            </div>

            <div className="rounded-xl border border-surface-600 bg-surface-800 p-4">
              <ParameterPanel
                params={params}
                onKeyChange={setKey}
                onBpmChange={setBpm}
                onBarsChange={setBars}
                onDensityChange={setNoteDensity}
                onVibeChange={setVibe}
              />
            </div>
          </aside>

          {/* ── Right panel: preview + export */}
          <div className="flex flex-col gap-5">
            {/* Piano roll */}
            <div className="rounded-xl border border-surface-600 bg-surface-800 p-4">
              <PianoRoll pattern={pattern} isGenerating={isGenerating} />
            </div>

            {/* Stats bar */}
            {pattern && !isGenerating && (
              <div className="flex flex-wrap gap-4 rounded-xl border border-surface-600 bg-surface-800 px-4 py-3 text-xs text-gray-500">
                <Stat label="Notes" value={pattern.notes.length} />
                <Stat label="Key" value={pattern.params.key.label} />
                <Stat label="BPM" value={pattern.params.bpm} />
                <Stat label="Bars" value={pattern.params.bars} />
                <Stat label="Vibe" value={pattern.params.vibe} />
                <Stat label="Density" value={pattern.params.noteDensity} />
              </div>
            )}

            {/* Audio + Export */}
            <div className="rounded-xl border border-surface-600 bg-surface-800 p-4">
              <div className="flex flex-col gap-4">
                <AudioPreview
                  pattern={pattern}
                  playState={playState}
                  onPlay={handlePlay}
                  onStop={stopPlayback}
                />
                <div className="h-px bg-surface-600" />
                <ExportPanel
                  pattern={pattern}
                  onRegenerate={regenerate}
                  isGenerating={isGenerating}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer */}
      <footer className="mt-8 border-t border-surface-700 py-4 text-center text-[11px] text-gray-700">
        AutoMIDIcally · Built with React + Tone.js + @tonejs/midi
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-600">{label}:</span>
      <span className="font-mono font-medium text-gray-400">{value}</span>
    </div>
  )
}
