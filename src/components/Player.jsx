import React from 'react';
import { Play, Pause, Eye, EyeOff, SkipForward, Music } from 'lucide-react';

export default function Player({
  trackInfo,
  isPlaying,
  revealed,
  onTogglePlayback,
  onReveal,
  onScanNext,
}) {
  const albumArt = trackInfo?.album?.images?.[0]?.url;
  const trackName = trackInfo?.name ?? '–';
  const artistNames = trackInfo?.artists?.map((a) => a.name).join(', ') ?? '–';
  const releaseYear = trackInfo?.album?.release_date?.substring(0, 4) ?? '–';

  return (
    <div className="flex flex-col items-center w-full">
      {/* Album art / mystery box */}
      <div className="relative w-52 h-52 mb-7 rounded-3xl overflow-hidden shadow-2xl">
        {revealed && albumArt ? (
          <img
            src={albumArt}
            alt={`${trackName} album cover`}
            className="w-full h-full object-cover animate-fade-in"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-slate-700/60 flex items-center justify-center border border-slate-600">
              <Music size={28} className="text-slate-500" />
            </div>
            <span className="text-slate-600 font-bold tracking-widest text-xs uppercase mt-1">Mystery Song</span>
          </div>
        )}

        {/* Playing indicator ring */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/60 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Play / Pause */}
      <button
        onClick={onTogglePlayback}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-20 h-20 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-900 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg shadow-emerald-500/30 animate-pulse-glow mb-8"
      >
        {isPlaying ? (
          <Pause size={32} fill="currentColor" />
        ) : (
          <Play size={32} fill="currentColor" className="ml-1" />
        )}
      </button>

      {/* Track info panel */}
      <div className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 p-5 text-center mb-4 min-h-[100px] flex flex-col justify-center">
        {revealed && trackInfo ? (
          <div className="animate-slide-up">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">{artistNames}</p>
            <h2 className="text-white font-bold text-xl leading-tight mb-3">{trackName}</h2>
            <span className="badge">Released: {releaseYear}</span>
          </div>
        ) : (
          <p className="text-slate-600 text-sm flex items-center justify-center gap-2">
            <EyeOff size={16} />
            Song details are hidden
          </p>
        )}
      </div>

      {/* Reveal button */}
      <button
        onClick={onReveal}
        className={`w-full py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 mb-3 active:scale-95 ${
          revealed
            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg'
        }`}
      >
        {revealed ? <><EyeOff size={20} /> Hide Answer</> : <><Eye size={20} /> Reveal Answer</>}
      </button>

      {/* Scan next */}
      <button onClick={onScanNext} className="btn-ghost">
        <SkipForward size={18} />
        Scan Next Card
      </button>
    </div>
  );
}
