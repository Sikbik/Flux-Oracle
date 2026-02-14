export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Flux Oracle Live</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;600;700&family=Fraunces:opsz,wght@9..144,500;700&family=IBM+Plex+Mono:wght@400;600&display=swap');

      :root {
        color-scheme: dark;
        --bg: #0b1318;
        --bg-alt: #101c22;
        --panel: rgba(15, 26, 32, 0.9);
        --panel-strong: rgba(18, 32, 40, 0.95);
        --ink: #e4f1ef;
        --muted: #98b1ad;
        --accent: #f4b860;
        --accent-2: #7dd3c7;
        --danger: #f48a91;
        --line: rgba(125, 211, 199, 0.2);
        --shadow: 0 24px 60px rgba(5, 12, 14, 0.45);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: radial-gradient(circle at 15% 20%, rgba(125, 211, 199, 0.12), transparent 55%),
          radial-gradient(circle at 80% 0%, rgba(244, 184, 96, 0.12), transparent 45%),
          linear-gradient(160deg, #0b1318 0%, #0f1a20 45%, #0b1318 100%);
        color: var(--ink);
        font-family: 'Alegreya Sans', sans-serif;
        letter-spacing: 0.01em;
      }

      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 48px 48px;
        pointer-events: none;
        opacity: 0.4;
      }

      main {
        position: relative;
        z-index: 1;
        max-width: 1200px;
        margin: 0 auto;
        padding: 48px 24px 72px;
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
        letter-spacing: 0.3em;
        font-size: 0.7rem;
        color: var(--accent-2);
        font-weight: 600;
      }

      h1 {
        font-family: 'Fraunces', serif;
        font-size: clamp(2.2rem, 3vw, 3.2rem);
        margin: 0;
        color: var(--ink);
      }

      .hero-copy p {
        margin: 0;
        max-width: 520px;
        color: var(--muted);
        font-size: 1.05rem;
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
        background: rgba(11, 20, 24, 0.6);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 24px;
        box-shadow: var(--shadow);
        position: relative;
        overflow: hidden;
      }

      .card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top, rgba(125, 211, 199, 0.15), transparent 60%);
        opacity: 0.7;
        pointer-events: none;
      }

      .card > * {
        position: relative;
        z-index: 1;
      }

      .card-title {
        text-transform: uppercase;
        letter-spacing: 0.2em;
        font-size: 0.72rem;
        color: var(--accent-2);
      }

      .price {
        font-family: 'IBM Plex Mono', monospace;
        font-size: clamp(2.4rem, 4vw, 3.4rem);
        margin: 12px 0 18px;
      }

      .price-meta {
        display: grid;
        gap: 8px;
        font-size: 0.95rem;
        color: var(--muted);
      }

      .price-row {
        display: flex;
        justify-content: space-between;
        font-family: 'IBM Plex Mono', monospace;
      }

      .reason {
        margin-top: 12px;
        font-size: 0.9rem;
        color: var(--danger);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
      }

      .span-2 {
        grid-column: span 2;
      }

      .sparkline-wrap {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 14px;
      }

      #sparkline {
        width: 100%;
        height: 120px;
      }

      #sparkline-path {
        fill: none;
        stroke: var(--accent);
        stroke-width: 2.2;
      }

      #sparkline-area {
        fill: url(#sparkline-gradient);
        opacity: 0.8;
      }

      .sparkline-meta {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.8rem;
      }

      .feed {
        margin-top: 16px;
        display: grid;
        gap: 10px;
      }

      .feed-row {
        display: grid;
        grid-template-columns: 1.1fr 1fr 0.8fr 0.6fr;
        padding: 10px 12px;
        border-radius: 14px;
        background: var(--panel-strong);
        border: 1px solid rgba(125, 211, 199, 0.12);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.85rem;
        color: var(--muted);
      }

      .feed-row strong {
        color: var(--ink);
        font-weight: 600;
      }

      .hour-grid,
      .method-grid {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }

      .stat {
        display: flex;
        justify-content: space-between;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.9rem;
      }

      .stat span {
        color: var(--muted);
      }

      .stat strong {
        color: var(--ink);
        font-weight: 600;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid var(--line);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.7rem;
        color: var(--accent-2);
      }

      .badge[data-state='warn'] {
        color: var(--danger);
        border-color: rgba(244, 138, 145, 0.4);
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

      @media (max-width: 900px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .grid {
          grid-template-columns: 1fr;
        }

        .span-2 {
          grid-column: span 1;
        }

        .feed-row {
          grid-template-columns: 1fr 1fr;
          row-gap: 6px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="hero">
        <div class="hero-copy">
          <div class="eyebrow">Flux Oracle Live</div>
          <h1>Minute-grade FMV in motion</h1>
          <p>
            Realtime window into the oracle pipeline. This page reads directly from the local API
            and visualizes the latest minute, hour, and anchor context.
          </p>
          <div class="meta">
            <div class="pill" id="pair-pill">pair --</div>
            <div class="pill" id="venue-pill">venues --</div>
            <div class="pill" id="grace-pill">grace --</div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Live minute</div>
          <div class="price" id="price-value">--</div>
          <div class="price-meta">
            <div class="price-row"><span>minute</span><span id="price-minute">--</span></div>
            <div class="price-row"><span>venues used</span><span id="price-venues">--</span></div>
            <div class="price-row"><span>degraded</span><span id="price-degraded">--</span></div>
          </div>
          <div class="reason" id="price-reason"></div>
        </div>
      </header>

      <section class="grid">
        <div class="card span-2">
          <div class="card-title">Minute runway</div>
          <div class="sparkline-wrap">
            <svg id="sparkline" viewBox="0 0 300 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#f4b860" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#0b1318" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path id="sparkline-area" d=""></path>
              <path id="sparkline-path" d=""></path>
            </svg>
            <div class="sparkline-meta">
              <span id="sparkline-min">min --</span>
              <span id="sparkline-max">max --</span>
            </div>
          </div>
          <div class="feed" id="minute-feed"></div>
        </div>

        <div class="card">
          <div class="card-title">Last hour report</div>
          <div class="hour-grid">
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
          <div class="method-grid">
            <div class="stat"><span>per venue</span><strong id="method-per">--</strong></div>
            <div class="stat"><span>reference</span><strong id="method-ref">--</strong></div>
            <div class="stat"><span>min venues</span><strong id="method-min">--</strong></div>
            <div class="stat"><span>outlier clip</span><strong id="method-clip">--</strong></div>
            <div class="stat"><span>degraded</span><strong id="method-degraded">--</strong></div>
          </div>
        </div>
      </section>

      <footer>
        <div class="status-line" id="status-line">status booting</div>
        <div>last update <span id="last-updated">--</span></div>
      </footer>
    </main>

    <script>
      const state = {
        pair: 'FLUXUSD',
        venues: [],
        minVenues: 0,
        grace: 0
      };

      const el = (id) => document.getElementById(id);

      const fmtTime = (tsSeconds) => {
        if (!tsSeconds) return '--';
        const date = new Date(tsSeconds * 1000);
        return date.toISOString().slice(11, 19);
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

      const formatFixed = (fixed, decimals = 4) => {
        if (!fixed) return '--';
        const value = fixedToNumber(fixed);
        if (value === null) {
          return fixed;
        }
        return value.toFixed(decimals);
      };

      const setStatus = (text, warn = false) => {
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

      const renderPrice = (payload) => {
        el('price-value').textContent =
          payload && payload.reference_price_fp
            ? '$' + formatFixed(payload.reference_price_fp)
            : '--';
        el('price-minute').textContent = payload && payload.minute_ts ? fmtTime(payload.minute_ts) : '--';
        el('price-venues').textContent = payload ? payload.venues_used ?? '--' : '--';
        el('price-degraded').textContent = payload && payload.degraded ? 'yes' : 'no';
        el('price-degraded').style.color = payload && payload.degraded ? 'var(--danger)' : 'var(--ink)';
        el('price-reason').textContent =
          payload && payload.degraded_reason ? 'reason: ' + payload.degraded_reason : '';
      };

      const renderMinutes = (items) => {
        const feed = el('minute-feed');
        if (!feed) return;
        if (!items || items.length === 0) {
          feed.innerHTML = '<div class="feed-row">no minute data yet</div>';
          return;
        }

        const slice = items.slice(-10).reverse();
        feed.innerHTML = slice
          .map((row) => {
            const price = row.reference_price_fp ? '$' + formatFixed(row.reference_price_fp) : '--';
            return (
              '<div class="feed-row">' +
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
              (row.degraded ? 'degraded' : 'ok') +
              '</span>' +
              '</div>'
            );
          })
          .join('');
      };

      const renderSparkline = (items) => {
        const pathEl = el('sparkline-path');
        const areaEl = el('sparkline-area');
        if (!pathEl || !areaEl) return;
        const points = (items || [])
          .map((row) => ({
            ts: row.minute_ts,
            value: fixedToNumber(row.reference_price_fp)
          }))
          .filter((row) => row.value !== null);

        if (points.length < 2) {
          pathEl.setAttribute('d', '');
          areaEl.setAttribute('d', '');
          return;
        }

        const values = points.map((p) => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const width = 300;
        const height = 120;
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

        el('sparkline-min').textContent = 'min $' + min.toFixed(4);
        el('sparkline-max').textContent = 'max $' + max.toFixed(4);
      };

      const renderHour = (hour) => {
        if (!hour) {
          el('hour-window').textContent = '--';
          return;
        }

        el('hour-window').textContent = fmtTime(hour.hour_ts) + ' - ' + fmtTime(hour.hour_ts + 3600);
        el('hour-open').textContent = hour.open_fp ? '$' + formatFixed(hour.open_fp) : '--';
        el('hour-high').textContent = hour.high_fp ? '$' + formatFixed(hour.high_fp) : '--';
        el('hour-low').textContent = hour.low_fp ? '$' + formatFixed(hour.low_fp) : '--';
        el('hour-close').textContent = hour.close_fp ? '$' + formatFixed(hour.close_fp) : '--';
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
          const [price, minutes, hours] = await Promise.all([
            fetchJson('/v1/price_at?pair=' + pair + '&ts=' + now),
            fetchJson('/v1/minutes?pair=' + pair + '&start=' + (now - 3600) + '&end=' + now + '&limit=120'),
            fetchJson('/v1/hours?pair=' + pair + '&start=' + (now - 6 * 3600) + '&end=' + now + '&limit=6')
          ]);

          renderPrice(price);
          renderMinutes(minutes && minutes.items ? minutes.items : []);
          renderSparkline(minutes && minutes.items ? minutes.items : []);
          renderHour(hours && hours.items && hours.items.length ? hours.items[hours.items.length - 1] : null);

          el('last-updated').textContent = new Date().toISOString().slice(11, 19);
          setStatus('status live');
        } catch (error) {
          setStatus('status error', true);
          console.error(error);
        }
      };

      const boot = async () => {
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
