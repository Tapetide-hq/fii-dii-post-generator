import { Container, getContainer } from '@cloudflare/containers';
import type { Env, FiiDiiApiResponse, PostData } from './types';
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

    if (url.pathname === '/generate' && request.method === 'POST') {
      return handleGenerate(request, env);
    }

    if (url.pathname === '/preview') {
      return handlePreview(request, env);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};

function authenticate(request: Request, env: Env): boolean {
  const key = request.headers.get('X-API-Key');
  return !!key && key === env.WORKER_API_KEY;
}

/** Fetch latest FII/DII data from Tapetide API */
async function fetchFiiDiiData(env: Env): Promise<PostData> {
  const apiUrl = `${env.TAPETIDE_API_URL}/api/v1/insight/fii-dii`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`Tapetide API error (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as FiiDiiApiResponse;
  const latest = json.data[0];
  if (!latest) throw new Error('No FII/DII data available');

  const summary = json.summary;

  let fiiIdxFutLongPct: number | null = null;
  if (latest.fao?.fii) {
    const { idx_fut_long, idx_fut_short } = latest.fao.fii;
    const total = idx_fut_long + idx_fut_short;
    if (total > 0) {
      fiiIdxFutLongPct = Math.round((idx_fut_long / total) * 100);
    }
  }

  const fiiStreakDays = Math.abs(summary.fii_streak);
  let fiiStreakTotal = 0;
  for (let i = 0; i < fiiStreakDays && i < json.data.length; i++) {
    fiiStreakTotal += json.data[i].fii_net;
  }

  const diiStreakDays = Math.abs(summary.dii_streak);
  let diiStreakTotal = 0;
  for (let i = 0; i < diiStreakDays && i < json.data.length; i++) {
    diiStreakTotal += json.data[i].dii_net;
  }

  return {
    date: latest.trade_date,
    fiiNet: latest.fii_net,
    diiNet: latest.dii_net,
    combined: latest.fii_net + latest.dii_net,
    fiiBuy: latest.fii_buy,
    fiiSell: latest.fii_sell,
    diiBuy: latest.dii_buy,
    diiSell: latest.dii_sell,
    fiiStreak: summary.fii_streak,
    diiStreak: summary.dii_streak,
    fiiNet5d: summary.fii_net_5d,
    diiNet5d: summary.dii_net_5d,
    fiiNet30d: summary.fii_net_30d,
    diiNet30d: summary.dii_net_30d,
    fiiStreakTotal,
    diiStreakTotal,
    fiiIdxFutLongPct,
  };
}

/** Take a screenshot via the Playwright container */
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

/**
 * POST /generate — fetch data, generate images for requested formats.
 * Query: ?format=twitter|instagram|both (default: both)
 * Returns JSON with base64 images + caption text.
 */
async function handleGenerate(request: Request, env: Env): Promise<Response> {
  if (!authenticate(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'both';
    const data = await fetchFiiDiiData(env);
    const caption = composeTweet(data);

    const formats = format === 'both' ? ['twitter', 'instagram'] : [format];
    const images: Record<string, string> = {};

    for (const fmt of formats) {
      const buf = await takeScreenshot(env, data, fmt);
      images[fmt] = bufferToBase64(buf);
    }

    return Response.json({ data, caption, images, date: data.date });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** GET /preview — generate single image (no auth, for testing) */
async function handlePreview(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'twitter';
    let data: PostData;

    if (url.searchParams.has('mock')) {
      data = {
        date: '2026-03-25',
        fiiNet: -1805,
        diiNet: 5430,
        combined: 3625,
        fiiBuy: 14548,
        fiiSell: 16353,
        diiBuy: 22922,
        diiSell: 17492,
        fiiStreak: -19,
        diiStreak: 21,
        fiiNet5d: -33306,
        diiNet5d: 32901,
        fiiNet30d: -118620,
        diiNet30d: 158852,
        fiiStreakTotal: -118012,
        diiStreakTotal: 150104,
        fiiIdxFutLongPct: 15,
      };
    } else {
      data = await fetchFiiDiiData(env);
    }

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

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
