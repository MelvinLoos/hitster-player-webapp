import React from 'react';
import { LogIn, Music2 } from 'lucide-react';

export default function Login({ onLogin }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Vinyl disc illustration */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-4 border-slate-700 shadow-xl animate-spin-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
            <div className="w-4 h-4 rounded-full bg-slate-950" />
          </div>
        </div>
        {/* Groove rings */}
        {[40, 56, 72, 88].map((size) => (
          <div
            key={size}
            className="absolute rounded-full border border-slate-600/40"
            style={{
              width: size,
              height: size,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-2">Welcome to Groovageddon</h2>
      <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
        Connect your Spotify account to scan Groovageddon cards and control music playback right from this app.
      </p>

      <button onClick={onLogin} className="btn-primary">
        <LogIn size={20} />
        Connect with Spotify
      </button>

      <p className="mt-4 text-slate-600 text-xs leading-relaxed px-4">
        You'll be redirected to Spotify to authorize. Requires a <strong className="text-slate-500">Spotify Premium</strong> account for playback control.
      </p>
    </div>
  );
}
