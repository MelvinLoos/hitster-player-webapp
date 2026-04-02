import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Link2, X, ArrowRight } from 'lucide-react';

export default function Scanner({ extractSpotifyId, onTrackFound, onError }) {
  const [mode, setMode] = useState('idle'); // 'idle' | 'scanning' | 'manual'
  const [manualUrl, setManualUrl] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (mode !== 'scanning') return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1, rememberLastUsedCamera: true },
      false
    );

    scanner.render(
      (decodedText) => {
        const id = extractSpotifyId(decodedText);
        if (id) {
          scanner.clear().then(() => {
            setMode('idle');
            onTrackFound(id);
          });
        } else {
          onError('No valid Spotify track URL found on this QR code.');
        }
      },
      () => { /* scan errors are benign */ }
    );

    scannerRef.current = scanner;
    return () => {
      scanner.clear().catch(() => {});
    };
  }, [mode]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const id = extractSpotifyId(manualUrl.trim());
    if (id) {
      setManualUrl('');
      setMode('idle');
      onTrackFound(id);
    } else {
      onError('Invalid Spotify track URL. It should look like: https://open.spotify.com/track/…');
    }
  };

  if (mode === 'scanning') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
          <div id="qr-reader" className="w-full" />
        </div>
        <button onClick={() => setMode('idle')} className="btn-ghost">
          <X size={18} /> Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-2">
      {/* Camera icon */}
      <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700 shadow-lg">
        <Camera size={36} className="text-emerald-400" />
      </div>

      <h2 className="text-xl font-bold text-white mb-1">Ready to Play!</h2>
      <p className="text-slate-400 text-sm mb-8">Scan the QR code on your Hitster card to load a song.</p>

      <div className="w-full flex flex-col gap-3">
        <button onClick={() => setMode('scanning')} className="btn-primary">
          <Camera size={20} />
          Scan Hitster Card
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-slate-900 text-slate-600 text-xs font-medium rounded-full border border-slate-800">
              or paste URL manually
            </span>
          </div>
        </div>

        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <input
              type="url"
              autoFocus
              className="input"
              placeholder="https://open.spotify.com/track/…"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode('idle')} className="btn-ghost flex-1 py-3">
                <X size={16} /> Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 py-3">
                <ArrowRight size={16} /> Load
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setMode('manual')} className="btn-ghost">
            <Link2 size={18} />
            Paste Spotify URL
          </button>
        )}
      </div>
    </div>
  );
}
