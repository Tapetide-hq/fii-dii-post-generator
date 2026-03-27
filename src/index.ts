import { Container, getContainer } from '@cloudflare/containers';
import type { Env, PostData } from './types';
import { composeTweet } from './tweet';

export class ScreenshotContainer extends Container {
  defaultPort = 3000;
  sleepAfter = '5m';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Stateless: you send PostData JSON, get PNG back
    if (url.pathname === '/screenshot' && request.method === 'POST') {
      return handleScreenshot(request, env);
    }

    // Auto-fetch: Worker gets data from Tapetide API for a given date
    // GET /image?format=twitter&date=2026-03-27 (date optional, defaults to latest)
    if (url.pathname === '/image') {
      return handleImage(request, env);
    }

    // Auto-fetch: returns both images as base64 JSON + caption
    // GET /generate?date=2026-03-27 (date optional, defaults to latest)
    if (url.pathname === '/generate') {
      return handleGenerate(request, env);
    }

    return Response.json({
      endpoints: {
        'POST /screenshot?format=twitter|instagram': 'Send PostData JSON, get PNG back (stateless)',
        'GET /image?format=twitter|instagram&date=YYYY-MM-DD': 'Auto-fetch data from API, get PNG back',
        'GET /generate?date=YYYY-MM-DD': 'Auto-fetch data, get JSON with base64 images + caption',
        'GET /health': 'Health check',
      },
    });
  },
};

// --- Data fetching ---

/** Fetch FII/DII post data from Tapetide API for a specific date */
async function fetchPostData(env: Env, targetDate?: string): Promise<PostData> {
  let apiUrl = `${env.TAPETIDE_API_URL}/api/v1/insight/fii-dii/post-data`;
  if (targetDate) {
    apiUrl += `?date=${targetDate}`;
  }

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`Tapetide API error (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as {
    date: string;
    fii_net: number; dii_net: number; combined: number;
    fii_buy: number; fii_sell: number; dii_buy: number; dii_sell: number;
    fii_streak: number; dii_streak: number;
    fii_net_5d: number; dii_net_5d: number;
    fii_net_30d: number; dii_net_30d: number;
    fii_streak_total: number; dii_streak_total: number;
    fii_idx_fut_long_pct: number | null;
  };

  return {
    date: json.date,
    fiiNet: json.fii_net,
    diiNet: json.dii_net,
    combined: json.combined,
    fiiBuy: json.fii_buy,
    fiiSell: json.fii_sell,
    diiBuy: json.dii_buy,
    diiSell: json.dii_sell,
    fiiStreak: json.fii_streak,
    diiStreak: json.dii_streak,
    fiiNet5d: json.fii_net_5d,
    diiNet5d: json.dii_net_5d,
    fiiNet30d: json.fii_net_30d,
    diiNet30d: json.dii_net_30d,
    fiiStreakTotal: json.fii_streak_total,
    diiStreakTotal: json.dii_streak_total,
    fiiIdxFutLongPct: json.fii_idx_fut_long_pct,
  };
}

// --- Container interaction ---

async function takeScreenshot(env: Env, data: PostData, format: string): Promise<ArrayBuffer> {
  const container = getContainer(env.SCREENSHOT_CONTAINER, 'default');
  const res = await container.fetch(`http://container/screenshot?format=${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Container screenshot failed (${res.status}): ${errText}`);
  }

  return res.arrayBuffer();
}

// --- Handlers ---

/**
 * POST /screenshot?format=twitter|instagram
 * Stateless: send PostData JSON in body, get PNG back.
 */
async function handleScreenshot(request: Request, env: Env): Promise<Response> {
  try {
    const data = (await request.json()) as PostData;
    if (!data.date) {
      return Response.json({ error: 'Missing required field: date' }, { status: 400 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'twitter';
    const imageBuffer = await takeScreenshot(env, data, format);
    const caption = composeTweet(data);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'X-Caption': encodeURIComponent(caption),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /image?format=twitter|instagram&date=2026-03-27
 * Auto-fetch: Worker gets data from Tapetide API, returns PNG.
 * date is optional — defaults to latest available.
 */
async function handleImage(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'twitter';
    const date = url.searchParams.get('date') || undefined;

    const data = await fetchPostData(env, date);
    const imageBuffer = await takeScreenshot(env, data, format);
    const caption = composeTweet(data);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'X-Caption': encodeURIComponent(caption),
        'X-Date': data.date,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /generate?date=2026-03-27
 * Auto-fetch: returns JSON with both images as base64 + caption text.
 * date is optional — defaults to latest available.
 */
async function handleGenerate(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || undefined;

    const data = await fetchPostData(env, date);
    const caption = composeTweet(data);

    const images: Record<string, string> = {};
    for (const fmt of ['twitter', 'instagram']) {
      const buf = await takeScreenshot(env, data, fmt);
      images[fmt] = bufferToBase64(buf);
    }

    return Response.json({ data, caption, images, date: data.date });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
