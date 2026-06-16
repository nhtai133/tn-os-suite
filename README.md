# TN OS Suite

TN OS Suite is a federated personal operating system monorepo. Each child OS owns its own local data and can export a `.tnos.json` snapshot. TN Life OS imports those snapshots read-only and turns them into a CEO dashboard, weekly review, AI CEO briefing, decision engine, batch import workflow, and daily command center.

## Apps

| App | Purpose | Dev command |
| --- | --- | --- |
| TN Life OS | Personal CEO command center | `pnpm --filter tn-life-os dev` |
| Investment OS | Funds, watchlist, DCA, export snapshots | `pnpm --filter investment-os dev` |
| Trading OS | Trading journal, risk, MT5 import, export snapshots | `pnpm --filter trading-os dev` |
| Wealth OS | Net worth, bank accounts, assets, liabilities | `pnpm --filter wealth-os dev` |
| Business OS | Revenue, clients, campaigns, tasks, P&L | `pnpm --filter business-os dev` |
| Crypto OS | Holdings, wallets, exchanges, DeFi, security | `pnpm --filter crypto-os dev` |
| Stocks OS | Holdings, watchlist, dividends, valuation, buy zones | `pnpm --filter stocks-os dev` |

## Ports

| App | Port |
| --- | --- |
| `tn-life-os` | 3000 |
| `investment-os` | 3001 |
| `trading-os` | 3002 |
| `wealth-os` | 3003 |
| `business-os` | 3004 |
| `crypto-os` | 3005 |
| `stocks-os` | 3006 |

## Setup

```bash
pnpm install
```

Run one app:

```bash
pnpm --filter tn-life-os dev
```

Run all apps:

```bash
pnpm dev
```

## Verification

Run before committing:

```bash
pnpm lint
pnpm type-check
pnpm build
```

## Sync Model

1. Open a child OS.
2. Export a `.tnos.json` snapshot.
3. Open TN Life OS.
4. Import one snapshot through `/import`, or multiple snapshots through `/import/batch`.
5. Review CEO Dashboard, Weekly Review, AI CEO Briefing, Decisions, and Daily Command Center.

TN Life OS does not mutate child OS data.

## Documentation

* [User Guide](docs/USER_GUIDE.md)
* [Sync Guide](docs/SYNC_GUIDE.md)
* [QA Checklist](docs/QA_CHECKLIST.md)
* [Release Notes v1.0](docs/RELEASE_NOTES_v1.0.md)
* [Sprint 6-10 Spec](docs/specs/SPRINT_6_TO_10_SPEC.md)
