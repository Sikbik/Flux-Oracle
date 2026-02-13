# Flux Price History Oracle (FPHO)

FPHO provides minute-grade FLUXUSD fair market values and commits hourly reports to Flux so historical pricing is independently verifiable.

## Stack

- Node.js `20.x`
- `pnpm`
- TypeScript with `strict: true`

## Monorepo Layout

- `packages/core`
- `packages/venues`
- `packages/ingestor`
- `packages/aggregator`
- `packages/api`
- `packages/cli`
- `packages/p2p`
- `packages/reporter`
- `packages/anchor`
- `packages/indexer`

## Local Run

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

## API Quickstart (planned endpoints)

```bash
curl 'http://localhost:3000/v1/price_at?pair=FLUXUSD&ts=1707350467'
curl 'http://localhost:3000/v1/minutes?pair=FLUXUSD&start=1707346800&end=1707350400&limit=120'
curl 'http://localhost:3000/v1/methodology'
```

## Verification Quickstart (planned CLI)

```bash
pnpm --filter @fpho/cli run fpho-verify --pair FLUXUSD --hour 1707346800
```
