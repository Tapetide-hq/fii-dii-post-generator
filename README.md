# FII/DII Post Generator

Generate beautiful FII/DII (Foreign & Domestic Institutional Investor) daily update images for social media — Twitter (1200×675) and Instagram (1080×1080).

Built with Playwright for pixel-perfect HTML→PNG rendering. Designed for the Indian stock market.

![Twitter Format](https://tapetide.com/fii-dii-data)

## How It Works

A Docker container runs a Node.js + Playwright server that:

1. Receives FII/DII market data as JSON
2. Injects it into responsive HTML templates (Tailwind CSS + Inter font)
3. Renders a high-DPI screenshot (2x device pixel ratio)
4. Returns the PNG image

Two formats supported:
- **Twitter** — 1200×675 landscape, X logo + `@tapetide_hq` in footer
- **Instagram** — 1080×1080 square, Instagram icon + `@tapetide` in footer

## Quick Start

### Run with Docker

```bash
# Build
docker build -t fii-dii-post-generator ./container/

# Run
docker run -d --name fii-dii -p 3000:3000 fii-dii-post-generator

# Health check
curl http://localhost:3000/health
```

### Generate an Image

```bash
# Twitter format (default)
curl -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-03-25",
    "fiiNet": -1805,
    "diiNet": 5430,
    "combined": 3625,
    "fiiBuy": 14548,
    "fiiSell": 16353,
    "diiBuy": 22922,
    "diiSell": 17492,
    "fiiStreak": -19,
    "diiStreak": 21,
    "fiiNet5d": -33306,
    "diiNet5d": 32901,
    "fiiNet30d": -118620,
    "diiNet30d": 158852,
    "fiiStreakTotal": -118012,
    "diiStreakTotal": 150104,
    "fiiIdxFutLongPct": 15
  }' -o fii-dii-twitter.png

# Instagram format
curl -X POST "http://localhost:3000/screenshot?format=instagram" \
  -H "Content-Type: application/json" \
  -d @data.json -o fii-dii-instagram.png
```

## API

### `GET /health`

Returns `{ "status": "ok", "browser": true }`.

### `POST /screenshot?format=twitter|instagram`

Generates a PNG image from the provided data.

**Query params:**
- `format` — `twitter` (1200×675, default) or `instagram` (1080×1080)

**Request body (JSON):**

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Trade date (YYYY-MM-DD) |
| `fiiNet` | number | FII net value in crores |
| `diiNet` | number | DII net value in crores |
| `combined` | number | Combined net (fiiNet + diiNet) |
| `fiiBuy` | number | FII buy value |
| `fiiSell` | number | FII sell value |
| `diiBuy` | number | DII buy value |
| `diiSell` | number | DII sell value |
| `fiiStreak` | number | FII streak days (negative = selling) |
| `diiStreak` | number | DII streak days (positive = buying) |
| `fiiNet5d` | number | FII 5-day net |
| `diiNet5d` | number | DII 5-day net |
| `fiiNet30d` | number | FII 30-day net |
| `diiNet30d` | number | DII 30-day net |
| `fiiStreakTotal` | number | Cumulative net during FII streak |
| `diiStreakTotal` | number | Cumulative net during DII streak |
| `fiiIdxFutLongPct` | number\|null | FII Index Futures long % (0-100) |

**Response:** PNG image (`Content-Type: image/png`)

## Image Features

- FII/FPI and DII net values with buy/sell breakdown
- Net combined with color coding (green = positive, red = negative)
- Market split bar showing FII selling vs DII support ratio
- Streak cards with cumulative streak totals
- FII Index Futures Long/Short ratio with sentiment label
- 30-day net flow summary
- All values in Indian number format (₹1,18,620 Cr)

## Cloudflare Workers Deployment

The project includes a Cloudflare Worker (`src/`) that orchestrates the container:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Deploy
npx wrangler deploy
```

Set secrets:
```bash
wrangler secret put WORKER_API_KEY
wrangler secret put TAPETIDE_API_URL
```

The Worker provides:
- `GET /preview?format=twitter|instagram&mock` — preview with mock/live data
- `POST /generate?format=twitter|instagram|both` — authenticated endpoint returning base64 images + caption text

## Project Structure

```
├── container/
│   ├── Dockerfile              # Playwright + Node.js container
│   ├── server.js               # Express server with /screenshot endpoint
│   ├── shared.js               # Shared rendering logic (formatting, icons)
│   ├── template.html           # Twitter template (1200×675)
│   ├── template-instagram.html # Instagram template (1080×1080)
│   └── package.json
├── src/
│   ├── index.ts                # Cloudflare Worker handler
│   ├── types.ts                # TypeScript types
│   ├── tweet.ts                # Caption text composer
│   ├── format.ts               # Number formatting (Indian notation)
│   ├── tweet.test.ts           # Caption tests
│   └── format.test.ts          # Format tests
├── wrangler.toml               # Cloudflare config
└── package.json
```

## Customization

To use this for your own brand:

1. Edit `container/template.html` and `container/template-instagram.html` — update logo SVG, brand name, colors, footer links
2. Edit `container/shared.js` — modify formatting or sentiment labels
3. Edit `src/tweet.ts` — customize caption text generation

The Tailwind config in each template defines the color palette:
```js
colors: {
  sell: '#dc2626',    // Red for selling/negative
  buy: '#059669',     // Green for buying/positive
  brand: '#0EA882',   // Brand accent color
  ink: '#0f172a',     // Primary text
  subtle: '#64748b',  // Secondary text
}
```

## Tech Stack

- **Container:** Node.js + Express + Playwright Chromium
- **Templates:** Tailwind CSS (CDN) + Inter font (Google Fonts)
- **Worker:** TypeScript on Cloudflare Workers + Containers
- **Tests:** Vitest (26 tests)
- **Rendering:** 2x DPR for high-resolution output

## License

MIT
