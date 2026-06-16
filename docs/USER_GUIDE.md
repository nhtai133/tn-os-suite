# TN OS Suite User Guide

## Daily Flow

1. Start TN Life OS: `pnpm --filter tn-life-os dev`.
2. Open `/daily`.
3. Review Today Focus, Top 3 Priorities, Trading Risk Reminder, Business Action, and Wealth/Investment Note.
4. Add a Personal Note before work starts.
5. Add an End-of-day Reflection before shutdown.

## Weekly Flow

1. Export fresh snapshots from each child OS.
2. Import them in TN Life OS through `/import/batch`.
3. Open `/ai-ceo` for the AI CEO Briefing.
4. Open `/weekly-review` to review each connected OS and decisions due for review.
5. Create or update decisions in `/decisions`.

## Decision Engine

Use `/decisions/new` for major decisions. Capture:

* category
* linked OS snapshots
* context
* scored options
* chosen option
* reason
* risks
* expected outcome
* actual outcome
* review date
* quality score

Review decisions on the review date and update the actual outcome and quality score.

## Data Safety

All app data is local browser storage. Before clearing data or loading sample data over existing records, export snapshots or backups where available.

Sample data loaders now ask for confirmation when existing local data would be replaced.

## App Health Checklist

Before relying on a daily session:

* TN Life OS opens on port 3000.
* Child OS apps open on their assigned ports.
* `/import/batch` shows expected connection status.
* `/ai-ceo` shows connected systems.
* `/weekly-review` includes current snapshots.
* `/decisions` shows open and due decisions.
* `/daily` loads without errors on desktop and mobile widths.
