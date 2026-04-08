import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Link2, X, ArrowRight, QrCode } from 'lucide-react';

export default function Scanner({ extractSpotifyId, onTrackFound, onError }) {
  const [mode, setMode] = useState('idle');
  const [manualUrl, setManualUrl] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (mode !== 'scanning') return;

    let isMounted = true;
    const html5QrCode = new Html5Qrcode('qr-reader');

    html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 15,
        // By removing qrbox, the library scans the entire video feed!
        // This makes scanning drastically faster and more forgiving.
      },
      (decodedText) => {
        const id = extractSpotifyId(decodedText);
        if (id) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              if (isMounted) {
                setMode('idle');
                onTrackFound(id);
              }
            }).catch(console.error);
          }
        } else {
          onError('No valid Spotify track URL found on this QR code.');
        }
      },
      () => { /* ignore background scan noise */ }
    ).catch(() => {
      if (isMounted) {
        onError('Failed to start camera. Please check your browser permissions.');
        setMode('idle');
      }
    });

    scannerRef.current = html5QrCode;

    return () => {
      isMounted = false;
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => { });
      }
    };
  }, [mode, extractSpotifyId, onTrackFound, onError]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const id = extractSpotifyId(manualUrl.trim());
    if (id) {
      setManualUrl('');
      setMode('idle');
      onTrackFound(id);
    } else {
      onError('Invalid Spotify track URL. It should look like: https://open.spotify.com/track/123...');
    }
  };

  if (mode === 'scanning') {
    return (
      <div className="flex flex-col items-center w-full animate-fade-in">
        <h2 className="text-xl font-bold text-white mb-4">Scan Card</h2>

        {/* Sleek Native-App Camera Container */}
        <div className="relative w-full max-w-sm aspect-[4/5] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 mb-6">
          {/* Video Feed */}
          <div id="qr-reader" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>

          {/* Native Reticle Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none bg-black/20">
            <div className="relative w-56 h-56 rounded-2xl border-2 border-white/10 shadow-[0_0_0_999px_rgba(0,0,0,0.5)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>

              {/* Animated Laser Line */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,1)] animate-scan-line"></div>
            </div>
            <p className="mt-8 text-white/80 text-sm font-medium tracking-wide flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
              <QrCode size={16} className="text-emerald-400" />
              Position QR in frame
            </p>
          </div>
        </div>

        <button onClick={() => setMode('idle')} className="btn-secondary rounded-full max-w-sm">
          <X size={20} /> Cancel Scan
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700 shadow-lg">
        <Camera size={36} className="text-emerald-400" />
      </div>

      <h2 className="text-xl font-bold text-white mb-1">Ready to Play!</h2>
      <p className="text-slate-400 text-sm mb-8">Scan the QR code on your Groovageddon card to load a song.</p>

      <div className="w-full flex flex-col gap-3">
        <button onClick={() => setMode('scanning')} className="btn-primary">
          <Camera size={20} />
          Scan Groovageddon Card
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
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 animate-slide-up">
            <input
              type="url"
              autoFocus
              className="input"
              placeholder="https://open.spotify.com/track/..."
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