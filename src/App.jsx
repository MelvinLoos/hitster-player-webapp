import React, { useState, useEffect, useRef } from 'react';
import {
  Music, Download, AlertCircle, LogIn, Camera, Link2,
  X, ArrowRight, Play, Pause, Eye, EyeOff, SkipForward
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Replace with your actual Spotify Client ID. 
// Do not use import.meta as it breaks the standalone compilation target.
const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const REDIRECT_URI = window.location.origin;
const SCOPES = 'user-modify-playback-state user-read-playback-state';
// ──────────────────────────────────────────────────────────────────────────────

// --- PKCE Auth Helpers ---
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};
// -------------------------

// --- Inlined Components (to comply with single-file requirements) ---

function Login({ onLogin }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-4 border-slate-700 shadow-xl animate-spin-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
            <div className="w-4 h-4 rounded-full bg-slate-950" />
          </div>
        </div>
        {[40, 56, 72, 88].map((size) => (
          <div
            key={size}
            className="absolute rounded-full border border-slate-600/40"
            style={{ width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-2">Welcome to Hitster</h2>
      <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
        Connect your Spotify account to scan Hitster cards and control music playback right from this app.
      </p>

      <button onClick={onLogin} className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
        <LogIn size={20} />
        Connect with Spotify
      </button>

      <p className="mt-4 text-slate-600 text-xs leading-relaxed px-4">
        You'll be redirected to Spotify to authorize. Requires a <strong className="text-slate-500">Spotify Premium</strong> account for playback control.
      </p>
    </div>
  );
}

function Scanner({ extractSpotifyId, onTrackFound, onError }) {
  const [mode, setMode] = useState('idle');
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
    return () => { scanner.clear().catch(() => { }); };
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
        <button onClick={() => setMode('idle')} className="w-full border border-slate-700 hover:bg-slate-800 active:scale-95 text-slate-300 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
          <X size={18} /> Cancel
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
      <p className="text-slate-400 text-sm mb-8">Scan the QR code on your Hitster card to load a song.</p>

      <div className="w-full flex flex-col gap-3">
        <button onClick={() => setMode('scanning')} className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
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
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-200"
              placeholder="https://open.spotify.com/track/…"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode('idle')} className="w-full border border-slate-700 hover:bg-slate-800 active:scale-95 text-slate-300 font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 flex-1 py-3">
                <X size={16} /> Cancel
              </button>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 flex-1 py-3">
                <ArrowRight size={16} /> Load
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setMode('manual')} className="w-full border border-slate-700 hover:bg-slate-800 active:scale-95 text-slate-300 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
            <Link2 size={18} />
            Paste Spotify URL
          </button>
        )}
      </div>
    </div>
  );
}

function Player({ trackInfo, isPlaying, revealed, onTogglePlayback, onReveal, onScanNext }) {
  const albumArt = trackInfo?.album?.images?.[0]?.url;
  const trackName = trackInfo?.name ?? '–';
  const artistNames = trackInfo?.artists?.map((a) => a.name).join(', ') ?? '–';
  const releaseYear = trackInfo?.album?.release_date?.substring(0, 4) ?? '–';

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-52 h-52 mb-7 rounded-3xl overflow-hidden shadow-2xl">
        {revealed && albumArt ? (
          <img src={albumArt} alt={`${trackName} album cover`} className="w-full h-full object-cover animate-fade-in" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-slate-700/60 flex items-center justify-center border border-slate-600">
              <Music size={28} className="text-slate-500" />
            </div>
            <span className="text-slate-600 font-bold tracking-widest text-xs uppercase mt-1">Mystery Song</span>
          </div>
        )}

        {isPlaying && (
          <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/60 animate-pulse pointer-events-none" />
        )}
      </div>

      <button
        onClick={onTogglePlayback}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-20 h-20 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-900 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg shadow-emerald-500/30 animate-pulse-glow mb-8"
      >
        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
      </button>

      <div className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 p-5 text-center mb-4 min-h-[100px] flex flex-col justify-center">
        {revealed && trackInfo ? (
          <div className="animate-slide-up">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">{artistNames}</p>
            <h2 className="text-white font-bold text-xl leading-tight mb-3">{trackName}</h2>
            <span className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700 font-mono">Released: {releaseYear}</span>
          </div>
        ) : (
          <p className="text-slate-600 text-sm flex items-center justify-center gap-2">
            <EyeOff size={16} /> Song details are hidden
          </p>
        )}
      </div>

      <button
        onClick={onReveal}
        className={`w-full py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 mb-3 active:scale-95 ${revealed ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg'
          }`}
      >
        {revealed ? <><EyeOff size={20} /> Hide Answer</> : <><Eye size={20} /> Reveal Answer</>}
      </button>

      <button onClick={onScanNext} className="w-full border border-slate-700 hover:bg-slate-800 active:scale-95 text-slate-300 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
        <SkipForward size={18} /> Scan Next Card
      </button>
    </div>
  );
}

// -------------------------

