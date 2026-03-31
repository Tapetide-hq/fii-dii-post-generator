// Shared rendering logic for FII/DII post templates
const arrowDownSvg = (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`;
const arrowUpSvg = (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>`;

function fmt(n) {
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  let result;
  if (s.length <= 3) { result = s; }
  else {
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    const pairs = [];
    for (let i = rest.length; i > 0; i -= 2) pairs.unshift(rest.slice(Math.max(0, i - 2), i));
    result = pairs.join(',') + ',' + last3;
  }
  return (n >= 0 ? '+' : '-') + '₹' + result + ' Cr';
}

function fmtBuySell(n) {
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  let result;
  if (s.length <= 3) { result = s; }
  else {
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    const pairs = [];
    for (let i = rest.length; i > 0; i -= 2) pairs.unshift(rest.slice(Math.max(0, i - 2), i));
    result = pairs.join(',') + ',' + last3;
  }
  return '₹' + result + ' Cr';
}

function streakText(streak) {
  if (streak === 0) return 'Neutral';
  return Math.abs(streak) + ' Days ' + (streak > 0 ? 'Buying' : 'Selling');
}

function cls(n) { return n >= 0 ? 'text-buy' : 'text-sell'; }

function setIcon(el, isPositive, size) {
  el.className += isPositive ? ' bg-buy-soft text-buy' : ' bg-sell-soft text-sell';
  el.innerHTML = isPositive ? arrowUpSvg(size) : arrowDownSvg(size);
}

function faoSentimentLabel(pct) {
  if (pct === null) return { label: 'N/A', color: 'text-muted' };
  if (pct <= 25) return { label: 'Deep Bearish', color: 'text-sell' };
  if (pct <= 40) return { label: 'Bearish', color: 'text-sell' };
  if (pct <= 48) return { label: 'Mildly Bearish', color: 'text-sell' };
  if (pct <= 52) return { label: 'Neutral', color: 'text-muted' };
  if (pct <= 60) return { label: 'Mildly Bullish', color: 'text-buy' };
  if (pct <= 75) return { label: 'Bullish', color: 'text-buy' };
  return { label: 'Deep Bullish', color: 'text-buy' };
}

function renderData(d, iconSize) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dt = new Date(d.date + 'T00:00:00');
  const [y, m, dd] = d.date.split('-');
  document.getElementById('fullDate').textContent = days[dt.getDay()] + ', ' + parseInt(dd) + ' ' + months[parseInt(m)-1] + ' ' + y;

  const fiiEl = document.getElementById('fiiNet');
  fiiEl.textContent = fmt(d.fiiNet); fiiEl.className += ' ' + cls(d.fiiNet);
  document.getElementById('fiiBuy').textContent = fmtBuySell(d.fiiBuy);
  document.getElementById('fiiSell').textContent = fmtBuySell(d.fiiSell);

  const diiEl = document.getElementById('diiNet');
  diiEl.textContent = fmt(d.diiNet); diiEl.className += ' ' + cls(d.diiNet);
  document.getElementById('diiBuy').textContent = fmtBuySell(d.diiBuy);
  document.getElementById('diiSell').textContent = fmtBuySell(d.diiSell);

  const combEl = document.getElementById('combined');
  combEl.textContent = fmt(d.combined); combEl.className += ' ' + cls(d.combined);

  const totalAct = Math.abs(d.fiiSell) + Math.abs(d.diiSell);
  const fiiPct = totalAct > 0 ? Math.round((Math.abs(d.fiiSell) / totalAct) * 100) : 50;
  document.getElementById('barFii').style.width = fiiPct + '%';
  document.getElementById('barDii').style.width = (100 - fiiPct) + '%';
  document.getElementById('fiiPctLabel').textContent = 'FII Selling: ' + fiiPct + '%';
  document.getElementById('diiPctLabel').textContent = 'DII Support: ' + (100 - fiiPct) + '%';

  setIcon(document.getElementById('fiiStreakIcon'), d.fiiStreak > 0, iconSize);
  const fiiSV = document.getElementById('fiiStreakVal');
  fiiSV.textContent = streakText(d.fiiStreak); fiiSV.className += ' ' + cls(d.fiiStreak);
  const fiiST = document.getElementById('fiiStreakTotal');
  fiiST.textContent = fmt(d.fiiStreakTotal); fiiST.className += ' ' + cls(d.fiiStreakTotal);

  setIcon(document.getElementById('diiStreakIcon'), d.diiStreak > 0, iconSize);
  const diiSV = document.getElementById('diiStreakVal');
  diiSV.textContent = streakText(d.diiStreak); diiSV.className += ' ' + cls(d.diiStreak);
  const diiST = document.getElementById('diiStreakTotal');
  diiST.textContent = fmt(d.diiStreakTotal); diiST.className += ' ' + cls(d.diiStreakTotal);

  const pct = d.fiiIdxFutLongPct;
  const sent = faoSentimentLabel(pct);
  setIcon(document.getElementById('faoIcon'), pct !== null && pct >= 50, iconSize);
  const pctEl = document.getElementById('faoLongPct');
  pctEl.textContent = pct !== null ? pct + '%' : 'N/A'; pctEl.className += ' ' + sent.color;
  const sentEl = document.getElementById('faoSentiment');
  sentEl.textContent = sent.label; sentEl.className += ' ' + sent.color;
  if (pct !== null) {
    document.getElementById('faoBarLong').style.width = pct + '%';
    document.getElementById('faoBarShort').style.width = (100 - pct) + '%';
  }

  const f30 = document.getElementById('fii30d');
  f30.textContent = fmt(d.fiiNet30d); f30.className += ' ' + cls(d.fiiNet30d);
  const d30 = document.getElementById('dii30d');
  d30.textContent = fmt(d.diiNet30d); d30.className += ' ' + cls(d.diiNet30d);
}

