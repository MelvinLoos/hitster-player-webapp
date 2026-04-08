# Groovageddon Player 🎵

A Progressive Web App (PWA) for playing [Groovageddon](https://groovageddon.nl) — scan the QR code on a card, play the song via Spotify, and reveal (or keep hidden) the title and year.

## Features

- 📷 **QR scanner** — scan Groovageddon cards directly with your phone camera
- 🎵 **Spotify playback control** — play/pause via the Spotify Web API
- 🕵️ **Reveal/hide** — keep the mystery alive or reveal the answer instantly
- 📲 **Installable PWA** — works offline, installs on your home screen
- 🚀 **Netlify-ready** — one-click deploy with SPA routing pre-configured

## Setup

### 1. Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. Add **both** of these as **Redirect URIs** in your Spotify app settings:
   - `https://groovageddon.nl`
   - `https://groovageddon.netlify.app`
   - `http://localhost:5173` (for local development)
3. Copy your **Client ID**.

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set your Client ID:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy to Netlify

### Option A — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Option B — Git integration (recommended)

1. Push this repo to GitHub.
2. In the Netlify dashboard: **Add new site → Import from Git**.
3. Build settings are already in `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add an environment variable in **Site settings → Environment variables**:
   - Key: `VITE_SPOTIFY_CLIENT_ID`
   - Value: your Spotify Client ID.
5. **Add your custom domain** `groovageddon.nl` under **Domain management** and point your DNS CNAME to the Netlify-generated domain.

## Project Structure

```
groovageddon-web-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Login.jsx       # Spotify auth screen
│   │   ├── Scanner.jsx     # QR code scanner + manual URL input
│   │   └── Player.jsx      # Playback controls + reveal panel
│   ├── App.jsx             # State management + Spotify API calls
│   ├── main.jsx            # React entry point
│   └── index.css           # Tailwind + custom styles
├── .env.example            # Environment variable template
├── netlify.toml            # Netlify build + redirect config
├── vite.config.js          # Vite + PWA plugin config
└── tailwind.config.js
```

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [React 18](https://react.dev) | UI framework |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | Service worker & manifest |
| [html5-qrcode](https://github.com/mebjas/html5-qrcode) | QR scanning |
| [lucide-react](https://lucide.dev) | Icons |

## Notes

- Requires **Spotify Premium** to control playback.
- An **active Spotify session** must be open on any device before pressing Play.
