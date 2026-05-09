import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Music2, Pause, Play, Volume2, Wifi, WifiOff } from 'lucide-react'
import { fetchHealth, fetchPlayback, pausePlayback, resumePlayback, type PlaybackState } from '../api/client'

function msToTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function ProgressBar({ playback }: { playback: PlaybackState }) {
  const pct = playback.duration_ms > 0
    ? Math.min(100, (playback.progress_ms / playback.duration_ms) * 100)
    : 0
  return (
    <div className="w-full mt-3">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{msToTime(playback.progress_ms)}</span>
        <span>{msToTime(playback.duration_ms)}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function NowPlaying({ playback }: { playback: PlaybackState }) {
  const qc = useQueryClient()
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['playback'] })
  const pauseMut = useMutation({ mutationFn: pausePlayback, onSuccess })
  const resumeMut = useMutation({ mutationFn: resumePlayback, onSuccess })

  const isPending = pauseMut.isPending || resumeMut.isPending
  const track = playback.item
  const albumArt = track?.album.images[0]?.url

  return (
    <div className="bg-slate-800 rounded-2xl p-6 flex flex-col gap-4 max-w-md w-full shadow-lg">
      {albumArt ? (
        <img src={albumArt} alt="Album art" className="w-full aspect-square rounded-xl object-cover shadow" />
      ) : (
        <div className="w-full aspect-square rounded-xl bg-slate-700 flex items-center justify-center">
          <Music2 className="text-slate-500" size={64} />
        </div>
      )}

      <div className="text-center">
        <p className="text-white font-semibold text-lg leading-tight truncate">
          {track?.name ?? 'Unknown track'}
        </p>
        <p className="text-slate-400 text-sm truncate">
          {track?.artists.map(a => a.name).join(', ') ?? '—'}
        </p>
        <p className="text-slate-500 text-xs mt-0.5 truncate">
          {track?.album.name ?? '—'}
        </p>
      </div>

      <ProgressBar playback={playback} />

      <div className="flex items-center justify-between text-slate-400 text-xs mt-1">
        <span className="flex items-center gap-1">
          <Volume2 size={13} />
          {playback.device?.volume_percent ?? '—'}%
        </span>
        <span className="truncate max-w-[60%] text-right">{playback.device?.name ?? '—'}</span>
      </div>

      <button
        onClick={() => playback.is_playing ? pauseMut.mutate() : resumeMut.mutate()}
        disabled={isPending}
        className="mt-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-full py-3 transition-colors"
      >
        {playback.is_playing ? <Pause size={18} /> : <Play size={18} />}
        {playback.is_playing ? 'Pause' : 'Resume'}
      </button>
    </div>
  )
}

export function Dashboard() {
  const { data: health, isError: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10_000,
    retry: false,
  })

  const { data: playback, isLoading } = useQuery({
    queryKey: ['playback'],
    queryFn: fetchPlayback,
    refetchInterval: 5_000,
    enabled: health?.authenticated === true,
    retry: false,
  })

  const authenticated = health?.authenticated ?? false

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <h1 className="text-2xl font-bold text-white">Now Playing</h1>

      {/* Connection status */}
      <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${
        healthError
          ? 'bg-red-900/40 text-red-400'
          : authenticated
            ? 'bg-green-900/40 text-green-400'
            : 'bg-yellow-900/40 text-yellow-400'
      }`}>
        {healthError
          ? <><WifiOff size={14} /> Cannot reach Pi API</>
          : authenticated
            ? <><Wifi size={14} /> Spotify connected · uptime {Math.floor((health?.uptime_seconds ?? 0) / 60)}m</>
            : <><WifiOff size={14} /> Spotify not authenticated</>
        }
      </div>

      {!authenticated && !healthError && (
        <p className="text-slate-400 text-sm text-center max-w-sm">
          Run <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">python setup_config.py --auth-only</code> on
          the Pi, then restart the API service.
        </p>
      )}

      {isLoading && authenticated && (
        <div className="text-slate-400 animate-pulse">Loading playback…</div>
      )}

      {playback !== undefined && playback !== null && (
        <NowPlaying playback={playback} />
      )}

      {playback === null && authenticated && !isLoading && (
        <div className="text-slate-500 text-sm">Nothing is playing right now.</div>
      )}
    </div>
  )
}