// V2 renderer for the new Instagram template (pure CSS, no Tailwind)
function renderDataV2(d) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dt = new Date(d.date + 'T00:00:00');
  const [y, m, dd] = d.date.split('-');
  // Date block — new format
  var dateMainEl = document.getElementById('dateMain');
  var dateWeekdayEl = document.getElementById('dateWeekday');
  if (dateMainEl) {
    dateMainEl.textContent = parseInt(dd) + ' ' + months[parseInt(m)-1] + ' ' + y;
    dateWeekdayEl.textContent = days[dt.getDay()];
  }
  // Fallback for old template
  var fullDateEl = document.getElementById('fullDate');
  if (fullDateEl) fullDateEl.textContent = days[dt.getDay()] + ', ' + parseInt(dd) + ' ' + months[parseInt(m)-1] + ' ' + y;
  function fmtV2(n) { return fmt(n).replace('-', '−'); }

  document.getElementById('fiiNet').textContent = fmtV2(d.fiiNet);
  document.getElementById('fiiBuy').textContent = fmtBuySell(d.fiiBuy);
  document.getElementById('fiiSell').textContent = fmtBuySell(d.fiiSell);
  document.getElementById('diiNet').textContent = fmtV2(d.diiNet);
  document.getElementById('diiBuy').textContent = fmtBuySell(d.diiBuy);
  document.getElementById('diiSell').textContent = fmtBuySell(d.diiSell);

  const combEl = document.getElementById('combined');
  combEl.textContent = fmtV2(d.combined);
  combEl.style.color = d.combined >= 0 ? 'var(--buy)' : 'var(--sell)';

  const totalAct = Math.abs(d.fiiSell) + Math.abs(d.diiSell);
  const fiiPct = totalAct > 0 ? Math.round((Math.abs(d.fiiSell) / totalAct) * 100) : 50;
  document.getElementById('barFii').style.width = fiiPct + '%';
  document.getElementById('barDii').style.width = (100 - fiiPct) + '%';
  document.getElementById('fiiPctLabel').textContent = fiiPct + '%';
  document.getElementById('diiPctLabel').textContent = (100 - fiiPct) + '%';

  // Streaks
  function setIconV2(el, isPositive) {
    const svg = isPositive ? arrowUpSvg(18) : arrowDownSvg(18);
    const color = isPositive ? '#0969C7' : '#E0252A';
    el.innerHTML = svg.replace('stroke="currentColor"', 'stroke="' + color + '"');
  }
  function cssClr(n) { return n >= 0 ? 'buy' : 'sell'; }

  setIconV2(document.getElementById('fiiStreakIcon'), d.fiiStreak > 0);
  const fiiSV = document.getElementById('fiiStreakVal');
  fiiSV.textContent = streakText(d.fiiStreak);
  fiiSV.classList.add(cssClr(d.fiiStreak));
  const fiiST = document.getElementById('fiiStreakTotal');
  fiiST.textContent = fmtV2(d.fiiStreakTotal);
  fiiST.classList.add(cssClr(d.fiiStreakTotal));

  setIconV2(document.getElementById('diiStreakIcon'), d.diiStreak > 0);
  const diiSV = document.getElementById('diiStreakVal');
  diiSV.textContent = streakText(d.diiStreak);
  diiSV.classList.add(cssClr(d.diiStreak));
  const diiST = document.getElementById('diiStreakTotal');
  diiST.textContent = fmtV2(d.diiStreakTotal);
  diiST.classList.add(cssClr(d.diiStreakTotal));

  // FAO
  const pct = d.fiiIdxFutLongPct;
  const sent = faoSentimentLabel(pct);
  setIconV2(document.getElementById('faoIcon'), pct !== null && pct >= 50);
  const pctEl = document.getElementById('faoLongPct');
  pctEl.textContent = pct !== null ? pct + '%' : 'N/A';
  pctEl.style.color = pct !== null && pct >= 50 ? 'var(--buy)' : 'var(--sell)';
  const sentEl = document.getElementById('faoSentiment');
  sentEl.textContent = sent.label;
  sentEl.style.color = pct !== null && pct >= 50 ? 'var(--buy)' : 'var(--sell)';
  if (pct !== null) {
    document.getElementById('faoBarLong').style.width = pct + '%';
  }

  // 30-day
  const f30 = document.getElementById('fii30d');
  f30.textContent = fmtV2(d.fiiNet30d);
  f30.classList.add(cssClr(d.fiiNet30d));
  const d30 = document.getElementById('dii30d');
  d30.textContent = fmtV2(d.diiNet30d);
  d30.classList.add(cssClr(d.diiNet30d));
}
