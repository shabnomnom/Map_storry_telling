# Carte — AI Map Storyteller

An interactive map storytelling app powered by Claude and Mapbox. Chat with Carte, an AI travel companion, and watch your journey come to life — cinematic globe fly-throughs, animated transport markers, colour-coded route lines, and a photo fan at every stop.

---

## Features

- **Conversational AI** — Carte (Claude) asks where you went and how you got there, then flies the map there automatically
- **Cinematic globe animation** — smooth `flyTo` on a 3D Mapbox globe with fog and atmosphere
- **Transport modes** — plane ✈️, train 🚂, car 🚗, or any custom mode (bike, ferry, horse, helicopter…) with matching emoji marker and route colour
- **Animated route** — coloured base line + white dashed overlay draws in real time as you travel
- **Photo fan** — add up to 5 photos at each stop; they fan out as a card arc on the map
- **Lightbox viewer** — click any photo to enlarge it
- **Trip replay** — replay your full journey step by step with a progress HUD and Next / Stop controls

---

## Stack

| Layer | Technology |
|---|---|
| Map | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) v3.3 |
| AI | [Anthropic Claude](https://www.anthropic.com/) (`claude-sonnet-4`) via API |
| Server | Node.js (ESM) — thin HTTP proxy, no framework |
| Frontend | Single-file HTML + CSS (`carte.html` + `carte.css`) |

---

## Project structure

```
carte.html      — app UI + all client-side JS
carte.css       — all styles
server.js       — Node proxy: serves static files, forwards /api/claude → Anthropic
package.json
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get API keys

| Key | Where to get it |
|---|---|
| **Mapbox** | [mapbox.com](https://account.mapbox.com/) → Tokens |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) → API Keys |

### 3. Set environment variables

```bash
export Mapbox_KEY=pk.eyJ1...
export Claude_KEY=sk-ant-...
```

Or inline when starting the server:

```bash
Mapbox_KEY=pk.eyJ1... Claude_KEY=sk-ant-... npm start
```

### 4. Run

```bash
npm start
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## How it works

1. `server.js` serves `carte.html` and `carte.css` as static files, injecting `Mapbox_KEY` into the HTML at request time (replacing the `__MAPBOX_TOKEN__` placeholder).
2. All Claude API calls from the browser go to `POST /api/claude`, which the server proxies to `api.anthropic.com` using `Claude_KEY` — keeping your API key off the client.
3. The client runs a tool-use agent loop: Claude calls `resolve_location` (Mapbox Geocoding API), `set_transport`, and `fly_to_location` as structured tools, which execute locally in the browser.

---

## Usage

- **Type naturally** — "I flew to Tokyo, then took the Shinkansen to Kyoto"
- **Custom transport** — click `+ custom transport` to set any emoji + label before describing your next leg
- **Add photos** — click the `+` button on any map marker to attach photos (up to 5 per stop)
- **Replay** — once you have 2+ stops, click `▶ replay trip` to watch the whole journey play back

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start server with nodemon (auto-restarts on changes) |
