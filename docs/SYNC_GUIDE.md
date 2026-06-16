# TN OS Suite Sync Guide

## Model

TN OS Suite uses manual snapshot sync for v1.0.

Each child OS exports a `.tnos.json` file. TN Life OS imports that file read-only. TN Life OS never writes back into child OS storage.

## Single Import

1. Open the child OS export page.
2. Download the `.tnos.json` snapshot.
3. Open TN Life OS `/import`.
4. Drop or browse to the file.
5. Confirm the connection status updates.

## Batch Import

1. Export snapshots from all child OS apps.
2. Open TN Life OS `/import/batch`.
3. Select or drop all `.tnos.json` files.
4. Review imported, replaced, skipped, and rejected counts.
5. Check stale warnings.

Duplicate snapshots for the same OS type are resolved by `generated_at`; the newest file wins.

## Snapshot Owners

* Investment OS owns investment data.
* Trading OS owns trading data.
* Wealth OS owns wealth data.
* Business OS owns business data.
* Crypto OS owns crypto data.
* Stocks OS owns stocks data.
* TN Life OS owns imported snapshot copies, decisions, daily notes, and reflections.

## Backup Instructions

* Export `.tnos.json` snapshots after meaningful edits in child apps.
* Keep dated copies outside the browser profile.
* For Trading OS, use its backup/export tools for local trading data in addition to `.tnos.json`.
* Before clearing browser storage, export every app snapshot and verify the files are readable JSON.

## Stale Data

Snapshots older than 7 days are marked stale. Refresh stale snapshots before weekly review or major decisions.
