# TN OS Suite QA Checklist

Run:

```bash
pnpm lint
pnpm type-check
pnpm build
```

## App Startup

* [ ] TN Life OS starts on port 3000.
* [ ] Investment OS starts on port 3001.
* [ ] Trading OS starts on port 3002.
* [ ] Wealth OS starts on port 3003.
* [ ] Business OS starts on port 3004.
* [ ] Crypto OS starts on port 3005.
* [ ] Stocks OS starts on port 3006.

## Export / Import

* [ ] Investment OS export imports into TN Life OS.
* [ ] Trading OS export imports into TN Life OS.
* [ ] Wealth OS export imports into TN Life OS.
* [ ] Business OS export imports into TN Life OS.
* [ ] Crypto OS export imports into TN Life OS.
* [ ] Stocks OS export imports into TN Life OS.
* [ ] Batch import accepts all valid snapshots.
* [ ] Batch import rejects invalid files safely.
* [ ] Duplicate OS snapshots replace older imported versions.
* [ ] Stale snapshots show warnings.

## TN Life OS

* [ ] CEO Dashboard renders imported widgets.
* [ ] AI CEO Briefing works without an API key.
* [ ] Weekly Review includes connected snapshots.
* [ ] Weekly Review includes decisions due for review.
* [ ] Decision Registry supports create, read, update, delete.
* [ ] Decisions can link imported OS snapshots.
* [ ] Daily Command Center loads and saves local note/reflection.
* [ ] Import and Batch Import work on mobile width.
* [ ] Dashboard cards stack cleanly on mobile width.
* [ ] Tables scroll horizontally instead of breaking layout.

## Data Safety

* [ ] Sample data loaders confirm before replacing existing data.
* [ ] Clear-all actions require confirmation.
* [ ] TN Life OS remains read-only toward child OS data.
* [ ] Child OS apps remain standalone.
