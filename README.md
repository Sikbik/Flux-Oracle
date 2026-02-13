# Flux Price History Oracle (FPHO)

FPHO provides minute-grade FLUXUSD fair market values and commits hourly reports to Flux so historical pricing is independently verifiable.

## Stack

- Node.js `20.x`
- `pnpm`
- TypeScript with `strict: true`
- SQLite for MVP storage

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
pnpm db:migrate
pnpm lint
pnpm test
pnpm build
```

## Development Harness

```bash
docker compose -f docker-compose.dev.yml up --build
pnpm simulate:hour
```

Reporter quorum simulation:

```bash
pnpm simulate:quorum
```

## Database Commands

```bash
pnpm db:migrate
pnpm db:reset
```

## API Quickstart

```bash
pnpm --filter @fpho/api build
FPHO_DB_PATH=./data/fpho.sqlite pnpm --filter @fpho/api start
```

Available endpoints:

```bash
curl 'http://localhost:3000/v1/price_at?pair=FLUXUSD&ts=1707350467'
curl 'http://localhost:3000/v1/minutes?pair=FLUXUSD&start=1707346800&end=1707350400&limit=120'
curl 'http://localhost:3000/v1/methodology'
curl 'http://localhost:3000/healthz'
curl 'http://localhost:3000/metrics'
```

## Verification Quickstart (planned CLI)

```bash
pnpm --filter @fpho/cli run fpho-verify --pair FLUXUSD --hour 1707346800
```
