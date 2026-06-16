# TN OS Suite - Sprint 6 to Sprint 10 Spec

## Current State

TN OS Suite is a federated monorepo with:

* apps/tn-life-os
* apps/investment-os
* apps/trading-os
* apps/wealth-os
* apps/business-os
* apps/crypto-os
* apps/stocks-os

Shared packages:

* packages/schemas
* packages/sync
* packages/ui

Current sync model:

Each child OS exports `.tnos.json`.

TN Life OS imports snapshots manually and displays them in:

* CEO Dashboard
* Weekly Review
* Decision Registry context

All current apps must be preserved.

Do not rebuild existing apps from scratch.

---

# Global Rules

1. Do not break existing apps.
2. TN Life OS remains read-only toward child OS data.
3. Child OS apps remain standalone.
4. Run these after each sprint:

```bash
pnpm lint
pnpm type-check
pnpm build
```

5. Commit after each sprint.
6. Do not push unless explicitly instructed.
7. Stop after Sprint 10.

---

# Sprint 6 - AI CEO Briefing Layer

## Goal

Turn TN Life OS from dashboard into an AI-powered CEO command center.

## Build

In `apps/tn-life-os`, add:

* `/ai-ceo`
* AI CEO Briefing page
* Executive summary generator
* Risk radar
* Top priorities
* Suggested decisions
* Weekly action plan

## Input Data

Read imported snapshots from:

* Wealth OS
* Investment OS
* Trading OS
* Business OS
* Crypto OS
* Stocks OS

## Output Sections

AI CEO Briefing must show:

1. Net Worth Summary
2. Allocation Drift
3. Trading Risk
4. Business Performance
5. Crypto Exposure
6. Stocks Exposure
7. Top 3 Risks
8. Top 3 Opportunities
9. Top 3 Priorities This Week
10. Suggested Decisions

## MVP Implementation

Do not require paid API yet.

Implement template-based AI briefing first:

* `generateCeoBriefing(snapshots)`
* rule-based insights
* deterministic output
* no external API required

Create:

```text
apps/tn-life-os/src/lib/ai-ceo/generate-ceo-briefing.ts
apps/tn-life-os/src/app/ai-ceo/page.tsx
```

## Acceptance Criteria

* AI CEO page works without API key.
* Reads all imported snapshots.
* Shows useful executive briefing.
* Handles missing snapshots gracefully.
* Lint/type-check/build pass.

Commit:

```bash
git commit -m "feat: add AI CEO briefing layer"
```

---

# Sprint 7 - Decision Engine

## Goal

Make TN Life OS help with major decisions.

## Build

Enhance Decision Registry.

Add:

* decision scoring
* linked OS snapshots
* review date
* expected outcome
* actual outcome
* decision quality score
* decision status

## Decision Categories

* Wealth
* Investment
* Trading
* Business
* Crypto
* Stocks
* Health
* Family
* Real Estate
* Learning

## Decision Engine Fields

Each decision should include:

```ts
{
  id: string
  title: string
  category: string
  linked_os: string[]
  context: string
  options: DecisionOption[]
  chosen_option: string
  reason: string
  risks: string[]
  expected_outcome: string
  actual_outcome?: string
  review_date: string
  status: "open" | "decided" | "reviewed" | "archived"
  quality_score?: number
}
```

## Add Pages

```text
/decisions
/decisions/new
/decisions/[id]
```

## Acceptance Criteria

* Full CRUD works.
* Decisions can link to imported OS snapshots.
* AI CEO page can show open decisions.
* Weekly Review includes decisions due for review.
* Lint/type-check/build pass.

Commit:

```bash
git commit -m "feat: add decision engine"
```

---

# Sprint 8 - Local Auto Sync Folder Import

## Goal

Reduce manual import friction before cloud sync.

## Build

Add local batch import workflow in TN Life OS.

Page:

```text
/import/batch
```

Features:

* upload multiple `.tnos.json` files at once
* validate all files
* reject invalid files
* show import summary
* replace older snapshot if same OS type
* show stale warnings

## Rules

* No direct child OS editing.
* No cloud required.
* No realtime sync yet.
* Manual batch import only.

## Acceptance Criteria

* User can import all OS snapshots at once.
* TN Life OS connection status updates correctly.
* Duplicate OS snapshots replace older imported version.
* Bad files are rejected safely.
* Lint/type-check/build pass.

Commit:

```bash
git commit -m "feat: add batch snapshot import"
```

---

# Sprint 9 - Mobile Responsive + Daily Command Center

## Goal

Make TN Life OS usable on phone and iPad.

## Build

Improve responsive UI for:

* CEO Dashboard
* Weekly Review
* AI CEO
* Decisions
* Import
* Batch Import

Add Daily Command Center:

```text
/daily
```

Sections:

* Today Focus
* Top 3 Priorities
* Trading Risk Reminder
* Business Action
* Wealth/Investment Note
* Personal Note
* End-of-day Reflection

## Acceptance Criteria

* TN Life OS works well on mobile width.
* Dashboard cards stack cleanly.
* Tables do not break layout.
* Daily page works.
* Lint/type-check/build pass.

Commit:

```bash
git commit -m "feat: add mobile command center"
```

---

# Sprint 10 - Production Hardening + Release v1.0

## Goal

Prepare TN OS Suite for real daily use.

## Build

Add:

* app health checklist
* data backup instructions
* sample data reset protection
* export/import documentation
* release notes
* QA checklist
* README update
* version tag

## Docs

Create:

```text
docs/USER_GUIDE.md
docs/SYNC_GUIDE.md
docs/QA_CHECKLIST.md
docs/RELEASE_NOTES_v1.0.md
```

## QA Checklist

Test:

* Investment OS export/import
* Trading OS export/import
* Wealth OS export/import
* Business OS export/import
* Crypto OS export/import
* Stocks OS export/import
* AI CEO Briefing
* Weekly Review
* Decisions
* Batch Import
* Mobile layout

## Acceptance Criteria

* All apps run.
* All checks pass.
* README explains how to run each app.
* v1.0 release notes exist.
* Git status clean after commit.

Commit:

```bash
git commit -m "chore: prepare TN OS Suite v1.0 release"
```

Optional tag after approval:

```bash
git tag v1.0.0-tn-os-suite
```

---

# Final Stop Condition

After Sprint 10:

1. Run:

```bash
pnpm lint
pnpm type-check
pnpm build
git status
git log --oneline -10
```

2. Report:

* completed sprints
* commits created
* remaining risks
* recommended next roadmap

3. Do not push unless user explicitly says push.
