# TN OS Suite v1.0 Release Notes

## Release Summary

TN OS Suite v1.0 delivers a federated personal operating system with standalone child apps and a read-only TN Life OS command center.

## Included Apps

* TN Life OS
* Investment OS
* Trading OS
* Wealth OS
* Business OS
* Crypto OS
* Stocks OS

## Highlights

* Federated monorepo foundation.
* Manual `.tnos.json` snapshot sync.
* CEO Dashboard in TN Life OS.
* Weekly Review across imported snapshots.
* AI CEO Briefing with deterministic rule-based insights.
* Decision Engine with scored options, linked OS snapshots, review dates, outcomes, and quality scores.
* Batch Snapshot Import for multiple child OS snapshots.
* Daily Command Center.
* Mobile responsive TN Life OS shell.
* Documentation and QA checklist.
* Sample data overwrite protection.

## Verification

Required release checks:

```bash
pnpm lint
pnpm type-check
pnpm build
```

## Known Limits

* Sync is manual, not realtime.
* AI CEO Briefing is deterministic/template-based and does not call a paid API.
* Data is stored locally in browser storage.
* No remote backup or multi-device sync is included in v1.0.

## Optional Tag

After explicit approval:

```bash
git tag v1.0.0-tn-os-suite
```
