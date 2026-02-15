# Flux Price History Oracle (FPHO)

FPHO provides minute-grade FLUXUSD fair market values and commits hourly reports to Flux so historical pricing is independently verifiable.

## How The Decentralized Oracle Works

```mermaid
flowchart TB
  %% High-level: multiple reporter nodes independently compute the same report_hash.
  %% A leader ("invoker") collects a quorum of signatures and anchors the commitment on-chain.

  subgraph Offchain["Off-chain Oracle Network (N reporter nodes)"]
    direction TB

    subgraph R1["Reporter Node A"]
      direction TB
      R1a["Ingest venues (public WS)"] --> R1b[(SQLite)]
      R1b --> R1c["Aggregate minutes + compute reports"]
      R1c --> R1d["Compute commitments (minute_root + report_hash)"]
      R1d --> R1e["Sign report_hash (ed25519)"]
    end

    subgraph R2["Reporter Node B"]
      direction TB
      R2a["Ingest venues (public WS)"] --> R2b[(SQLite)]
      R2b --> R2c["Aggregate minutes + compute reports"]
      R2c --> R2d["Compute commitments (minute_root + report_hash)"]
      R2d --> R2e["Sign report_hash (ed25519)"]
    end

    subgraph R3["Reporter Node C"]
      direction TB
      R3a["Ingest venues (public WS)"] --> R3b[(SQLite)]
      R3b --> R3c["Aggregate minutes + compute reports"]
      R3c --> R3d["Compute commitments (minute_root + report_hash)"]
      R3d --> R3e["Sign report_hash (ed25519)"]
    end

    P2P["libp2p gossipsub\n(PROPOSE / SIG / FINAL)"]
    R1e -- SIG --> P2P
    R2e -- SIG --> P2P
    R3e -- SIG --> P2P

    Leader["Invoker / Leader\n(leader election)"]
    P2P --> Leader

    Final["Finalized report\n(t-of-N signatures + sig_bitmap)"]
    Leader --> Final
  end

  Final --> IPFS["(optional) Publish report JSON to IPFS\nCID stored off-chain"]
  Final --> Payload["Build OP_RETURN payload\n(magic+version+pair_id+ts+close_fp+report_hash+sig_bitmap)"]
  Payload --> Chain["Flux on-chain anchor tx\n(OP_RETURN)"]

  Chain --> Indexer["Indexer scans blocks\nand stores anchors"]
  Indexer --> API["Public API + UI\n(price_at / minutes / verify)"]
  API --> Clients["Clients/auditors verify:\n1) report_hash matches report JSON\n2) signatures meet quorum\n3) OP_RETURN matches on-chain tx"]
```

Security properties:

- Every reporter independently recomputes the same `report_hash` from the minute dataset (deterministic canonicalization + hashing).
- Reporters only sign if the proposed `report_hash` matches their locally computed one.
- The invoker cannot fabricate prices: without a quorum of signatures the anchor is rejected by verifiers.

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
pnpm db:backfill-reporter-set -- --registry ./data/reporter_registry.json
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
curl 'http://localhost:3000/v1/minute/FLUXUSD/1707350460/venues'
curl 'http://localhost:3000/v1/anchors?pair=FLUXUSD&start_hour=1707346800&end_hour=1707350400'
curl 'http://localhost:3000/v1/hours?pair=FLUXUSD&start=1707346800&end=1707350400'
curl 'http://localhost:3000/v1/report/FLUXUSD/1707346800'
curl 'http://localhost:3000/v1/verify/FLUXUSD/1707346800'
curl 'http://localhost:3000/v1/methodology'
curl 'http://localhost:3000/healthz'
curl 'http://localhost:3000/metrics'
```

UI:

```bash
open http://localhost:3000/
```

## Anchoring (Library)

`@fpho/anchor` now supports:

- publishing hourly report JSON to IPFS (CID + mirror URL)
- building binary OP_RETURN payloads from hourly reports
- broadcasting anchor transactions through Flux JSON-RPC
- persisting anchor metadata in `anchors`

## Verification Quickstart (CLI)

```bash
pnpm --filter @fpho/cli build
pnpm --filter @fpho/cli run fpho-verify --pair FLUXUSD --hour 1707346800 --registry ./data/reporter_registry.json --check-minute-root
```

## Tax CSV Exports

Input transactions JSON format:

```json
[
  {
    "txid": "abc",
    "timestamp": 1707346812,
    "direction": "in",
    "amount": "2.00000000",
    "asset": "FLUX"
  },
  {
    "txid": "def",
    "timestamp": 1707346899,
    "direction": "out",
    "amount": "3.00000000",
    "asset": "FLUX"
  }
]
```

Export tax packs:

```bash
pnpm --filter @fpho/cli build
pnpm --filter @fpho/cli run fpho-tax-export --input ./data/txs.json --out-dir ./data/tax-csv --base-url http://localhost:3000 --pair FLUXUSD
```

Generated files:

- `full_ledger.csv`
- `income.csv`
- `disposals.csv`

## FMV Rule + Audit Citation

- FMV rule: the tax FMV for a transaction timestamp is the minute bucket reference price from `GET /v1/price_at`.
- Audit citation: include `pair`, `hour_ts`, `report_hash`, and anchor `txid`; retain matching hourly report JSON, OP_RETURN decode output, and quorum verification output.

## Deployment on Flux

Deployment artifacts are under `deploy/`:

- Docker images: `deploy/docker/Dockerfile.api`, `deploy/docker/Dockerfile.cli`
- Flux app specs: `deploy/flux/api-app.spec.json`, `deploy/flux/reporter-app.spec.json`

Scaling guidance:

- Run reporters as quorum nodes only.
- Keep client traffic on API nodes.
- Scale API replicas for read load independently of reporter quorum size.

## VPS (systemd)

Systemd unit templates live in `deploy/systemd/`. See `deploy/systemd/README.md` for installation and log commands.

Raw tick retention (SQLite hygiene):

- `FPHO_RAW_TICK_RETENTION_SECONDS` (default `86400`, set `0` to disable pruning)
- `FPHO_RAW_TICK_PRUNE_INTERVAL_SECONDS` (default `3600`)
