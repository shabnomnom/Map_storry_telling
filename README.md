# Carte — AI Map Storyteller

An interactive storytelling web and mobile app powered by Claude and Mapbox. Chat with Carte, an AI travel tool, and watch your journey come to life — cinematic globe fly-through, animated transport markers, colour-coded route lines, a photo fan at every stop, and full PWA support for install on desktop and iOS/Android.

🌍 **Live at [map-storry-telling.onrender.com](https://map-storry-telling.onrender.com)**

---

## Features

- **Conversational AI** — Carte (Claude) asks where you went and how you got there, then flies the map there automatically
- **Cinematic globe animation** — smooth `flyTo` on a 3D Mapbox globe with fog and atmosphere
- **Transport modes** — plane ✈️, train 🚂, car 🚗, or any custom mode (bike, ferry, horse, helicopter…) with matching emoji marker and route colour
- **Animated route** — coloured base line + white dashed overlay draws in real time as you travel
- **Photo fan** — add up to 5 photos at each stop; they fan out as a card arc on the map
- **Lightbox viewer** — click any photo to enlarge it
- **Trip replay** — replay your full journey step by step with a progress HUD and Next / Stop controls
- **Mobile-first layout** — bottom-drawer panel on phones (≤ 600 px) so the map fills the top half; safe-area insets for iOS notch/home-bar; momentum scroll; no auto-zoom on inputs
- **PWA** — installable on desktop (Chrome/Edge) and mobile (iOS Safari, Android Chrome); works offline for the app shell

---

## Stack

| Layer | Technology |
|---|---|
| Map | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) v3.3 |
| AI | [Anthropic Claude](https://www.anthropic.com/) (`claude-sonnet-4`) via API |
| Server | Node.js (ESM) — thin HTTP proxy, no framework |
| Frontend | Single-file HTML + CSS (`carte.html` + `carte.css`) |
| PWA | Web App Manifest + Service Worker (`sw.js`) |

---

## Project structure

```
carte.html        — app UI + all client-side JS
carte.css         — all styles
server.js         — Node proxy: serves static files, forwards /api/claude → Anthropic
manifest.json     — PWA web app manifest
sw.js             — Service worker (cache-first shell, network-only for AI + Mapbox)
icons/
  icon-192.png    — PWA home screen icon
  icon-512.png    — PWA splash / install icon
package.json
README.md
```

---

## Setup

### 1. Install dependencies

```zsh
npm install
```

### 2. Get API keys

| Key | Where to get it |
|---|---|
| **Mapbox** | [mapbox.com](https://account.mapbox.com/) → Tokens |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) → API Keys |

### 3. Set environment variables

```zsh
export Mapbox_KEY=pk.eyJ1...
export Claude_KEY=sk-ant-...
```

Or inline when starting the server:

```zsh
Mapbox_KEY=pk.eyJ1... Claude_KEY=sk-ant-... npm start
```

### 4. Run

```zsh
npm start
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## How it works

1. `server.js` serves `carte.html`, `carte.css`, `manifest.json`, `sw.js`, and the `icons/` folder as static files, injecting `Mapbox_KEY` into the HTML at request time (replacing the `__MAPBOX_TOKEN__` placeholder).
2. All Claude API calls from the browser go to `POST /api/claude`, which the server proxies to `api.anthropic.com` using `Claude_KEY` — keeping your API key off the client.
3. The client runs a tool-use agent loop: Claude calls `resolve_location` (Mapbox Geocoding API), `set_transport`, and `fly_to_location` as structured tools, which execute locally in the browser.

---

## Usage

- **Type naturally** — "I flew to Tokyo, then took the Shinkansen to Kyoto"
- **Custom transport** — click `+ custom transport` to set any emoji + label before describing your next leg
- **Add photos** — click the `+` button on any map marker to attach photos (up to 5 per stop)
- **Replay** — once you have 2+ stops, click `▶ replay trip` to watch the whole journey play back

---

## Installing as an app (PWA)

### Desktop — Chrome or Edge
Visit the live URL (or `localhost:3000`), then click the **install icon ⊕** in the address bar → "Install Carte".

### Android — Chrome
Tap the browser menu → **"Add to Home screen"**.

### iPhone / iPad — Safari
> ⚠️ Safari requires **HTTPS** for PWA install — use the deployed URL, not localhost.

1. Open **[map-storry-telling.onrender.com](https://map-storry-telling.onrender.com)** in Safari
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** — Carte appears on your home screen with its amber globe icon

Once installed, the app shell (HTML, CSS, icons) loads instantly from cache. The map and AI features still require an internet connection.

---

## Deployment (Render)

The app is deployed on [Render](https://render.com) as a Node.js web service.

**Environment variables to set in the Render dashboard:**

| Variable | Value |
|---|---|
| `Mapbox_KEY` | Your Mapbox public token |
| `Claude_KEY` | Your Anthropic API key |

Render auto-deploys on every push to the connected GitHub branch. Make sure `manifest.json`, `sw.js`, and the `icons/` folder are all committed — they are required for PWA install to work.

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start server with nodemon (auto-restarts on changes) |
