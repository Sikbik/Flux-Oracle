export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Flux Oracle</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Oxanium:wght@500;600;700&display=swap"
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
        font-family: 'Oxanium', sans-serif;
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
        overflow: visible;
        animation: panelEnter 0.6s ease both;
        animation-delay: var(--delay, 0s);
      }

      .panel::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
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
        font-family: 'Oxanium', sans-serif;
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
        grid-row: 1 / span 4;
        min-height: 540px;
      }

      .chart-shell {
        margin-top: 12px;
        padding: 18px;
        border-radius: var(--radius-md);
        background: linear-gradient(160deg, rgba(6, 12, 18, 0.92), rgba(6, 12, 18, 0.38));
        border: 1px solid rgba(76, 255, 194, 0.22);
        backdrop-filter: blur(14px);
      }

      .chart-command {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 4px 2px 14px;
        flex-wrap: wrap;
      }

      .range-tabs {
        display: inline-flex;
        gap: 6px;
        padding: 6px;
        border-radius: 999px;
        background: rgba(5, 8, 12, 0.72);
        border: 1px solid rgba(231, 242, 255, 0.08);
        box-shadow: 0 16px 28px rgba(0, 0, 0, 0.35);
      }

      .range-tab {
        appearance: none;
        border: 0;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 999px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(231, 242, 255, 0.74);
        background: transparent;
        transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
      }

      .range-tab:hover {
        transform: translateY(-1px);
        background: rgba(89, 165, 255, 0.1);
        color: var(--ink);
      }

      .range-tab.is-active {
        background: rgba(40, 240, 165, 0.14);
        color: var(--accent);
        box-shadow: inset 0 0 0 1px rgba(40, 240, 165, 0.18),
          0 0 0 1px rgba(40, 240, 165, 0.08);
      }

      .range-tab:focus-visible {
        outline: 2px solid rgba(40, 240, 165, 0.65);
        outline-offset: 2px;
      }

      .range-toggle {
        appearance: none;
        border: 1px solid rgba(255, 209, 102, 0.28);
        background: rgba(5, 8, 12, 0.72);
        color: rgba(255, 209, 102, 0.92);
        border-radius: 999px;
        padding: 10px 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.74rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        box-shadow: 0 16px 28px rgba(0, 0, 0, 0.35);
      }

      .range-toggle:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 209, 102, 0.45);
        background: rgba(255, 209, 102, 0.08);
      }

      .range-toggle[aria-pressed='true'] {
        border-color: rgba(255, 107, 107, 0.55);
        color: rgba(255, 107, 107, 0.92);
        background: rgba(255, 107, 107, 0.12);
      }

      .chart-stage {
        position: relative;
        border-radius: calc(var(--radius-md) - 2px);
        overflow: visible;
        background: radial-gradient(circle at 18% 22%, rgba(89, 165, 255, 0.1), transparent 58%),
          radial-gradient(circle at 70% 10%, rgba(40, 240, 165, 0.12), transparent 50%),
          linear-gradient(180deg, rgba(3, 5, 9, 0.9) 0%, rgba(5, 6, 11, 0.5) 100%);
        border: 1px solid rgba(231, 242, 255, 0.08);
      }

      .chart-viewport {
        border-radius: inherit;
        overflow: hidden;
      }

      #sparkline {
        width: 100%;
        height: 260px;
        display: block;
      }

      #sparkline-path {
        fill: none;
        stroke: var(--accent-2);
        stroke-width: 2.8;
        stroke-linecap: round;
        opacity: 0.92;
      }

      #sparkline-path-glow {
        fill: none;
        stroke: rgba(255, 209, 102, 0.85);
        stroke-width: 6.2;
        stroke-linecap: round;
        opacity: 0.38;
      }

      #sparkline-area {
        fill: url(#sparkline-gradient);
        opacity: 0.9;
      }

      #sparkline-dot {
        fill: var(--accent);
        filter: drop-shadow(0 0 12px rgba(40, 240, 165, 0.9));
      }

      #sparkline-hit {
        fill: transparent;
        cursor: crosshair;
      }

      #sparkline-xhair,
      #sparkline-yhair {
        stroke: rgba(231, 242, 255, 0.22);
        stroke-width: 1;
        stroke-dasharray: 4 6;
        pointer-events: none;
      }

      .chart-tooltip {
        --x: 0;
        --y: 0;
        position: absolute;
        z-index: 4;
        left: 0;
        top: 0;
        transform: translate3d(calc(var(--x) * 1px), calc(var(--y) * 1px), 0);
        padding: 10px 12px;
        border-radius: 16px;
        border: 1px solid rgba(76, 255, 194, 0.22);
        background: rgba(6, 10, 16, 0.72);
        backdrop-filter: blur(16px);
        box-shadow: 0 18px 34px rgba(0, 0, 0, 0.5);
        pointer-events: none;
        min-width: 190px;
        font-family: 'JetBrains Mono', monospace;
      }

      #tooltip-layer {
        position: fixed;
        inset: 0;
        z-index: 30;
        pointer-events: none;
      }

      .tt-kicker {
        text-transform: uppercase;
        letter-spacing: 0.22em;
        font-size: 0.7rem;
        color: rgba(150, 173, 190, 0.92);
      }

      .tt-price {
        font-size: 1.05rem;
        margin-top: 4px;
        color: var(--ink);
        font-weight: 600;
      }

      .tt-meta {
        margin-top: 6px;
        color: rgba(150, 173, 190, 0.95);
        font-size: 0.78rem;
      }

      .chart-axis {
        margin-top: 12px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(150, 173, 190, 0.9);
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

      .venue-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        font-family: 'JetBrains Mono', monospace;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(150, 173, 190, 0.92);
        font-size: 0.72rem;
      }

      .venue-ref {
        color: rgba(255, 209, 102, 0.92);
      }

      .venue-card {
        position: relative;
        padding: 10px 12px;
        border-radius: 14px;
        background: linear-gradient(
          160deg,
          rgba(6, 12, 18, 0.92),
          rgba(6, 12, 18, 0.55)
        );
        border: 1px solid rgba(231, 242, 255, 0.1);
        box-shadow: 0 18px 26px rgba(0, 0, 0, 0.28);
        transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
      }

      .venue-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(circle at top, rgba(40, 240, 165, 0.14), transparent 55%);
        opacity: 0.75;
        pointer-events: none;
      }

      .venue-card:hover {
        transform: translateY(-2px);
        border-color: rgba(76, 255, 194, 0.22);
      }

      .venue-top {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
      }

      .venue-top strong {
        color: var(--ink);
        font-family: 'JetBrains Mono', monospace;
      }

      .venue-delta {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
        color: rgba(150, 173, 190, 0.85);
        font-variant-numeric: tabular-nums;
      }

      .venue-card[data-trend='up'] .venue-delta {
        color: rgba(40, 240, 165, 0.95);
      }

      .venue-card[data-trend='down'] .venue-delta {
        color: rgba(255, 107, 107, 0.95);
      }

      .venue-price {
        position: relative;
        z-index: 1;
        margin-top: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 1rem;
        color: var(--ink);
        font-variant-numeric: tabular-nums;
      }

      .venue-sub {
        position: relative;
        z-index: 1;
        margin-top: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.74rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(150, 173, 190, 0.9);
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

      .decoder-shell {
        margin-top: 12px;
        padding: 18px;
        border-radius: var(--radius-md);
        background: linear-gradient(165deg, rgba(6, 12, 18, 0.92), rgba(6, 12, 18, 0.42));
        border: 1px solid rgba(76, 255, 194, 0.2);
        backdrop-filter: blur(14px);
        display: grid;
        gap: 12px;
      }

      .decoder-label {
        color: rgba(150, 173, 190, 0.92);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .decoder-input {
        width: 100%;
        min-height: 118px;
        resize: vertical;
        border-radius: var(--radius-md);
        padding: 12px 12px;
        border: 1px solid rgba(231, 242, 255, 0.12);
        background: rgba(5, 8, 12, 0.76);
        color: var(--ink);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
        line-height: 1.5;
        outline: none;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
      }

      .decoder-input:focus {
        border-color: rgba(40, 240, 165, 0.55);
        box-shadow: 0 0 0 2px rgba(40, 240, 165, 0.16);
      }

      .decoder-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 10px;
      }

      .decoder-btn {
        appearance: none;
        border: 1px solid rgba(76, 255, 194, 0.24);
        background: rgba(40, 240, 165, 0.1);
        color: rgba(40, 240, 165, 0.92);
        border-radius: 999px;
        padding: 10px 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.74rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        box-shadow: 0 16px 28px rgba(0, 0, 0, 0.3);
      }

      .decoder-btn:hover {
        transform: translateY(-1px);
        border-color: rgba(76, 255, 194, 0.4);
        background: rgba(40, 240, 165, 0.16);
      }

      .decoder-btn:focus-visible {
        outline: 2px solid rgba(40, 240, 165, 0.65);
        outline-offset: 2px;
      }

      .decoder-btn-ghost {
        border-color: rgba(231, 242, 255, 0.12);
        background: rgba(5, 8, 12, 0.76);
        color: rgba(231, 242, 255, 0.76);
      }

      .decoder-btn-ghost:hover {
        border-color: rgba(231, 242, 255, 0.18);
        background: rgba(89, 165, 255, 0.08);
      }

      .decoder-btn-mini {
        padding: 8px 12px;
        font-size: 0.7rem;
        letter-spacing: 0.16em;
      }

      .decoder-status {
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        border: 1px solid rgba(231, 242, 255, 0.1);
        background: rgba(5, 8, 12, 0.62);
        color: rgba(150, 173, 190, 0.9);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
        line-height: 1.35;
        word-break: break-word;
      }

      .decoder-status[data-state='ok'] {
        color: rgba(40, 240, 165, 0.92);
        border-color: rgba(76, 255, 194, 0.22);
        background: rgba(40, 240, 165, 0.08);
      }

      .decoder-status[data-state='err'] {
        color: rgba(255, 107, 107, 0.92);
        border-color: rgba(255, 107, 107, 0.38);
        background: rgba(255, 107, 107, 0.08);
      }

      .decoder-output {
        display: grid;
        gap: 14px;
      }

      .decoder-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .decoder-kv {
        padding: 12px 12px;
        border-radius: var(--radius-md);
        border: 1px solid rgba(231, 242, 255, 0.08);
        background: rgba(3, 5, 9, 0.6);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
      }

      .decoder-kv span {
        display: block;
        color: rgba(150, 173, 190, 0.88);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .decoder-kv strong {
        display: block;
        margin-top: 6px;
        color: var(--ink);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.86rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        word-break: break-word;
      }

      .decoder-raw-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 2px 2px 10px;
        color: rgba(150, 173, 190, 0.92);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .decoder-raw pre {
        margin: 0;
        padding: 12px 12px;
        border-radius: var(--radius-md);
        border: 1px solid rgba(231, 242, 255, 0.08);
        background: rgba(3, 5, 9, 0.86);
        overflow: auto;
        color: rgba(231, 242, 255, 0.84);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.76rem;
        line-height: 1.55;
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

        .decoder-grid {
          grid-template-columns: 1fr;
        }

        .decoder-actions {
          justify-content: flex-start;
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
        <div class="brand-title">Flux Oracle</div>
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
            <div class="panel-sub" id="runway-sub">Latest 60 minutes (UTC)</div>
          </div>
          <div class="panel-meta">
            <span id="sparkline-min">min --</span>
            <span id="sparkline-max">max --</span>
          </div>
        </div>
        <div class="chart-shell">
          <div class="chart-command" role="group" aria-label="Runway controls">
            <div class="range-tabs" role="tablist" aria-label="Runway range">
              <button class="range-tab is-active" type="button" data-range="1h">1H</button>
              <button class="range-tab" type="button" data-range="3h">3H</button>
              <button class="range-tab" type="button" data-range="6h">6H</button>
              <button class="range-tab" type="button" data-range="12h">12H</button>
              <button class="range-tab" type="button" data-range="24h">24H</button>
            </div>
            <button class="range-toggle" id="toggle-freeze" type="button" aria-pressed="false">
              Freeze
            </button>
          </div>
          <div class="chart-stage" id="chart-stage">
            <div class="chart-viewport">
              <svg
                id="sparkline"
                viewBox="0 0 1000 320"
                preserveAspectRatio="none"
                role="img"
                aria-label="Minute reference price runway"
              >
                <defs>
                  <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#ffd166" stop-opacity="0.45" />
                    <stop offset="70%" stop-color="#05060b" stop-opacity="0.05" />
                    <stop offset="100%" stop-color="#05060b" stop-opacity="0" />
                  </linearGradient>
                  <filter id="sparkline-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feColorMatrix
                      in="blur"
                      type="matrix"
                      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -6"
                      result="glow"
                    />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path id="sparkline-area" d=""></path>
                <path id="sparkline-path-glow" d="" filter="url(#sparkline-soft-glow)"></path>
                <path id="sparkline-path" d=""></path>
                <line id="sparkline-xhair" x1="0" y1="0" x2="0" y2="320" opacity="0"></line>
                <line id="sparkline-yhair" x1="0" y1="0" x2="1000" y2="0" opacity="0"></line>
                <circle id="sparkline-dot" r="6" cx="0" cy="0" opacity="0"></circle>
                <rect id="sparkline-hit" x="0" y="0" width="1000" height="320"></rect>
              </svg>
            </div>
          </div>
          <div class="chart-axis">
            <span id="axis-start">--</span>
            <span id="axis-mid">--</span>
            <span id="axis-end">--</span>
          </div>
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

      <section class="panel panel-decoder" style="--delay: 0.36s">
        <div class="panel-head">
          <div>
            <div class="panel-title">OP_RETURN Decoder</div>
            <div class="panel-sub">Decode an FPHO payload (hourly or window anchors)</div>
          </div>
        </div>
        <div class="decoder-shell">
          <label class="decoder-label" for="opreturn-hex">paste op_return hex</label>
          <textarea
            id="opreturn-hex"
            class="decoder-input"
            spellcheck="false"
            placeholder="Paste payload hex (4650484f...) or a full OP_RETURN script (6a...)"
          ></textarea>
          <div class="decoder-actions">
            <button class="decoder-btn" id="opreturn-example" type="button">Example</button>
            <button class="decoder-btn decoder-btn-ghost" id="opreturn-clear" type="button">
              Clear
            </button>
          </div>
          <div class="decoder-status" id="opreturn-status">awaiting input</div>
          <div class="decoder-output" id="opreturn-output" hidden>
            <div class="decoder-grid" id="opreturn-grid"></div>
            <div class="decoder-raw">
              <div class="decoder-raw-head">
                <span>decoded json</span>
                <button
                  class="decoder-btn decoder-btn-ghost decoder-btn-mini"
                  id="opreturn-copy"
                  type="button"
                >
                  Copy
                </button>
              </div>
              <pre id="opreturn-json"></pre>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <span>Local API feed · UTC timeline · Per-minute venue drilldown</span>
      <span>Flux Oracle UI</span>
    </footer>

    <div id="tooltip-layer" aria-hidden="true">
      <div class="chart-tooltip" id="chart-tooltip" hidden>
        <div class="tt-kicker" id="tt-kicker">hover</div>
        <div class="tt-price" id="tt-price">--</div>
        <div class="tt-meta" id="tt-meta">--</div>
      </div>
    </div>

    <script>
      const state = {
        pair: 'FLUXUSD',
        venues: [],
        minVenues: 0,
        grace: 0,
        latestMinuteTs: null,
        latestBreakdown: null,
        openMinuteTs: null,
        rangeKey: '1h',
        frozen: false,
        minuteByTs: new Map(),
        runwaySeries: [],
        runwayMeta: null,
        runwayLast: null,
        breakdownCache: new Map()
      };

      const RANGES = {
        '1h': { label: '1H', seconds: 60 * 60 },
        '3h': { label: '3H', seconds: 3 * 60 * 60 },
        '6h': { label: '6H', seconds: 6 * 60 * 60 },
        '12h': { label: '12H', seconds: 12 * 60 * 60 },
        '24h': { label: '24H', seconds: 24 * 60 * 60 }
      };

      const RUNWAY_VIEW = { width: 1000, height: 320 };

      const el = (id) => document.getElementById(id);

      const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      });

      const minuteFormatter = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      });

      const fmtTime = (tsSeconds) => {
        if (!tsSeconds) return '--';
        return timeFormatter.format(new Date(tsSeconds * 1000));
      };

      const fmtMinute = (tsSeconds) => {
        if (!tsSeconds) return '--';
        return minuteFormatter.format(new Date(tsSeconds * 1000));
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

      const updateRangeParam = (rangeKey) => {
        const url = new URL(window.location.href);
        if (rangeKey) {
          url.searchParams.set('range', String(rangeKey));
        } else {
          url.searchParams.delete('range');
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

      const OP_RETURN_EXAMPLE =
        '4650484f020169913ee40000012c00000000006f7534e09cd9da6273136b6e05c346b700c82ec058e70fa0ffa3e96e4913a481ddd6f600000007';

      const escapeHtml = (value) => {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      const normalizeHexCandidate = (raw) => {
        if (!raw) return '';
        let text = String(raw).trim();
        if (!text) return '';

        const lowered = text.toLowerCase();
        const idx = lowered.indexOf('op_return');
        if (idx !== -1) {
          text = text.slice(idx + 'op_return'.length);
        }

        text = text.replace(/0x/gi, ' ');

        const match = text.match(/[0-9a-fA-F]{16,}/);
        if (match && match[0]) {
          return match[0];
        }

        return text.replace(/[^0-9a-fA-F]/g, '');
      };

      const bytesToHex = (bytes) => {
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      };

      const bytesFromHex = (hex) => {
        const clean = hex.trim().toLowerCase();
        if (!clean) {
          throw new Error('empty hex');
        }
        if (!/^[0-9a-f]+$/.test(clean)) {
          throw new Error('hex must be 0-9/a-f');
        }
        if (clean.length % 2 !== 0) {
          throw new Error('hex length must be even');
        }
        const out = new Uint8Array(clean.length / 2);
        for (let i = 0; i < out.length; i += 1) {
          out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
        }
        return out;
      };

      const extractOpReturnPayloadHex = (hexCandidate) => {
        const clean = hexCandidate.trim().toLowerCase();
        if (!clean) {
          throw new Error('empty input');
        }

        if (!clean.startsWith('6a')) {
          return { payloadHex: clean, scriptStripped: false };
        }

        const bytes = bytesFromHex(clean);
        if (bytes.length < 2) {
          throw new Error('op_return script too short');
        }
        if (bytes[0] !== 0x6a) {
          throw new Error('script does not start with OP_RETURN');
        }

        let offset = 1;
        if (offset >= bytes.length) {
          throw new Error('op_return missing pushdata');
        }

        const opcode = bytes[offset];
        offset += 1;

        let len = 0;
        if (opcode <= 75) {
          len = opcode;
        } else if (opcode === 0x4c) {
          if (offset + 1 > bytes.length) throw new Error('PUSHDATA1 missing length');
          len = bytes[offset];
          offset += 1;
        } else if (opcode === 0x4d) {
          if (offset + 2 > bytes.length) throw new Error('PUSHDATA2 missing length');
          len = bytes[offset] | (bytes[offset + 1] << 8);
          offset += 2;
        } else if (opcode === 0x4e) {
          if (offset + 4 > bytes.length) throw new Error('PUSHDATA4 missing length');
          len =
            bytes[offset] |
            (bytes[offset + 1] << 8) |
            (bytes[offset + 2] << 16) |
            (bytes[offset + 3] << 24);
          offset += 4;
        } else {
          throw new Error('unsupported pushdata opcode: 0x' + opcode.toString(16));
        }

        if (offset + len > bytes.length) {
          throw new Error('pushdata exceeds script length');
        }

        const payload = bytes.slice(offset, offset + len);
        return { payloadHex: bytesToHex(payload), scriptStripped: true };
      };

      const formatFixed8 = (fixed) => {
        if (fixed === null || fixed === undefined) return '--';
        const raw = String(fixed).trim();
        if (!/^-?\\d+$/.test(raw)) return '--';
        const negative = raw.startsWith('-');
        const digits = negative ? raw.slice(1) : raw;
        const padded = digits.padStart(9, '0');
        const whole = padded.slice(0, -8) || '0';
        const frac = padded.slice(-8);
        return (negative ? '-' : '') + whole + '.' + frac;
      };

      const decodeFphoPayload = (payloadHex) => {
        const bytes = bytesFromHex(payloadHex);
        if (bytes.length < 6) {
          throw new Error('payload too short');
        }

        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const magic =
          String.fromCharCode(bytes[0] || 0) +
          String.fromCharCode(bytes[1] || 0) +
          String.fromCharCode(bytes[2] || 0) +
          String.fromCharCode(bytes[3] || 0);

        if (magic !== 'FPHO') {
          throw new Error('invalid magic: ' + magic);
        }

        const version = view.getUint8(4);

        if (version === 1) {
          if (bytes.length !== 54) {
            throw new Error('invalid v1 payload length: ' + bytes.length);
          }

          const pairId = view.getUint8(5);
          const hourTs = view.getUint32(6, false);
          const closeFp = view.getBigInt64(10, false).toString();
          const reportHash = bytesToHex(bytes.slice(18, 50));
          const sigBitmap = view.getUint32(50, false);
          return { version, pairId, hourTs, closeFp, reportHash, sigBitmap };
        }

        if (version === 2) {
          if (bytes.length !== 58) {
            throw new Error('invalid v2 payload length: ' + bytes.length);
          }

          const pairId = view.getUint8(5);
          const hourTs = view.getUint32(6, false);
          const windowSeconds = view.getUint32(10, false);
          const closeFp = view.getBigInt64(14, false).toString();
          const reportHash = bytesToHex(bytes.slice(22, 54));
          const sigBitmap = view.getUint32(54, false);
          return { version, pairId, hourTs, windowSeconds, closeFp, reportHash, sigBitmap };
        }

        throw new Error('unsupported version: ' + version);
      };

      const initOpReturnDecoder = () => {
        const input = el('opreturn-hex');
        const status = el('opreturn-status');
        const output = el('opreturn-output');
        const grid = el('opreturn-grid');
        const json = el('opreturn-json');
        const clearButton = el('opreturn-clear');
        const exampleButton = el('opreturn-example');
        const copyButton = el('opreturn-copy');

        if (!input || !status || !output || !grid || !json) {
          return;
        }

        let lastDecodedText = '';
        let debounceTimer = null;

        const setDecoderStatus = (text, stateLabel) => {
          status.textContent = text;
          if (stateLabel) {
            status.setAttribute('data-state', stateLabel);
          } else {
            status.removeAttribute('data-state');
          }
        };

        const clearOutput = () => {
          output.hidden = true;
          grid.innerHTML = '';
          json.textContent = '';
          lastDecodedText = '';
        };

        const renderDecoded = () => {
          const candidate = normalizeHexCandidate(input.value);
          if (!candidate) {
            clearOutput();
            setDecoderStatus('awaiting input', '');
            return;
          }

          try {
            const extracted = extractOpReturnPayloadHex(candidate);
            const decoded = decodeFphoPayload(extracted.payloadHex);

            const pairName = decoded.pairId === 1 ? 'FLUXUSD' : 'unknown';
            const tsIso = new Date(decoded.hourTs * 1000).toISOString();
            const tsLabel = String(decoded.hourTs) + ' · ' + tsIso.replace('T', ' ').replace('Z', ' UTC');
            const close = formatFixed8(decoded.closeFp);
            const closeLabel = String(decoded.closeFp) + ' · ' + close;
            const windowSeconds =
              decoded.windowSeconds === undefined ? '--' : String(decoded.windowSeconds);

            const kvRows = [
              ['version', String(decoded.version)],
              ['pair', pairName + ' (id ' + String(decoded.pairId) + ')'],
              ['window seconds', windowSeconds],
              ['timestamp', tsLabel],
              ['close fp', closeLabel],
              ['report hash', decoded.reportHash],
              ['sig bitmap', String(decoded.sigBitmap)]
            ];

            grid.innerHTML = kvRows
              .map(
                ([key, value]) =>
                  '<div class="decoder-kv"><span>' +
                  escapeHtml(key) +
                  '</span><strong>' +
                  escapeHtml(value) +
                  '</strong></div>'
              )
              .join('');

            const jsonPayload = {
              payload_hex: extracted.payloadHex,
              script_stripped: extracted.scriptStripped,
              version: decoded.version,
              pair_id: decoded.pairId,
              pair: pairName,
              window_seconds: decoded.windowSeconds,
              ts: decoded.hourTs,
              ts_iso: tsIso,
              close_fp: decoded.closeFp,
              close: close,
              report_hash: decoded.reportHash,
              sig_bitmap: decoded.sigBitmap
            };

            lastDecodedText = JSON.stringify(jsonPayload, null, 2);
            json.textContent = lastDecodedText;
            output.hidden = false;

            const suffix = extracted.scriptStripped ? ' (script stripped)' : '';
            setDecoderStatus('decoded fpho v' + decoded.version + suffix, 'ok');
          } catch (error) {
            clearOutput();
            setDecoderStatus(
              'decode failed: ' + (error instanceof Error ? error.message : String(error)),
              'err'
            );
          }
        };

        const scheduleDecode = () => {
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          debounceTimer = setTimeout(() => {
            debounceTimer = null;
            renderDecoded();
          }, 80);
        };

        input.addEventListener('input', scheduleDecode);

        if (clearButton) {
          clearButton.addEventListener('click', () => {
            input.value = '';
            clearOutput();
            setDecoderStatus('awaiting input', '');
          });
        }

        if (exampleButton) {
          exampleButton.addEventListener('click', () => {
            input.value = OP_RETURN_EXAMPLE;
            renderDecoded();
          });
        }

        if (copyButton) {
          copyButton.addEventListener('click', async () => {
            if (!lastDecodedText) return;
            try {
              await navigator.clipboard.writeText(lastDecodedText);
              setDecoderStatus('copied decoded json to clipboard', 'ok');
              setTimeout(() => renderDecoded(), 650);
            } catch (error) {
              setDecoderStatus(
                'copy failed: ' + (error instanceof Error ? error.message : String(error)),
                'err'
              );
            }
          });
        }

        renderDecoded();
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

      const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

      const describeRange = (rangeKey) => {
        const entry = RANGES[rangeKey] ?? RANGES['1h'];
        if (!entry) return 'Latest minute runway (UTC)';
        if (entry.seconds <= 60 * 60) return 'Latest 60 minutes (UTC)';
        const hours = Math.round(entry.seconds / 3600);
        return 'Last ' + hours + ' hours (UTC)';
      };

      const applyRangeUi = () => {
        const tabs = Array.from(document.querySelectorAll('.range-tab'));
        tabs.forEach((tab) => {
          const key = tab.dataset.range;
          if (!key) return;
          const active = key === state.rangeKey;
          tab.classList.toggle('is-active', active);
        });
        setText('runway-sub', describeRange(state.rangeKey));
      };

      const setFrozen = (next) => {
        state.frozen = !!next;
        const button = el('toggle-freeze');
        if (button) {
          button.setAttribute('aria-pressed', state.frozen ? 'true' : 'false');
          button.textContent = state.frozen ? 'Frozen' : 'Freeze';
        }
        setStatus(state.frozen ? 'status frozen' : 'status live');
      };

      const setRange = (rangeKey) => {
        if (!RANGES[rangeKey]) return;
        state.rangeKey = rangeKey;
        applyRangeUi();
        updateRangeParam(rangeKey);
        void refresh();
      };

      let runwayHandlersBound = false;

      const restoreRunwayIdle = () => {
        const tooltip = el('chart-tooltip');
        const xhair = el('sparkline-xhair');
        const yhair = el('sparkline-yhair');
        const dot = el('sparkline-dot');
        if (tooltip) tooltip.hidden = true;
        if (xhair) xhair.setAttribute('opacity', '0');
        if (yhair) yhair.setAttribute('opacity', '0');

        if (!dot) return;
        if (state.runwayLast) {
          dot.setAttribute('cx', state.runwayLast.x.toFixed(2));
          dot.setAttribute('cy', state.runwayLast.y.toFixed(2));
          dot.setAttribute('opacity', '1');
        } else {
          dot.setAttribute('opacity', '0');
        }
      };

      const bindRunwayHandlers = () => {
        if (runwayHandlersBound) return;
        const svg = el('sparkline');
        const hit = el('sparkline-hit');
        if (!svg || !hit) return;

        const placeRunwayTooltip = (xClient, yClient) => {
          const tooltip = el('chart-tooltip');
          if (!tooltip) return;

          // The hidden attribute maps to display:none, so we need it visible to measure.
          tooltip.hidden = false;
          const ttRect = tooltip.getBoundingClientRect();
          const w = ttRect.width || 220;
          const h = ttRect.height || 86;
          const padding = 14;
          const offset = 16;

          let left = xClient - w / 2;
          let top = yClient - h - offset;

          if (top < padding) top = yClient + offset;

          const maxLeft = window.innerWidth - w - padding;
          const maxTop = window.innerHeight - h - padding;
          left = clamp(left, padding, Math.max(padding, maxLeft));
          top = clamp(top, padding, Math.max(padding, maxTop));

          tooltip.style.setProperty('--x', String(left));
          tooltip.style.setProperty('--y', String(top));
        };

        const onMove = (event) => {
          if (!state.runwayMeta || !state.runwaySeries || state.runwaySeries.length < 2) {
            return;
          }

          const rect = svg.getBoundingClientRect();
          const relX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
          const idx = Math.round(relX * (state.runwaySeries.length - 1));
          const entry = state.runwaySeries[idx];
          if (!entry) return;

          const xSvg = idx * state.runwayMeta.step;
          const xhair = el('sparkline-xhair');
          const yhair = el('sparkline-yhair');
          const dot = el('sparkline-dot');

          if (xhair) {
            xhair.setAttribute('x1', xSvg.toFixed(2));
            xhair.setAttribute('x2', xSvg.toFixed(2));
            xhair.setAttribute('opacity', '1');
          }

          let yPx = rect.height * 0.18;
          if (entry.value !== null && entry.value !== undefined) {
            const ySvg =
              RUNWAY_VIEW.height -
              ((entry.value - state.runwayMeta.min) / state.runwayMeta.range) * RUNWAY_VIEW.height;

            if (yhair) {
              yhair.setAttribute('y1', ySvg.toFixed(2));
              yhair.setAttribute('y2', ySvg.toFixed(2));
              yhair.setAttribute('opacity', '1');
            }

            if (dot) {
              dot.setAttribute('cx', xSvg.toFixed(2));
              dot.setAttribute('cy', ySvg.toFixed(2));
              dot.setAttribute('opacity', '1');
            }

            yPx = (ySvg / RUNWAY_VIEW.height) * rect.height;
          } else {
            if (yhair) yhair.setAttribute('opacity', '0');
            if (dot) {
              dot.setAttribute('cx', xSvg.toFixed(2));
              dot.setAttribute('cy', (RUNWAY_VIEW.height * 0.18).toFixed(2));
              dot.setAttribute('opacity', '0.2');
            }
          }

          setText('tt-kicker', fmtMinute(entry.ts) + ' UTC');
          setText(
            'tt-price',
            entry.value !== null && entry.value !== undefined ? formatUsdNumber(entry.value, 6) : '--'
          );

          const coverage = entry.venuesUsed ?? '--';
          const status = entry.degraded ? 'degraded' : 'ok';
          const reason = entry.degraded && entry.degradedReason ? ' · ' + entry.degradedReason : '';
          setText('tt-meta', 'venues ' + coverage + ' · ' + status + reason);

          placeRunwayTooltip(rect.left + relX * rect.width, rect.top + yPx);
        };

        const onLeave = () => restoreRunwayIdle();

        hit.addEventListener('pointermove', onMove);
        hit.addEventListener('pointerdown', onMove);
        hit.addEventListener('pointerleave', onLeave);

        runwayHandlersBound = true;
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

      const fetchMinutesForRunway = async (pair, nowTs) => {
        const range = RANGES[state.rangeKey] ?? RANGES['1h'];
        const seconds = range ? range.seconds : 60 * 60;
        const start = Math.floor((nowTs - seconds) / 60) * 60;
        const end = nowTs;
        const limit = 1000;
        const base =
          '/v1/minutes?pair=' +
          pair +
          '&start=' +
          start +
          '&end=' +
          end +
          '&limit=' +
          limit +
          '&offset=';

        if (seconds <= limit * 60) {
          const page = await fetchJson(base + '0');
          return page && page.items ? page.items : [];
        }

        const [pageA, pageB] = await Promise.all([
          fetchJson(base + '0'),
          fetchJson(base + String(limit))
        ]);
        const itemsA = pageA && pageA.items ? pageA.items : [];
        const itemsB = pageB && pageB.items ? pageB.items : [];

        const combined = itemsA.concat(itemsB);
        const seen = new Set();
        return combined.filter((row) => {
          const key = String(row.minute_ts);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
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
          const minuteRow = state.minuteByTs.get(Number(minuteTs));
          const referenceValue =
            minuteRow && minuteRow.reference_price_fp
              ? fixedToNumber(minuteRow.reference_price_fp)
              : null;
          const referenceText =
            minuteRow && minuteRow.reference_price_fp ? formatUsd(minuteRow.reference_price_fp, 6) : '--';

          const venueHtml =
            '<div class="venue-grid">' +
            venues
              .map((entry) => {
                const price = entry.price_fp ? formatUsd(entry.price_fp) : '--';
                const venueValue = entry.price_fp ? fixedToNumber(entry.price_fp) : null;
                const deltaPct =
                  referenceValue !== null && venueValue !== null && referenceValue !== 0
                    ? ((venueValue - referenceValue) / referenceValue) * 100
                    : null;
                const deltaText =
                  deltaPct !== null
                    ? (deltaPct >= 0 ? '+' : '') + deltaPct.toFixed(2) + '%'
                    : '';
                const trend =
                  deltaPct === null
                    ? 'flat'
                    : deltaPct > 0.05
                      ? 'up'
                      : deltaPct < -0.05
                        ? 'down'
                        : 'flat';

                return (
                  '<div class="venue-card" data-trend="' +
                  trend +
                  '">' +
                  '<div class="venue-top">' +
                  '<strong>' +
                  entry.venue +
                  '</strong>' +
                  '<span class="venue-delta">' +
                  deltaText +
                  '</span>' +
                  '</div>' +
                  '<div class="venue-price">' +
                  price +
                  '</div>' +
                  '<div class="venue-sub">ticks ' +
                  entry.tick_count +
                  (entry.source ? ' · ' + entry.source : '') +
                  '</div>' +
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

          panel.innerHTML =
            '<div class="venue-head"><span>Venue Breakdown</span><span class="venue-ref">ref ' +
            referenceText +
            '</span></div>' +
            venueHtml +
            '<div>' +
            missingHtml +
            '</div>';
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

      const renderRunway = (items) => {
        const pathEl = el('sparkline-path');
        const glowEl = el('sparkline-path-glow');
        const areaEl = el('sparkline-area');
        const dotEl = el('sparkline-dot');
        if (!pathEl || !glowEl || !areaEl || !dotEl) return;

        const series = (items || []).map((row) => ({
          ts: row.minute_ts,
          value: fixedToNumber(row.reference_price_fp),
          venuesUsed: row.venues_used ?? null,
          degraded: !!row.degraded,
          degradedReason: row.degraded_reason ?? null
        }));

        state.runwaySeries = series;

        const priced = series.filter((row) => row.value !== null).map((row) => row.value);

        if (priced.length < 2 || series.length < 2) {
          pathEl.setAttribute('d', '');
          glowEl.setAttribute('d', '');
          areaEl.setAttribute('d', '');
          dotEl.setAttribute('opacity', '0');
          setText('axis-start', '--');
          setText('axis-mid', '--');
          setText('axis-end', '--');
          state.runwayMeta = null;
          state.runwayLast = null;
          restoreRunwayIdle();
          return;
        }

        const min = Math.min(...priced);
        const max = Math.max(...priced);
        const range = max - min || 1;
        const width = RUNWAY_VIEW.width;
        const height = RUNWAY_VIEW.height;
        const step = width / (series.length - 1);

        const lineParts = [];
        const areaParts = [];
        let segment = [];

        const flushSegment = () => {
          if (segment.length === 0) return;
          const line = segment
            .map((point, index) => {
              return (index === 0 ? 'M' : 'L') + point.x.toFixed(2) + ' ' + point.y.toFixed(2);
            })
            .join(' ');
          lineParts.push(line);

          const first = segment[0];
          const last = segment[segment.length - 1];
          areaParts.push(line + ' L ' + last.x.toFixed(2) + ' ' + height + ' L ' + first.x.toFixed(2) + ' ' + height + ' Z');

          segment = [];
        };

        for (let i = 0; i < series.length; i += 1) {
          const entry = series[i];
          if (!entry || entry.value === null) {
            flushSegment();
            continue;
          }

          const x = i * step;
          const y = height - ((entry.value - min) / range) * height;
          segment.push({ x, y });
        }
        flushSegment();

        const linePath = lineParts.join(' ');
        const areaPath = areaParts.join(' ');

        pathEl.setAttribute('d', linePath);
        glowEl.setAttribute('d', linePath);
        areaEl.setAttribute('d', areaPath);

        let lastIndex = -1;
        for (let i = series.length - 1; i >= 0; i -= 1) {
          if (series[i] && series[i].value !== null) {
            lastIndex = i;
            break;
          }
        }

        if (lastIndex >= 0) {
          const entry = series[lastIndex];
          const x = lastIndex * step;
          const y = height - ((entry.value - min) / range) * height;
          dotEl.setAttribute('cx', x.toFixed(2));
          dotEl.setAttribute('cy', y.toFixed(2));
          dotEl.setAttribute('opacity', '1');
          state.runwayLast = { x, y, ts: entry.ts, value: entry.value };
        } else {
          dotEl.setAttribute('opacity', '0');
          state.runwayLast = null;
        }

        const startTs = series[0] ? series[0].ts : null;
        const midTs = series[Math.floor(series.length / 2)] ? series[Math.floor(series.length / 2)].ts : null;
        const endTs = series[series.length - 1] ? series[series.length - 1].ts : null;
        setText('axis-start', startTs ? fmtMinute(startTs) : '--');
        setText('axis-mid', midTs ? fmtMinute(midTs) : '--');
        setText('axis-end', endTs ? fmtMinute(endTs) : '--');

        setText('sparkline-min', 'min ' + formatUsdNumber(min, 6));
        setText('sparkline-max', 'max ' + formatUsdNumber(max, 6));

        state.runwayMeta = { min, max, range, step };
        restoreRunwayIdle();
        bindRunwayHandlers();
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
            fetchMinutesForRunway(pair, now),
            fetchJson('/v1/hours?pair=' + pair + '&start=' + (now - 6 * 3600) + '&end=' + now + '&limit=6')
          ]);

          const minuteItems = Array.isArray(minutes) ? minutes : minutes && minutes.items ? minutes.items : [];
          state.minuteByTs = new Map(minuteItems.map((row) => [Number(row.minute_ts), row]));
          renderMinutes(minuteItems);
          renderRunway(minuteItems);

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
          setStatus(state.frozen ? 'status frozen' : 'status live');
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

        const rangeParam = params.get('range');
        if (rangeParam && RANGES[rangeParam]) {
          state.rangeKey = rangeParam;
        }

        applyRangeUi();
        updateRangeParam(state.rangeKey);

        const freezeButton = el('toggle-freeze');
        if (freezeButton) {
          freezeButton.addEventListener('click', () => {
            setFrozen(!state.frozen);
          });
        }

        const rangeTabs = Array.from(document.querySelectorAll('.range-tab'));
        rangeTabs.forEach((tab) => {
          tab.addEventListener('click', () => {
            const key = tab.dataset.range;
            if (key) setRange(key);
          });
        });

        initOpReturnDecoder();

        try {
          const method = await fetchJson('/v1/methodology');
          renderMethod(method);
        } catch (error) {
          console.error(error);
        }

        refresh();
        setInterval(() => {
          if (!state.frozen) {
            refresh();
          }
        }, 10000);
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
