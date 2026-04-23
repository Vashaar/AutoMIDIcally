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
    <div className="min-h-screen text-gray-100">
      <header className="border-b border-accent/10 bg-surface-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <img
            src="/logo-v2.png"
            alt="AutoMIDIcally logo"
            className="h-14 w-14 rounded-2xl object-cover shadow-[0_0_30px_rgba(24,215,212,0.28)]"
          />
          <div>
            <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">
              AutoMIDIcally
            </h1>
            <p className="text-xs font-medium text-accent/80">Local MIDI Pattern Studio</p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent sm:flex">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(24,215,212,0.9)]" />
            Desktop Ready
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="overflow-hidden rounded-[1.35rem] border border-accent/15 bg-surface-900/78 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent/80">Pattern Lab</p>
                <h2 className="mt-2 max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
                  Generate clean MIDI ideas without leaving the app.
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-center">
                <Stat label="Notes" value={pattern && !isGenerating ? pattern.notes.length : '--'} />
                <Stat label="BPM" value={params.bpm} />
                <Stat label="Bars" value={params.bars} />
              </div>
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-violetglow-light/20 bg-violetglow/15 p-5 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200/80">Session</p>
            <div className="mt-4 space-y-2 text-sm">
              <SessionRow label="Key" value={params.key.label} />
              <SessionRow label="Type" value={params.patternType} />
              <SessionRow label="Vibe" value={params.vibe} />
            </div>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
          <aside className="flex flex-col gap-5">
            <div className="rounded-[1.25rem] border border-accent/15 bg-surface-900/82 p-4 shadow-xl shadow-black/20 backdrop-blur">
              <PatternTypeSelector
                value={params.patternType}
                onChange={type => {
                  if (playState === 'playing') stopPlayback()
                  setPatternType(type)
                }}
              />
            </div>

            <div className="rounded-[1.25rem] border border-accent/15 bg-surface-900/82 p-4 shadow-xl shadow-black/20 backdrop-blur">
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

          <div className="flex flex-col gap-5">
            <div className="rounded-[1.25rem] border border-accent/15 bg-surface-900/82 p-4 shadow-xl shadow-black/20 backdrop-blur">
              <PianoRoll pattern={pattern} isGenerating={isGenerating} />
            </div>

            {pattern && !isGenerating && (
              <div className="flex flex-wrap gap-4 rounded-[1.25rem] border border-accent/15 bg-surface-900/72 px-4 py-3 text-xs text-gray-400 backdrop-blur">
                <Stat label="Key" value={pattern.params.key.label} />
                <Stat label="BPM" value={pattern.params.bpm} />
                <Stat label="Bars" value={pattern.params.bars} />
                <Stat label="Vibe" value={pattern.params.vibe} />
                <Stat label="Density" value={pattern.params.noteDensity} />
              </div>
            )}

            <div className="rounded-[1.25rem] border border-accent/15 bg-surface-900/82 p-4 shadow-xl shadow-black/20 backdrop-blur">
              <div className="flex flex-col gap-4">
                <AudioPreview
                  pattern={pattern}
                  playState={playState}
                  onPlay={handlePlay}
                  onStop={stopPlayback}
                />
                <div className="h-px bg-accent/10" />
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

      <footer className="border-t border-accent/10 py-4 text-center text-[11px] text-gray-500">
        AutoMIDIcally - React, Tone.js, Electron
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-w-16 flex-col">
      <span className="text-[10px] uppercase tracking-widest text-gray-500">{label}</span>
      <span className="font-mono text-sm font-semibold text-accent">{value}</span>
    </div>
  )
}

function SessionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-3 py-2">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold capitalize text-white">{value}</span>
    </div>
  )
}
