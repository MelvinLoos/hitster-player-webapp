import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Login from './components/Login.jsx';
import Scanner from './components/Scanner.jsx';
import Player from './components/Player.jsx';
import { Music, Download, AlertCircle } from 'lucide-react';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Set your Spotify Client ID here (from https://developer.spotify.com/dashboard)
// Add BOTH of these as valid Redirect URIs in your Spotify app settings:
//   - https://hitster.looselycoupled.nl
//   - https://<your-netlify-subdomain>.netlify.app
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? 'YOUR_SPOTIFY_CLIENT_ID';
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

export default function App() {
  const [token, setToken] = useState(null);
  const [trackId, setTrackId] = useState(null);
  const [trackInfo, setTrackInfo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // PWA auto-update via vite-plugin-pwa
  useRegisterSW({ immediate: true });

  // ── 1. Auth token + track ID from URL ──────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    let _token = window.localStorage.getItem('spotify_hitster_token');

    const exchangeToken = async (authCode) => {
      const codeVerifier = window.localStorage.getItem('code_verifier');
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
        } else {
          setError("Auth failed: " + (data.error_description || data.error));
        }
      } catch (err) {
        setError("Failed to exchange auth token.");
      }
    };

    if (code) {
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      window.history.replaceState({}, document.title, url.toString());

      exchangeToken(code);
    } else if (hash && hash.includes('access_token')) {
      _token = new URLSearchParams(hash.replace('#', '?')).get('access_token');
      window.localStorage.setItem('spotify_hitster_token', _token);

      const url = new URL(window.location.href);
      url.hash = '';
      window.history.replaceState({}, document.title, url.toString());

      setToken(_token);
    } else {
      setToken(_token);
    }

    const _trackId = params.get('track');
    if (_trackId) setTrackId(_trackId);
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
      setError('Please set VITE_SPOTIFY_CLIENT_ID in your .env file or replace the placeholder in App.jsx.');
      return;
    }

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
    let targetDeviceId = null;

    try {
      // 1. If we want to play, first try to find an available device to wake up
      if (play) {
        const devicesRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });

        if (devicesRes.ok) {
          const { devices } = await devicesRes.json();
          if (devices && devices.length > 0) {
            // Prefer an already active device, otherwise just grab the first available one (like your phone)
            const activeDevice = devices.find(d => d.is_active) || devices[0];
            targetDeviceId = activeDevice.id;
          }
        }
      }

      // 2. Build the playback URL, appending the device ID if we found one
      const endpoint = play ? 'play' : 'pause';
      let url = `https://api.spotify.com/v1/me/player/${endpoint}`;
      if (play && targetDeviceId) {
        url += `?device_id=${targetDeviceId}`;
      }

      const body = play ? JSON.stringify({ uris: [`spotify:track:${activeTrack}`] }) : null;

      // 3. Send the command
      const res = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
        body,
      });

      if (res.status === 404) {
        setError('No Spotify devices found at all. Please open the Spotify app on your phone or computer to wake it up, then try again.');
        return;
      }
      if (res.status === 403) {
        setError('Spotify Premium is required to control playback, or the targeted device is restricted.');
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
        <main className="card p-6">
          {/* Error */}
          {error && (
            <div className="error-box mb-5">
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
