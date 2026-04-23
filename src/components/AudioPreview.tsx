import type { GeneratedPattern } from '../types/midi'
import type { PlayState } from '../hooks/useAudioPreview'

interface Props {
  pattern: GeneratedPattern | null
  playState: PlayState
  onPlay: () => void
  onStop: () => void
}

export function AudioPreview({ pattern, playState, onPlay, onStop }: Props) {
  const disabled = !pattern || pattern.notes.length === 0

  return (
    <div className="flex items-center gap-3">
      {playState === 'stopped' ? (
        <button
          onClick={onPlay}
          disabled={disabled}
          aria-label="Play pattern"
          className={[
            'flex h-10 w-10 items-center justify-center rounded-full transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            disabled
              ? 'cursor-not-allowed bg-surface-600 text-gray-600'
              : 'bg-accent text-white hover:bg-accent-hover active:scale-95',
          ].join(' ')}
        >
          <PlayIcon />
        </button>
      ) : playState === 'loading' ? (
        <button
          disabled
          aria-label="Loading audio"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-600"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-accent" />
        </button>
      ) : (
        <button
          onClick={onStop}
          aria-label="Stop playback"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/80
            text-white transition-all hover:bg-red-600 active:scale-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <StopIcon />
        </button>
      )}

      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-300">
          {playState === 'playing' ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
              Playing…
            </span>
          ) : playState === 'loading' ? (
            'Loading audio engine…'
          ) : (
            'Preview'
          )}
        </span>
        <span className="text-xs text-gray-600">Tone.js in-browser synth</span>
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5 translate-x-px">
      <path d="M3 2.5v11l10-5.5L3 2.5z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <rect x="3" y="3" width="10" height="10" rx="1" />
    </svg>
  )
}
