#!/usr/bin/env node
/**
 * Local image generator — renders both Twitter and Instagram templates
 * using Playwright, saves as today-twitter.png and today-instagram.png.
 *
 * Usage: node generate-local.js
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SHARED_JS = fs.readFileSync(path.join(__dirname, "container", "shared.js"), "utf8");

const TEMPLATES = {
  twitter: {
    html: fs.readFileSync(path.join(__dirname, "container", "template.html"), "utf8"),
    width: 1200,
    height: 675,
  },
  instagram: {
    html: fs.readFileSync(path.join(__dirname, "container", "template-instagram.html"), "utf8"),
    width: 1080,
    height: 1080,
  },
};

// Sample data matching the screenshots shared
const SAMPLE_DATA = {
  date: "2026-03-31",
  fiiNet: -4367,
  diiNet: 3566,
  combined: -801,
  fiiBuy: 24854,
  fiiSell: 29221,
  diiBuy: 37579,
  diiSell: 34013,
  fiiStreak: -20,
  diiStreak: 22,
  fiiNet5d: -15200,
  diiNet5d: 12800,
  fiiNet30d: -123932,
  diiNet30d: 162544,
  fiiStreakTotal: -122380,
  diiStreakTotal: 153000,
  fiiIdxFutLongPct: 15,
};

async function render(format) {
  const tmpl = TEMPLATES[format];
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: tmpl.width, height: tmpl.height },
    deviceScaleFactor: 2,
  });

  const html = tmpl.html
    .replace("/*__DATA__*/", `const DATA = ${JSON.stringify(SAMPLE_DATA)};`)
    .replace("/*__SHARED__*/", SHARED_JS);

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const outPath = path.join(__dirname, `today-${format}.png`);
  await page.screenshot({ type: "png", path: outPath });
  console.log(`Saved: ${outPath}`);

  await browser.close();
}

(async () => {
  await render("twitter");
  await render("instagram");
  console.log("Done!");
})();