export default function App() {
  const [token, setToken] = useState(null);
  const [trackId, setTrackId] = useState(null);
  const [trackInfo, setTrackInfo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // ── 1. Auth token + track ID from URL ──────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    let _token = window.localStorage.getItem('spotify_hitster_token');

    // Handle PKCE Token Exchange if we just returned from Spotify Auth
    const exchangeToken = async (authCode) => {
      let codeVerifier = window.localStorage.getItem('code_verifier');
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
          }),
        });
        const data = await response.json();
        if (data.access_token) {
          window.localStorage.setItem('spotify_hitster_token', data.access_token);
          setToken(data.access_token);
          window.history.replaceState('', document.title, window.location.pathname);
        } else {
          setError("Auth failed: " + (data.error_description || data.error));
        }
      } catch (err) {
        setError("Failed to exchange auth token.");
      }
    };

    if (code) {
      exchangeToken(code);
    } else if (hash && hash.includes('access_token')) {
      _token = new URLSearchParams(hash.replace('#', '?')).get('access_token');
      window.localStorage.setItem('spotify_hitster_token', _token);
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
      setToken(_token);
    } else {
      setToken(_token);
    }

    const _trackId = params.get('track') || window.localStorage.getItem('pending_track');
    if (_trackId) {
      setTrackId(_trackId);
      window.localStorage.removeItem('pending_track');
    }
  }, []);

  // ── 2. Fetch track when token + trackId are ready ──────────────────────────
  useEffect(() => {
    if (token && trackId) fetchTrackDetails(trackId, token);
  }, [token, trackId]);

  // ── 3. PWA install prompt ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const extractSpotifyId = (url) => {
    const match = url.match(/track[\/:]([\w]+)/);
    return match ? match[1] : null;
  };

  const handleLogin = async () => {
    if (!CLIENT_ID || CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
      setError('Please add your Spotify CLIENT_ID to the code first to enable login.');
      return;
    }

    if (trackId) window.localStorage.setItem('pending_track', trackId);

    const codeVerifier = generateRandomString(64);
    window.localStorage.setItem('code_verifier', codeVerifier);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    const params = {
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: REDIRECT_URI,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    window.localStorage.removeItem('spotify_hitster_token');
    setToken(null);
    setTrackId(null);
    setTrackInfo(null);
    setIsPlaying(false);
    setRevealed(false);
    setError('');
  };

  const fetchTrackDetails = async (id, currentToken) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.status === 401) {
        window.localStorage.removeItem('spotify_hitster_token');
        setToken(null);
        setError('Session expired. Please reconnect Spotify.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTrackInfo(data);
      togglePlayback(true, id, currentToken);
    } catch {
      setError('Failed to fetch track info. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = async (play, overrideTrackId = null, overrideToken = null) => {
    const activeToken = overrideToken || token;
    const activeTrack = overrideTrackId || trackId;
    if (!activeToken || !activeTrack) return;

    setError('');
    const endpoint = play ? 'play' : 'pause';
    const body = play ? JSON.stringify({ uris: [`spotify:track:${activeTrack}`] }) : null;

    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
        body,
      });
      if (res.status === 404) {
        setError('No active Spotify device found. Open Spotify on any device, start playing anything, then try again.');
        return;
      }
      if (res.status === 403) {
        setError('Spotify Premium is required to control playback.');
        return;
      }
      if (res.ok || res.status === 204) {
        setIsPlaying(play);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err?.error?.message ?? 'Unknown Spotify error.');
      }
    } catch {
      setError('Playback command failed. Check your connection.');
    }
  };

  const handleScanNext = () => {
    setTrackId(null);
    setTrackInfo(null);
    setRevealed(false);
    setIsPlaying(false);
    setError('');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  // --- Dynamic CSS for missing configuration ---
  const globalStyles = `
    @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
    @keyframes slideUp { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
    @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); } 50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); } }
    @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    .animate-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
    .animate-spin-slow { animation: spinSlow 3s linear infinite; }
    
    #qr-reader { border: none !important; padding: 0 !important; }
    #qr-reader__scan_region { background: transparent !important; }
    #qr-reader__dashboard { padding: 8px !important; background: rgba(15, 23, 42, 0.8) !important; }
    #qr-reader__dashboard_section_csr button, #qr-reader__camera_permission_button { 
      background: #10b981 !important; color: #0f172a !important; border: none !important; 
      padding: 8px 16px !important; border-radius: 12px !important; font-weight: 700 !important; cursor: pointer !important; 
    }
  `;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      <style>{globalStyles}</style>

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <Music size={20} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              HITSTER
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Blind Test Player</p>
        </header>

        {/* Install banner */}
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mb-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold py-3 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Install Hitster as an app
          </button>
        )}

        {/* Main card */}
        <main className="bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-800 shadow-2xl p-6">
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 text-red-300 p-4 rounded-2xl text-sm flex items-start gap-3 w-full border border-red-500/20 mb-5">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          {!token ? (
            <Login onLogin={handleLogin} />
          ) : !trackId ? (
            <Scanner
              extractSpotifyId={extractSpotifyId}
              onTrackFound={(id) => { setTrackId(id); setError(''); }}
              onError={setError}
            />
          ) : loading ? (
            <div className="py-16 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading track…</p>
            </div>
          ) : (
            <Player
              trackInfo={trackInfo}
              isPlaying={isPlaying}
              revealed={revealed}
              onTogglePlayback={() => togglePlayback(!isPlaying)}
              onReveal={() => setRevealed((r) => !r)}
              onScanNext={handleScanNext}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-5 text-center space-y-2">
          <p className="text-slate-600 text-xs">Requires an active Spotify Premium session on any device.</p>
          {token && (
            <button onClick={handleLogout} className="text-slate-600 hover:text-slate-400 text-xs transition-colors underline underline-offset-2">
              Disconnect Spotify
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}