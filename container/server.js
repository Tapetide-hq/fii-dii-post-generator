const express = require("express");
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const SHARED_JS = fs.readFileSync(path.join(__dirname, "shared.js"), "utf8");

const TEMPLATES = {
  twitter: {
    html: fs.readFileSync(path.join(__dirname, "template.html"), "utf8"),
    width: 1200,
    height: 675,
  },
  instagram: {
    html: fs.readFileSync(path.join(__dirname, "template-instagram.html"), "utf8"),
    width: 1080,
    height: 1080,
  },
};

let browser = null;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });
  }
  return browser;
}

async function renderScreenshot(data, format = "twitter") {
  const tmpl = TEMPLATES[format];
  if (!tmpl) throw new Error(`Unknown format: ${format}. Use "twitter" or "instagram".`);

  let page = null;
  try {
    const b = await getBrowser();
    page = await b.newPage({
      viewport: { width: tmpl.width, height: tmpl.height },
      deviceScaleFactor: 2,
    });
    const html = tmpl.html
      .replace("/*__DATA__*/", `const DATA = ${JSON.stringify(data)};`)
      .replace("/*__SHARED__*/", SHARED_JS);
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    return await page.screenshot({ type: "png", fullPage: false });
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", browser: !!browser && browser.isConnected() });
});

/**
 * POST /screenshot
 * Body: { ...tweetData }
 * Query: ?format=twitter|instagram (default: twitter)
 */
app.post("/screenshot", async (req, res) => {
  const data = req.body;
  if (!data || !data.date) {
    return res.status(400).json({ error: "Missing tweet data" });
  }
  const format = req.query.format || "twitter";
  try {
    const buf = await renderScreenshot(data, format);
    res.set("Content-Type", "image/png");
    res.send(buf);
  } catch (err) {
    console.error("Screenshot error:", err);
    res.status(500).json({ error: err.message });
  }
});

getBrowser()
  .then(() => console.log("Browser launched"))
  .catch((err) => console.error("Browser launch failed:", err));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Screenshot server listening on :${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  if (browser) await browser.close().catch(() => {});
  process.exit(0);
});
