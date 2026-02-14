export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Flux Oracle Terminal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Exo+2:wght@500;600;700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"
    />
    <style>
      :root {
        color-scheme: dark;
        --bg: #05060b;
        --bg-deep: #030509;
        --panel: rgba(10, 16, 24, 0.92);
        --panel-strong: rgba(12, 20, 30, 0.96);
        --panel-border: rgba(76, 255, 194, 0.18);
        --panel-glow: rgba(76, 255, 194, 0.14);
        --ink: #e7f2ff;
        --muted: #96adbe;
        --accent: #28f0a5;
        --accent-2: #ffd166;
        --accent-3: #59a5ff;
        --danger: #ff6b6b;
        --shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
        --radius-lg: 22px;
        --radius-md: 16px;
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
        background: radial-gradient(circle at 15% 20%, rgba(40, 240, 165, 0.16), transparent 55%),
          radial-gradient(circle at 85% 10%, rgba(89, 165, 255, 0.16), transparent 55%),
          linear-gradient(180deg, #05060b 0%, #060a13 45%, #05060b 100%);
        color: var(--ink);
        font-family: 'Instrument Sans', sans-serif;
        letter-spacing: 0.01em;
      }

      .bg-grid {
        position: fixed;
        inset: 0;
        background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
        background-size: 64px 64px;
        opacity: 0.25;
        pointer-events: none;
        z-index: 0;
      }

      .bg-glow {
        position: fixed;
        inset: -20% auto auto -10%;
        width: 520px;
        height: 520px;
        background: radial-gradient(circle, rgba(40, 240, 165, 0.25), transparent 70%);
        filter: blur(8px);
        opacity: 0.6;
        pointer-events: none;
        z-index: 0;
        animation: glowPulse 14s ease-in-out infinite;
      }

      .bg-noise {
        position: fixed;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E");
        opacity: 0.08;
        mix-blend-mode: screen;
        pointer-events: none;
        z-index: 0;
      }

      @keyframes glowPulse {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 0.5;
        }
        50% {
          transform: translate3d(30px, -10px, 0) scale(1.08);
          opacity: 0.9;
        }
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
        z-index: 3;
      }

      .skip-link:focus-visible {
        transform: translateY(0);
        outline: 2px solid rgba(40, 240, 165, 0.6);
        outline-offset: 2px;
      }

      header.terminal-header {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 42px 48px 18px;
        gap: 24px;
        flex-wrap: wrap;
      }

      .brand {
        display: grid;
        gap: 6px;
      }

      .brand-title {
        font-family: 'Exo 2', sans-serif;
        font-size: clamp(2rem, 3.2vw, 3.1rem);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .brand-sub {
        color: var(--muted);
        max-width: 520px;
      }

      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .chip {
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--panel-border);
        background: rgba(6, 12, 18, 0.8);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--accent);
      }

      .status-chip {
        color: var(--accent-2);
        border-color: rgba(255, 209, 102, 0.4);
      }

      .status-chip[data-state='warn'] {
        color: var(--danger);
        border-color: rgba(255, 107, 107, 0.5);
      }

      .ticker {
        position: relative;
        z-index: 1;
        margin: 0 48px 28px;
        padding: 12px 18px;
        border-radius: 999px;
        background: rgba(6, 12, 18, 0.75);
        border: 1px solid rgba(76, 255, 194, 0.22);
        display: flex;
        flex-wrap: wrap;
        gap: 16px 24px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        box-shadow: var(--shadow);
      }

      .ticker-item {
        display: flex;
        gap: 8px;
        align-items: center;
        color: var(--muted);
      }

      .ticker-item span {
        color: var(--ink);
      }

      .ticker-item.status-line {
        color: var(--accent);
      }

      main.layout {
        position: relative;
        z-index: 1;
        max-width: 1320px;
        margin: 0 auto;
        padding: 0 48px 80px;
        display: grid;
        grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
        grid-template-rows: auto auto auto;
        gap: 20px;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--panel-border);
        border-radius: var(--radius-lg);
        padding: 22px;
        box-shadow: var(--shadow);
        position: relative;
        overflow: hidden;
        animation: panelEnter 0.6s ease both;
        animation-delay: var(--delay, 0s);
      }

      .panel::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top, rgba(40, 240, 165, 0.18), transparent 55%);
        opacity: 0.8;
        pointer-events: none;
      }

      .panel > * {
        position: relative;
        z-index: 1;
      }

      @keyframes panelEnter {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .panel-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 12px;
      }

      .panel-title {
        font-family: 'Exo 2', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        font-size: 0.8rem;
        color: var(--accent);
      }

      .panel-sub {
        color: var(--muted);
        font-size: 0.9rem;
      }

      .panel-meta {
        display: flex;
        gap: 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
        color: var(--muted);
      }

      .panel-chart {
        grid-row: 1 / span 3;
        min-height: 540px;
      }

      .chart-shell {
        margin-top: 12px;
        padding: 18px;
        border-radius: var(--radius-md);
        background: linear-gradient(150deg, rgba(6, 12, 18, 0.9), rgba(6, 12, 18, 0.4));
        border: 1px solid rgba(76, 255, 194, 0.2);
      }

      #sparkline {
        width: 100%;
        height: 190px;
      }

      #sparkline-path {
        fill: none;
        stroke: var(--accent-2);
        stroke-width: 2.6;
        stroke-linecap: round;
        filter: drop-shadow(0 6px 16px rgba(255, 209, 102, 0.4));
      }

      #sparkline-area {
        fill: url(#sparkline-gradient);
        opacity: 0.8;
      }

      #sparkline-dot {
        fill: var(--accent);
        filter: drop-shadow(0 0 12px rgba(40, 240, 165, 0.9));
      }

      .feed-head {
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1.1fr 1fr 0.8fr 0.6fr 24px;
        gap: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .feed {
        margin-top: 12px;
        display: grid;
        gap: 10px;
      }

      details.minute-row {
        border-radius: var(--radius-sm);
        background: var(--panel-strong);
        border: 1px solid rgba(76, 255, 194, 0.12);
        overflow: hidden;
      }

      details.minute-row summary {
        list-style: none;
        cursor: pointer;
        display: grid;
        grid-template-columns: 1.1fr 1fr 0.8fr 0.6fr 24px;
        gap: 8px;
        padding: 12px 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.82rem;
        color: var(--muted);
        font-variant-numeric: tabular-nums;
      }

      details.minute-row summary strong {
        color: var(--ink);
        font-weight: 600;
      }

      details.minute-row summary:hover {
        background: rgba(40, 240, 165, 0.08);
      }

      details.minute-row summary:focus-visible {
        outline: 2px solid rgba(40, 240, 165, 0.6);
        outline-offset: 2px;
      }

      details.minute-row summary::-webkit-details-marker {
        display: none;
      }

      .status-tag {
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid rgba(40, 240, 165, 0.4);
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.7rem;
        text-align: center;
      }

      .status-tag[data-state='degraded'] {
        color: var(--danger);
        border-color: rgba(255, 107, 107, 0.5);
      }

      .chevron {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: rgba(40, 240, 165, 0.12);
        color: var(--accent);
        transition: transform 0.3s ease;
        font-size: 0.9rem;
      }

      details[open] .chevron {
        transform: rotate(180deg);
      }

      .minute-detail {
        border-top: 1px solid rgba(76, 255, 194, 0.12);
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
        background: rgba(6, 12, 18, 0.7);
        border: 1px solid rgba(76, 255, 194, 0.2);
      }

      .venue-card strong {
        display: block;
        color: var(--ink);
        font-family: 'JetBrains Mono', monospace;
      }

      .venue-card span {
        font-family: 'JetBrains Mono', monospace;
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
        border: 1px solid rgba(255, 107, 107, 0.5);
        color: var(--danger);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .panel-live .live-price {
        font-family: 'JetBrains Mono', monospace;
        font-size: clamp(2.4rem, 4vw, 3.6rem);
        margin: 8px 0 12px;
      }

      .live-grid {
        display: grid;
        gap: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.88rem;
        color: var(--muted);
      }

      .live-row {
        display: flex;
        justify-content: space-between;
      }

      .coverage {
        margin-top: 14px;
        display: grid;
        gap: 8px;
      }

      .coverage-label {
        font-size: 0.72rem;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--accent);
      }

      .coverage-bar {
        height: 10px;
        border-radius: 999px;
        background: rgba(6, 12, 18, 0.8);
        border: 1px solid var(--panel-border);
        overflow: hidden;
      }

      .coverage-bar span {
        display: block;
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, rgba(40, 240, 165, 0.95), rgba(255, 209, 102, 0.95));
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.4s ease;
      }

      .coverage-meta {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 0.82rem;
        font-family: 'JetBrains Mono', monospace;
      }

      .coverage-missing {
        color: var(--danger);
        word-break: break-word;
      }

      .reason {
        color: var(--danger);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
      }

      .stat-grid {
        display: grid;
        gap: 12px;
        margin-top: 12px;
      }

      .stat {
        display: flex;
        justify-content: space-between;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.88rem;
        font-variant-numeric: tabular-nums;
      }

      .stat span {
        color: var(--muted);
      }

      .stat strong {
        color: var(--ink);
        font-weight: 600;
      }

      footer {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 26px 48px 32px;
        color: var(--muted);
        font-size: 0.82rem;
        font-family: 'JetBrains Mono', monospace;
      }

      @media (prefers-reduced-motion: reduce) {
        .bg-glow,
        .panel {
          animation: none;
        }
      }

      @media (max-width: 1080px) {
        header.terminal-header {
          padding: 32px 24px 12px;
        }

        .ticker {
          margin: 0 24px 22px;
        }

        main.layout {
          padding: 0 24px 70px;
          grid-template-columns: 1fr;
          grid-template-rows: auto;
        }

        .panel-chart {
          grid-row: auto;
          min-height: auto;
        }

        .feed-head,
        details.minute-row summary {
          grid-template-columns: 1fr 1fr;
          row-gap: 6px;
        }

        details.minute-row summary .chevron {
          justify-self: end;
        }

        footer {
          margin: 24px;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to main content</a>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>
    <div class="bg-noise"></div>

    <header class="terminal-header">
      <div class="brand">
        <div class="brand-title">Flux Oracle Terminal</div>
        <div class="brand-sub">
          Minute-grade FMV, stitched from multiple venues and streamed directly from the local API.
        </div>
      </div>
      <div class="chip-row">
        <div class="chip" id="pair-pill">pair --</div>
        <div class="chip" id="venue-pill">venues --</div>
        <div class="chip" id="grace-pill">grace --</div>
        <div class="chip status-chip" id="live-badge">--</div>
      </div>
    </header>

    <section class="ticker" aria-live="polite">
      <div class="ticker-item">PAIR <span id="pair-ticker">--</span></div>
      <div class="ticker-item">FMV <span id="price-value-mini">--</span></div>
      <div class="ticker-item">MINUTE <span id="price-minute">--</span></div>
      <div class="ticker-item">VENUES <span id="price-venues">--</span></div>
      <div class="ticker-item">DEGRADED <span id="price-degraded">--</span></div>
      <div class="ticker-item status-line" id="status-line">status booting</div>
      <div class="ticker-item">UPDATED <span id="last-updated">--</span></div>
    </section>

    <main id="main" class="layout">
      <section class="panel panel-chart" style="--delay: 0.05s">
        <div class="panel-head">
          <div>
            <div class="panel-title">Minute Runway</div>
            <div class="panel-sub">Latest 60 minutes (UTC)</div>
          </div>
          <div class="panel-meta">
            <span id="sparkline-min">min --</span>
            <span id="sparkline-max">max --</span>
          </div>
        </div>
        <div class="chart-shell">
          <svg id="sparkline" viewBox="0 0 600 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#ffd166" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#05060b" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path id="sparkline-area" d=""></path>
            <path id="sparkline-path" d=""></path>
            <circle id="sparkline-dot" r="5" cx="0" cy="0" opacity="0"></circle>
          </svg>
        </div>
        <div class="feed-head">
          <span>Time</span>
          <span>Price</span>
          <span>Coverage</span>
          <span>Status</span>
          <span></span>
        </div>
        <div class="feed" id="minute-feed"></div>
      </section>

      <section class="panel panel-live" style="--delay: 0.12s">
        <div class="panel-head">
          <div>
            <div class="panel-title">Live Minute</div>
            <div class="panel-sub">FMV reference</div>
          </div>
        </div>
        <div class="live-price" id="price-value" aria-live="polite">--</div>
        <div class="live-grid">
          <div class="live-row"><span>minute</span><span id="price-minute-live">--</span></div>
          <div class="live-row"><span>venues used</span><span id="price-venues-live">--</span></div>
          <div class="live-row"><span>degraded</span><span id="price-degraded-live">--</span></div>
        </div>
        <div class="coverage">
          <div class="coverage-label">venue coverage</div>
          <div class="coverage-bar"><span id="coverage-bar"></span></div>
          <div class="coverage-meta">
            <span id="coverage-count">--</span>
            <span class="coverage-missing" id="coverage-missing"></span>
          </div>
        </div>
        <div id="price-reason" class="reason"></div>
      </section>

      <section class="panel" style="--delay: 0.2s">
        <div class="panel-head">
          <div>
            <div class="panel-title">Last Hour</div>
            <div class="panel-sub">Aggregated summary</div>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat"><span>window</span><strong id="hour-window">--</strong></div>
          <div class="stat"><span>open</span><strong id="hour-open">--</strong></div>
          <div class="stat"><span>high</span><strong id="hour-high">--</strong></div>
          <div class="stat"><span>low</span><strong id="hour-low">--</strong></div>
          <div class="stat"><span>close</span><strong id="hour-close">--</strong></div>
          <div class="stat"><span>minutes</span><strong id="hour-minutes">--</strong></div>
          <div class="stat"><span>anchored</span><strong id="hour-anchored">--</strong></div>
        </div>
      </section>

      <section class="panel" style="--delay: 0.28s">
        <div class="panel-head">
          <div>
            <div class="panel-title">Methodology</div>
            <div class="panel-sub">Pricing rules</div>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat"><span>per venue</span><strong id="method-per">--</strong></div>
          <div class="stat"><span>reference</span><strong id="method-ref">--</strong></div>
          <div class="stat"><span>min venues</span><strong id="method-min">--</strong></div>
          <div class="stat"><span>outlier clip</span><strong id="method-clip">--</strong></div>
          <div class="stat"><span>degraded</span><strong id="method-degraded">--</strong></div>
        </div>
      </section>
    </main>

    <footer>
      <span>Local API feed · UTC timeline · Per-minute venue drilldown</span>
      <span>Flux Oracle UI</span>
    </footer>

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

      const setText = (id, value) => {
        const node = el(id);
        if (node) {
          node.textContent = value;
        }
      };

      const setStatus = (text, warn) => {
        const line = el('status-line');
        if (!line) return;
        line.textContent = text;
        line.style.color = warn ? 'var(--danger)' : 'var(--accent)';
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
          setText('price-value', '--');
          setText('price-value-mini', '--');
          setText('price-minute', '--');
          setText('price-minute-live', '--');
          setText('price-venues', '--');
          setText('price-venues-live', '--');
          setText('price-degraded', '--');
          setText('price-degraded-live', '--');
          setText('coverage-count', '--');
          setText('coverage-missing', '');
          const bar = el('coverage-bar');
          if (bar) {
            bar.style.transform = 'scaleX(0)';
          }
          setText('price-reason', '');
          return;
        }

        const liveValue = payload.reference_price_fp ? formatUsd(payload.reference_price_fp) : '--';
        setText('price-value', liveValue);
        setText('price-value-mini', liveValue);

        setText('price-minute', fmtTime(payload.minute_ts));
        setText('price-minute-live', fmtTime(payload.minute_ts));

        const venuesUsed = String(payload.venues_used ?? '--');
        setText('price-venues', venuesUsed);
        setText('price-venues-live', venuesUsed);

        const degradedText = payload.degraded ? 'yes' : 'no';
        setText('price-degraded', degradedText);
        setText('price-degraded-live', degradedText);

        const degradeEl = el('price-degraded');
        if (degradeEl) {
          degradeEl.style.color = payload.degraded ? 'var(--danger)' : 'var(--ink)';
        }
        const degradeLiveEl = el('price-degraded-live');
        if (degradeLiveEl) {
          degradeLiveEl.style.color = payload.degraded ? 'var(--danger)' : 'var(--ink)';
        }

        const badge = el('live-badge');
        if (badge) {
          if (payload.degraded) {
            badge.textContent = 'degraded';
            badge.setAttribute('data-state', 'warn');
          } else {
            badge.textContent = 'ok';
            badge.removeAttribute('data-state');
          }
        }

        setText(
          'price-reason',
          payload.degraded_reason ? 'reason: ' + payload.degraded_reason : ''
        );

        const expected = state.venues.length || null;
        const used = payload.venues_used ?? 0;
        const bar = el('coverage-bar');
        if (bar) {
          if (expected) {
            const pct = Math.min(100, Math.max(0, Math.round((used / expected) * 100)));
            bar.style.transform = 'scaleX(' + pct / 100 + ')';
            setText('coverage-count', used + ' / ' + expected + ' venues');
          } else {
            bar.style.transform = 'scaleX(0)';
            setText('coverage-count', used + ' venues');
          }
        }

        if (breakdown && breakdown.missing_venues && breakdown.missing_venues.length > 0) {
          setText('coverage-missing', 'Missing: ' + breakdown.missing_venues.join(', '));
        } else {
          setText('coverage-missing', '');
        }
      };

      const renderMinutes = (items) => {
        const feed = el('minute-feed');
        if (!feed) return;
        if (!items || items.length === 0) {
          feed.innerHTML = '<div class="coverage-missing">No minute data yet</div>';
          return;
        }

        const expected = state.venues.length || null;
        const slice = items.slice(-10).reverse();
        feed.innerHTML = slice
          .map((row) => {
            const price = row.reference_price_fp ? formatUsd(row.reference_price_fp) : '--';
            const status = row.degraded ? 'degraded' : 'ok';
            const isOpen =
              state.openMinuteTs !== null && String(state.openMinuteTs) === String(row.minute_ts);
            const coverage = expected ? row.venues_used + '/' + expected : row.venues_used + '';
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
              coverage +
              '</span>' +
              '<span class="status-tag" data-state="' +
              status +
              '">' +
              status +
              '</span>' +
              '<span class="chevron">v</span>' +
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

        setText('sparkline-min', 'min ' + formatUsdNumber(min, 4));
        setText('sparkline-max', 'max ' + formatUsdNumber(max, 4));
      };

      const renderHour = (hour) => {
        if (!hour) {
          setText('hour-window', '--');
          return;
        }

        setText('hour-window', fmtTime(hour.hour_ts) + ' - ' + fmtTime(hour.hour_ts + 3600));
        setText('hour-open', hour.open_fp ? formatUsd(hour.open_fp) : '--');
        setText('hour-high', hour.high_fp ? formatUsd(hour.high_fp) : '--');
        setText('hour-low', hour.low_fp ? formatUsd(hour.low_fp) : '--');
        setText('hour-close', hour.close_fp ? formatUsd(hour.close_fp) : '--');
        setText('hour-minutes', hour.available_minutes ?? '--');
        setText('hour-anchored', hour.anchored ? 'yes' : 'no');
      };

      const renderMethod = (method) => {
        if (!method) return;
        state.pair = method.pair || state.pair;
        state.venues = method.venues || [];
        state.minVenues = method.minVenuesPerMinute ?? 0;
        state.grace = method.graceSeconds ?? 0;

        setText('pair-pill', 'pair ' + state.pair);
        setText('venue-pill', 'venues ' + state.venues.length);
        setText('grace-pill', 'grace ' + state.grace + 's');
        setText('pair-ticker', state.pair);

        setText('method-per', method.perVenueRule || '--');
        setText('method-ref', method.referenceRule || '--');
        setText('method-min', method.minVenuesPerMinute ?? '--');
        setText('method-clip', String(method.outlierClipPct ?? '--') + '%');
        setText('method-degraded', method.degradedPolicy || '--');
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

          setText('last-updated', new Date().toISOString().slice(11, 19));
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
