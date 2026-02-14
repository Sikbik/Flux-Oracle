export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Flux Oracle Live</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Sora:wght@300;400;600&family=IBM+Plex+Mono:wght@400;600&display=swap"
    />
    <style>
      :root {
        color-scheme: dark;
        --bg: #0a1216;
        --bg-deep: #070e11;
        --panel: rgba(12, 24, 30, 0.9);
        --panel-strong: rgba(16, 31, 38, 0.96);
        --panel-border: rgba(129, 214, 205, 0.18);
        --ink: #e7f6f1;
        --muted: #a1b5b4;
        --accent: #f5b86a;
        --accent-2: #77f0d4;
        --accent-3: #8cc3ff;
        --danger: #ff8b8b;
        --line: rgba(119, 240, 212, 0.22);
        --shadow: 0 24px 50px rgba(4, 10, 12, 0.5);
        --radius-lg: 26px;
        --radius-md: 18px;
        --radius-sm: 12px;
      }

      * {
        box-sizing: border-box;
      }

      html {
        color-scheme: dark;
        background-color: var(--bg);
      }

      body {
        margin: 0;
        min-height: 100vh;
        overflow-x: hidden;
        background: radial-gradient(circle at 15% 20%, rgba(119, 240, 212, 0.12), transparent 55%),
          radial-gradient(circle at 80% 0%, rgba(245, 184, 106, 0.12), transparent 40%),
          linear-gradient(180deg, #0a1216 0%, #0b171c 45%, #0a1216 100%);
        color: var(--ink);
        font-family: 'Sora', sans-serif;
        letter-spacing: 0.01em;
        -webkit-tap-highlight-color: transparent;
      }

      .skip-link {
        position: absolute;
        left: 16px;
        top: 16px;
        background: var(--panel-strong);
        color: var(--ink);
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--panel-border);
        transform: translateY(-200%);
        transition: transform 0.2s ease;
        text-decoration: none;
        font-size: 0.85rem;
        z-index: 2;
      }

      .skip-link:hover {
        background: rgba(119, 240, 212, 0.12);
      }

      .skip-link:focus-visible {
        transform: translateY(0);
        outline: 2px solid rgba(119, 240, 212, 0.6);
        outline-offset: 2px;
      }

      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image: linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 48px 48px;
        opacity: 0.3;
        pointer-events: none;
      }

      .glow {
        position: fixed;
        inset: -20% -20% auto auto;
        width: 420px;
        height: 420px;
        background: radial-gradient(circle, rgba(119, 240, 212, 0.2) 0%, transparent 70%);
        filter: blur(10px);
        pointer-events: none;
        animation: glowPulse 12s ease-in-out infinite;
      }

      @keyframes glowPulse {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 0.6;
        }
        50% {
          transform: translate3d(-20px, 10px, 0) scale(1.1);
          opacity: 0.9;
        }
      }

      main {
        position: relative;
        z-index: 1;
        max-width: 1260px;
        margin: 0 auto;
        padding: 52px 26px 80px;
        display: flex;
        flex-direction: column;
        gap: 28px;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
        gap: 24px;
        align-items: stretch;
      }

      .hero-copy {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.35em;
        font-size: 0.65rem;
        color: var(--accent-2);
        font-weight: 600;
      }

      h1 {
        font-family: 'Cormorant Garamond', serif;
        font-size: clamp(2.4rem, 3.4vw, 3.6rem);
        margin: 0;
        color: var(--ink);
        text-wrap: balance;
      }

      .hero-copy p {
        margin: 0;
        max-width: 520px;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.6;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .pill {
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(9, 17, 20, 0.6);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--accent-2);
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--panel-border);
        border-radius: var(--radius-lg);
        padding: 24px;
        box-shadow: var(--shadow);
        position: relative;
        overflow: hidden;
      }

      .card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top, rgba(119, 240, 212, 0.18), transparent 60%);
        opacity: 0.8;
        pointer-events: none;
      }

      .card > * {
        position: relative;
        z-index: 1;
      }

      .card-title {
        text-transform: uppercase;
        letter-spacing: 0.22em;
        font-size: 0.72rem;
        color: var(--accent-2);
      }

      .live-card {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .live-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .live-price {
        font-family: 'IBM Plex Mono', monospace;
        font-size: clamp(2.2rem, 4vw, 3.2rem);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.7rem;
        color: var(--accent-2);
      }

      .badge[data-state='warn'] {
        color: var(--danger);
        border-color: rgba(255, 139, 139, 0.4);
      }

      .live-grid {
        display: grid;
        gap: 8px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.9rem;
        font-variant-numeric: tabular-nums;
      }

      .live-row {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
      }

      .live-row span {
        min-width: 0;
      }

      .coverage {
        display: grid;
        gap: 8px;
      }

      .coverage-label {
        font-size: 0.75rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--accent-2);
      }

      .coverage-bar {
        height: 10px;
        border-radius: 999px;
        background: rgba(12, 24, 30, 0.8);
        border: 1px solid var(--panel-border);
        overflow: hidden;
      }

      .coverage-bar span {
        display: block;
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, rgba(119, 240, 212, 0.9), rgba(245, 184, 106, 0.9));
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.4s ease;
      }

      .coverage-meta {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 0.85rem;
        font-family: 'IBM Plex Mono', monospace;
        font-variant-numeric: tabular-nums;
      }

      .coverage-missing {
        color: var(--danger);
        word-break: break-word;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
      }

      .span-2 {
        grid-column: span 2;
      }

      .chart-shell {
        margin-top: 14px;
        padding: 18px;
        border-radius: var(--radius-md);
        background: linear-gradient(140deg, rgba(10, 20, 25, 0.8), rgba(10, 20, 25, 0.4));
        border: 1px solid rgba(119, 240, 212, 0.2);
        position: relative;
      }

      .chart-shell::before {
        content: '';
        position: absolute;
        inset: 12px;
        border-radius: 16px;
        border: 1px dashed rgba(119, 240, 212, 0.08);
        pointer-events: none;
      }

      #sparkline {
        width: 100%;
        height: 160px;
      }

      #sparkline-path {
        fill: none;
        stroke: var(--accent);
        stroke-width: 2.6;
        filter: drop-shadow(0 6px 18px rgba(245, 184, 106, 0.45));
      }

      #sparkline-area {
        fill: url(#sparkline-gradient);
        opacity: 0.8;
      }

      #sparkline-dot {
        fill: var(--accent-2);
        filter: drop-shadow(0 0 8px rgba(119, 240, 212, 0.8));
      }

      .sparkline-meta {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.8rem;
        margin-top: 10px;
      }

      .feed {
        margin-top: 16px;
        display: grid;
        gap: 10px;
      }

      details.minute-row {
        border-radius: var(--radius-sm);
        background: var(--panel-strong);
        border: 1px solid rgba(119, 240, 212, 0.12);
        overflow: hidden;
      }

      details.minute-row summary {
        list-style: none;
        cursor: pointer;
        display: grid;
        grid-template-columns: 1.1fr 1fr 0.8fr 0.6fr 24px;
        gap: 8px;
        padding: 12px 14px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.85rem;
        color: var(--muted);
        font-variant-numeric: tabular-nums;
        touch-action: manipulation;
      }

      details.minute-row summary > * {
        min-width: 0;
      }

      details.minute-row summary span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      details.minute-row summary:hover {
        background: rgba(119, 240, 212, 0.08);
      }

      details.minute-row summary:focus-visible {
        outline: 2px solid rgba(119, 240, 212, 0.6);
        outline-offset: 2px;
      }

      details.minute-row summary::-webkit-details-marker {
        display: none;
      }

      details.minute-row summary strong {
        color: var(--ink);
        font-weight: 600;
      }

      .chevron {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: rgba(119, 240, 212, 0.12);
        color: var(--accent-2);
        transition: transform 0.3s ease;
      }

      details[open] .chevron {
        transform: rotate(180deg);
      }

      .minute-detail {
        border-top: 1px solid rgba(119, 240, 212, 0.12);
        padding: 14px 16px 16px;
        display: grid;
        gap: 12px;
        font-size: 0.85rem;
        color: var(--muted);
      }

      .venue-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 10px;
      }

      .venue-card {
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(9, 17, 20, 0.6);
        border: 1px solid rgba(119, 240, 212, 0.16);
      }

      .venue-card strong {
        display: block;
        color: var(--ink);
        font-family: 'IBM Plex Mono', monospace;
      }

      .venue-card span {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.8rem;
      }

      .missing-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .missing-chip {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid rgba(255, 139, 139, 0.4);
        color: var(--danger);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .stat-grid {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }

      .stat {
        display: flex;
        justify-content: space-between;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.9rem;
        font-variant-numeric: tabular-nums;
      }

      .stat > * {
        min-width: 0;
      }

      .stat span {
        color: var(--muted);
      }

      .stat strong {
        color: var(--ink);
        font-weight: 600;
      }

      footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--muted);
        font-size: 0.85rem;
        font-family: 'IBM Plex Mono', monospace;
      }

      .status-line {
        color: var(--accent-2);
      }

      @media (prefers-reduced-motion: reduce) {
        .glow {
          animation: none;
        }

        details.minute-row summary {
          transition: none;
        }
      }

      @media (max-width: 980px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .grid {
          grid-template-columns: 1fr;
        }

        .span-2 {
          grid-column: span 1;
        }

        details.minute-row summary {
          grid-template-columns: 1fr 1fr;
          row-gap: 6px;
        }

        details.minute-row summary .chevron {
          justify-self: end;
        }
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to main content</a>
    <div class="glow"></div>
    <main id="main">
      <header class="hero">
        <div class="hero-copy">
          <div class="eyebrow">Flux Oracle Live</div>
          <h1>Minute-Grade FMV in Motion</h1>
          <p>
            Realtime window into the oracle pipeline. This page reads directly from the local API
            and visualizes the latest minute, hour, and venue coverage.
          </p>
          <div class="meta">
            <div class="pill" id="pair-pill">pair --</div>
            <div class="pill" id="venue-pill">venues --</div>
            <div class="pill" id="grace-pill">grace --</div>
          </div>
        </div>
        <div class="card live-card">
          <div class="live-head">
            <div>
              <div class="card-title">Live Minute</div>
              <div class="live-price" id="price-value" aria-live="polite">--</div>
            </div>
            <div class="badge" id="live-badge">--</div>
          </div>
          <div class="live-grid">
            <div class="live-row"><span>minute</span><span id="price-minute">--</span></div>
            <div class="live-row"><span>venues used</span><span id="price-venues">--</span></div>
            <div class="live-row"><span>degraded</span><span id="price-degraded">--</span></div>
          </div>
          <div class="coverage">
            <div class="coverage-label">venue coverage</div>
            <div class="coverage-bar"><span id="coverage-bar"></span></div>
            <div class="coverage-meta">
              <span id="coverage-count">--</span>
              <span class="coverage-missing" id="coverage-missing"></span>
            </div>
          </div>
          <div id="price-reason" class="coverage-missing"></div>
        </div>
      </header>

      <section class="grid">
        <div class="card span-2">
          <div class="card-title">Minute Runway</div>
          <div class="chart-shell">
            <svg id="sparkline" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#f5b86a" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#0a1216" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path id="sparkline-area" d=""></path>
              <path id="sparkline-path" d=""></path>
              <circle id="sparkline-dot" r="5" cx="0" cy="0" opacity="0"></circle>
            </svg>
          </div>
          <div class="sparkline-meta">
            <span id="sparkline-min">min --</span>
            <span id="sparkline-max">max --</span>
          </div>
          <div class="feed" id="minute-feed"></div>
        </div>

        <div class="card">
          <div class="card-title">Last Hour Report</div>
          <div class="stat-grid">
            <div class="stat"><span>window</span><strong id="hour-window">--</strong></div>
            <div class="stat"><span>open</span><strong id="hour-open">--</strong></div>
            <div class="stat"><span>high</span><strong id="hour-high">--</strong></div>
            <div class="stat"><span>low</span><strong id="hour-low">--</strong></div>
            <div class="stat"><span>close</span><strong id="hour-close">--</strong></div>
            <div class="stat"><span>minutes</span><strong id="hour-minutes">--</strong></div>
            <div class="stat"><span>anchored</span><strong id="hour-anchored">--</strong></div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Methodology</div>
          <div class="stat-grid">
            <div class="stat"><span>per venue</span><strong id="method-per">--</strong></div>
            <div class="stat"><span>reference</span><strong id="method-ref">--</strong></div>
            <div class="stat"><span>min venues</span><strong id="method-min">--</strong></div>
            <div class="stat"><span>outlier clip</span><strong id="method-clip">--</strong></div>
            <div class="stat"><span>degraded</span><strong id="method-degraded">--</strong></div>
          </div>
        </div>
      </section>

      <footer>
        <div class="status-line" id="status-line" aria-live="polite">status booting</div>
        <div>last update <span id="last-updated">--</span></div>
      </footer>
    </main>

    <script>
      const state = {
        pair: 'FLUXUSD',
        venues: [],
        minVenues: 0,
        grace: 0,
        latestMinuteTs: null,
        latestBreakdown: null,
        openMinuteTs: null
      };

      const el = (id) => document.getElementById(id);

      const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      });

      const fmtTime = (tsSeconds) => {
        if (!tsSeconds) return '--';
        return timeFormatter.format(new Date(tsSeconds * 1000));
      };

      const updateMinuteParam = (minuteTs) => {
        const url = new URL(window.location.href);
        if (minuteTs) {
          url.searchParams.set('minute', String(minuteTs));
        } else {
          url.searchParams.delete('minute');
        }
        window.history.replaceState({}, '', url.toString());
      };

      const fixedToNumber = (fixed) => {
        if (!fixed) return null;
        const neg = fixed.startsWith('-');
        const raw = neg ? fixed.slice(1) : fixed;
        const padded = raw.padStart(9, '0');
        const whole = padded.slice(0, -8) || '0';
        const frac = padded.slice(-8);
        const value = Number((neg ? '-' : '') + whole + '.' + frac);
        return Number.isFinite(value) ? value : null;
      };

      const formatUsdNumber = (value, decimals) => {
        if (value === null || value === undefined || Number.isNaN(value)) return '--';
        const formatter = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals ?? 4,
          maximumFractionDigits: decimals ?? 4
        });
        return formatter.format(value);
      };

      const formatUsd = (fixed, decimals) => {
        if (!fixed) return '--';
        const value = fixedToNumber(fixed);
        if (value === null) {
          return fixed;
        }
        return formatUsdNumber(value, decimals);
      };

      const setStatus = (text, warn) => {
        const line = el('status-line');
        if (!line) return;
        line.textContent = text;
        line.style.color = warn ? 'var(--danger)' : 'var(--accent-2)';
      };

      const fetchJson = async (path) => {
        const response = await fetch(path);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error('request failed: ' + response.status);
        }
        return response.json();
      };

      const selectLiveMinute = (items) => {
        if (!items || items.length === 0) return null;
        const withPrice = items.filter((row) => row.reference_price_fp);
        if (withPrice.length > 0) {
          return withPrice[withPrice.length - 1];
        }
        return items[items.length - 1];
      };

      const renderLive = (payload, breakdown) => {
        if (!payload) {
          el('price-value').textContent = '--';
          el('price-minute').textContent = '--';
          el('price-venues').textContent = '--';
          el('price-degraded').textContent = '--';
          el('live-badge').textContent = '--';
          el('coverage-count').textContent = '--';
          el('coverage-missing').textContent = '';
          el('coverage-bar').style.transform = 'scaleX(0)';
          el('price-reason').textContent = '';
          return;
        }

        el('price-value').textContent = payload.reference_price_fp
          ? formatUsd(payload.reference_price_fp)
          : '--';
        el('price-minute').textContent = fmtTime(payload.minute_ts);
        el('price-venues').textContent = String(payload.venues_used ?? '--');
        el('price-degraded').textContent = payload.degraded ? 'yes' : 'no';
        el('price-degraded').style.color = payload.degraded ? 'var(--danger)' : 'var(--ink)';

        const badge = el('live-badge');
        if (payload.degraded) {
          badge.textContent = 'degraded';
          badge.setAttribute('data-state', 'warn');
        } else {
          badge.textContent = 'ok';
          badge.removeAttribute('data-state');
        }

        el('price-reason').textContent = payload.degraded_reason
          ? 'reason: ' + payload.degraded_reason
          : '';

        const expected = state.venues.length || null;
        const used = payload.venues_used ?? 0;
        const bar = el('coverage-bar');
        if (expected) {
          const pct = Math.min(100, Math.max(0, Math.round((used / expected) * 100)));
          bar.style.transform = 'scaleX(' + pct / 100 + ')';
          el('coverage-count').textContent = used + ' / ' + expected + ' venues';
        } else {
          bar.style.transform = 'scaleX(0)';
          el('coverage-count').textContent = used + ' venues';
        }

        if (breakdown && breakdown.missing_venues && breakdown.missing_venues.length > 0) {
          el('coverage-missing').textContent = 'Missing: ' + breakdown.missing_venues.join(', ');
        } else {
          el('coverage-missing').textContent = '';
        }
      };

      const renderMinutes = (items) => {
        const feed = el('minute-feed');
        if (!feed) return;
        if (!items || items.length === 0) {
          feed.innerHTML = '<div class="coverage-missing">No minute data yet</div>';
          return;
        }

        const slice = items.slice(-10).reverse();
        feed.innerHTML = slice
          .map((row) => {
            const price = row.reference_price_fp ? formatUsd(row.reference_price_fp) : '--';
            const status = row.degraded ? 'degraded' : 'ok';
            const isOpen =
              state.openMinuteTs !== null && String(state.openMinuteTs) === String(row.minute_ts);
            return (
              '<details class="minute-row" data-minute="' +
              row.minute_ts +
              '"' +
              (isOpen ? ' open' : '') +
              '>' +
              '<summary>' +
              '<strong>' +
              fmtTime(row.minute_ts) +
              '</strong>' +
              '<span>' +
              price +
              '</span>' +
              '<span>' +
              row.venues_used +
              ' venues</span>' +
              '<span>' +
              status +
              '</span>' +
              '<span class="chevron">⌄</span>' +
              '</summary>' +
              '<div class="minute-detail">Open to load venues</div>' +
              '</details>'
            );
          })
          .join('');

        attachDetailHandlers();
      };

      const loadVenueBreakdown = async (detail) => {
        if (detail.dataset.loaded === 'true') return;
        detail.dataset.loaded = 'true';
        const minuteTs = detail.dataset.minute;
        const panel = detail.querySelector('.minute-detail');
        panel.textContent = 'loading venues…';
        try {
          const breakdown = await fetchJson(
            '/v1/minute/' + encodeURIComponent(state.pair) + '/' + minuteTs + '/venues'
          );
          if (!breakdown) {
            panel.textContent = 'No venue data yet';
            return;
          }

          const venues = breakdown.venues || [];
          const missing = breakdown.missing_venues || [];
          const venueHtml =
            '<div class="venue-grid">' +
            venues
              .map((entry) => {
                const price = entry.price_fp ? formatUsd(entry.price_fp) : '--';
                return (
                  '<div class="venue-card">' +
                  '<strong>' +
                  entry.venue +
                  '</strong>' +
                  '<span>' +
                  price +
                  '</span><br />' +
                  '<span>ticks ' +
                  entry.tick_count +
                  '</span>' +
                  '</div>'
                );
              })
              .join('') +
            '</div>';

          const missingHtml =
            missing.length > 0
              ? '<div class="missing-wrap">' +
                missing.map((venue) => '<span class="missing-chip">' + venue + '</span>').join('') +
                '</div>'
              : '<div class="coverage-missing">No missing venues</div>';

          panel.innerHTML = '<div>Venue Breakdown</div>' + venueHtml + '<div>' + missingHtml + '</div>';
        } catch (error) {
          panel.textContent = 'failed to load venue data — refresh to retry';
          console.error(error);
        }
      };

      const attachDetailHandlers = () => {
        const details = document.querySelectorAll('details.minute-row');
        details.forEach((detail) => {
          detail.addEventListener('toggle', () => {
            const minuteTs = detail.dataset.minute;
            if (detail.open) {
              state.openMinuteTs = minuteTs ? Number(minuteTs) : null;
              updateMinuteParam(state.openMinuteTs);
              void loadVenueBreakdown(detail);
            } else if (state.openMinuteTs && String(state.openMinuteTs) === String(minuteTs)) {
              state.openMinuteTs = null;
              updateMinuteParam(null);
            }
          });

          if (detail.open) {
            void loadVenueBreakdown(detail);
          }
        });
      };

      const renderSparkline = (items) => {
        const pathEl = el('sparkline-path');
        const areaEl = el('sparkline-area');
        const dotEl = el('sparkline-dot');
        if (!pathEl || !areaEl || !dotEl) return;
        const points = (items || [])
          .map((row) => ({
            ts: row.minute_ts,
            value: fixedToNumber(row.reference_price_fp)
          }))
          .filter((row) => row.value !== null);

        if (points.length < 2) {
          pathEl.setAttribute('d', '');
          areaEl.setAttribute('d', '');
          dotEl.setAttribute('opacity', '0');
          return;
        }

        const values = points.map((p) => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const width = 600;
        const height = 200;
        const step = width / (points.length - 1);

        const path = points
          .map((point, index) => {
            const x = index * step;
            const y = height - ((point.value - min) / range) * height;
            return (index === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
          })
          .join(' ');

        const area = path + ' L ' + width + ' ' + height + ' L 0 ' + height + ' Z';
        pathEl.setAttribute('d', path);
        areaEl.setAttribute('d', area);

        const last = points[points.length - 1];
        const lastX = (points.length - 1) * step;
        const lastY = height - ((last.value - min) / range) * height;
        dotEl.setAttribute('cx', lastX.toFixed(2));
        dotEl.setAttribute('cy', lastY.toFixed(2));
        dotEl.setAttribute('opacity', '1');

        el('sparkline-min').textContent = 'min ' + formatUsdNumber(min, 4);
        el('sparkline-max').textContent = 'max ' + formatUsdNumber(max, 4);
      };

      const renderHour = (hour) => {
        if (!hour) {
          el('hour-window').textContent = '--';
          return;
        }

        el('hour-window').textContent = fmtTime(hour.hour_ts) + ' - ' + fmtTime(hour.hour_ts + 3600);
        el('hour-open').textContent = hour.open_fp ? formatUsd(hour.open_fp) : '--';
        el('hour-high').textContent = hour.high_fp ? formatUsd(hour.high_fp) : '--';
        el('hour-low').textContent = hour.low_fp ? formatUsd(hour.low_fp) : '--';
        el('hour-close').textContent = hour.close_fp ? formatUsd(hour.close_fp) : '--';
        el('hour-minutes').textContent = hour.available_minutes ?? '--';
        el('hour-anchored').textContent = hour.anchored ? 'yes' : 'no';
      };

      const renderMethod = (method) => {
        if (!method) return;
        state.pair = method.pair || state.pair;
        state.venues = method.venues || [];
        state.minVenues = method.minVenuesPerMinute ?? 0;
        state.grace = method.graceSeconds ?? 0;

        el('pair-pill').textContent = 'pair ' + state.pair;
        el('venue-pill').textContent = 'venues ' + state.venues.length;
        el('grace-pill').textContent = 'grace ' + state.grace + 's';

        el('method-per').textContent = method.perVenueRule || '--';
        el('method-ref').textContent = method.referenceRule || '--';
        el('method-min').textContent = method.minVenuesPerMinute ?? '--';
        el('method-clip').textContent = String(method.outlierClipPct ?? '--') + '%';
        el('method-degraded').textContent = method.degradedPolicy || '--';
      };

      const refresh = async () => {
        try {
          const now = Math.floor(Date.now() / 1000);
          const pair = encodeURIComponent(state.pair);
          const [minutes, hours] = await Promise.all([
            fetchJson('/v1/minutes?pair=' + pair + '&start=' + (now - 3600) + '&end=' + now + '&limit=120'),
            fetchJson('/v1/hours?pair=' + pair + '&start=' + (now - 6 * 3600) + '&end=' + now + '&limit=6')
          ]);

          const minuteItems = minutes && minutes.items ? minutes.items : [];
          renderMinutes(minuteItems);
          renderSparkline(minuteItems);

          const live = selectLiveMinute(minuteItems);
          let breakdown = state.latestBreakdown;
          if (live && state.latestMinuteTs !== live.minute_ts) {
            state.latestMinuteTs = live.minute_ts;
            try {
              state.latestBreakdown = await fetchJson('/v1/minute/' + pair + '/' + live.minute_ts + '/venues');
            } catch (error) {
              console.error(error);
            }
            breakdown = state.latestBreakdown;
          }
          renderLive(live, breakdown);

          renderHour(hours && hours.items && hours.items.length ? hours.items[hours.items.length - 1] : null);

          el('last-updated').textContent = new Date().toISOString().slice(11, 19);
          setStatus('status live');
        } catch (error) {
          setStatus('status error', true);
          console.error(error);
        }
      };

      const boot = async () => {
        const params = new URLSearchParams(window.location.search);
        const minuteParam = params.get('minute');
        if (minuteParam && !Number.isNaN(Number(minuteParam))) {
          state.openMinuteTs = Number(minuteParam);
        }

        try {
          const method = await fetchJson('/v1/methodology');
          renderMethod(method);
        } catch (error) {
          console.error(error);
        }

        refresh();
        setInterval(refresh, 10000);
        setInterval(async () => {
          try {
            const method = await fetchJson('/v1/methodology');
            renderMethod(method);
          } catch (error) {
            console.error(error);
          }
        }, 60000);
      };

      boot();
    </script>
  </body>
</html>`;
