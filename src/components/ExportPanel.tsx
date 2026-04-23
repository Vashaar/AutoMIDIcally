import type { GeneratedPattern } from '../types/midi'
import { downloadMidi } from '../engine/midiGenerator'

interface Props {
  pattern: GeneratedPattern | null
  onRegenerate: () => void
  isGenerating: boolean
}

export function ExportPanel({ pattern, onRegenerate, isGenerating }: Props) {
  const canExport = !!pattern && pattern.notes.length > 0 && !isGenerating

  const filename = pattern
    ? `automidically_${pattern.params.patternType}_${pattern.params.key.label.replace(/\s+/g, '_').replace(/#/g, 'sharp')}_${pattern.params.bpm}bpm.mid`
    : 'automidically.mid'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Regenerate */}
      <button
        onClick={onRegenerate}
        disabled={isGenerating}
        aria-label="Generate a new pattern variation"
        className={[
          'flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04]',
          'px-4 py-2.5 text-sm font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          isGenerating
            ? 'cursor-not-allowed text-gray-600'
            : 'text-gray-300 hover:border-accent/40 hover:text-white active:scale-[0.98]',
        ].join(' ')}
      >
        <RefreshIcon spinning={isGenerating} />
        Regenerate
      </button>

      {/* Export */}
      <button
        onClick={() => pattern && downloadMidi(pattern)}
        disabled={!canExport}
        aria-label={`Download ${filename}`}
        className={[
          'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          canExport
            ? 'bg-accent text-surface-950 shadow-[0_0_24px_rgba(24,215,212,0.25)] hover:bg-accent-hover active:scale-[0.98]'
            : 'cursor-not-allowed bg-surface-600 text-gray-600',
        ].join(' ')}
      >
        <DownloadIcon />
        Export .mid
      </button>

      {pattern && (
        <span className="min-w-0 break-all font-mono text-[11px] text-gray-500 sm:ml-1">{filename}</span>
      )}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path d="M8 1v8.5M5 7l3 3 3-3M2 12v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V12"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" className={['h-4 w-4', spinning ? 'animate-spin' : ''].join(' ')}
    >
      <path d="M13.5 8A5.5 5.5 0 112.5 8" />
      <path d="M13.5 4v4h-4" />
    </svg>
  )
}
