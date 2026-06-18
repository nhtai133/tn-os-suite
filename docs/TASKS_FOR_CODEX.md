# Crypto OS — Tasks for Codex

Repo: `nhtai133/tn-os-suite` (pnpm + Turbo monorepo, TypeScript)
App: `apps/crypto-os` · dev: `pnpm --filter crypto-os dev` · port 3005

## Context cho Codex (đọc trước khi code)

- Đây là monorepo federated. **Mỗi child OS giữ data local riêng** và export ra `.tnos.json`. TN Life OS import read-only — KHÔNG được phá vỡ mô hình này.
- Code dùng chung đặt trong `packages/`. App-specific đặt trong `apps/crypto-os`.
- Framework: app Next.js (giả định App Router). Nếu thực tế là Vite/khác, giữ nguyên logic, chỉ đổi vị trí file cho khớp.
- Verify SAU MỖI task, phải pass hết:
  ```
  pnpm lint
  pnpm type-check
  pnpm build
  ```
- Quy ước: TypeScript strict, không `any` lỏng lẻo, không hardcode secret, secret để trong env. Không commit `.env`.
- Mỗi task = 1 PR nhỏ, có acceptance criteria rõ. Làm tuần tự T1 → T6.

---

## T1 — Live price layer (làm trước tiên)

**Mục tiêu:** dashboard hết cảnh toàn $0. Có giá thật để tính mọi metric.

**Việc cần làm**
- Tạo `packages/` module dùng chung, ví dụ `packages/market-data/` (vì Stocks OS / Investment OS sau cũng xài được).
- Provider CoinGecko (free tier). Hàm `getPrices(symbols: string[]): Promise<PriceMap>`.
- `PriceMap[symbol] = { usd: number; change24h: number; change7d: number; marketCap: number }`.
- Cache in-memory TTL 60s để tránh rate limit.
- Map symbol → CoinGecko id (config table, có thể mở rộng).

**Acceptance**
- [ ] Gọi được giá cho ít nhất BTC, ETH + 1 stablecoin
- [ ] Cache hoạt động (gọi 2 lần trong 60s không bắn 2 request)
- [ ] Dashboard hiển thị giá thật cho holdings đang có
- [ ] `pnpm lint && pnpm type-check && pnpm build` pass

**KHÔNG làm:** sync ví, PNL — để task sau.

---

## T2 — Holdings & manual entry → metric thật

**Mục tiêu:** Total Portfolio, BTC Held, ETH Held, Stablecoins, Cold Storage tính từ holdings × giá T1.

**Việc cần làm**
- Data model holding (lưu local theo mô hình hiện tại của app, đừng đổi storage layer nếu chưa cần):
  ```ts
  type Holding = {
    id: string
    asset: string
    symbol: string
    qty: number
    source: 'manual' | 'wallet' | 'exchange'
    isColdStorage?: boolean
  }
  ```
- Trang Holdings: thêm/sửa/xóa thủ công.
- Selector tính: `totalUSD`, `btcHeld`, `ethHeld`, `stablecoinUSD`, `coldStorageUSD` (sum theo `isColdStorage`).
- Card dashboard đọc từ selector này.

**Acceptance**
- [ ] Thêm 1 holding BTC → Total Portfolio và BTC Held cập nhật đúng
- [ ] Đánh dấu cold storage → Cold Storage card cập nhật
- [ ] Stablecoins card chỉ tính các stablecoin
- [ ] Build/lint/type-check pass

---

## T3 — Transactions & PNL engine

**Mục tiêu:** Total PNL là số thật, không phải số trang trí.

**Việc cần làm**
- Model transaction:
  ```ts
  type Tx = {
    id: string
    asset: string
    side: 'buy' | 'sell' | 'transfer'
    qty: number
    priceUSD: number
    fee: number
    ts: number
    note?: string
  }
  ```
- Engine tính avg cost (mặc định average, có thể chọn FIFO sau).
- `realizedPnl` (đã bán) + `unrealizedPnl` (đang hold, dùng giá T1).
- Trang Transactions: list + thêm tx. Holdings.qty có thể tự suy từ tx (hoặc giữ song song — chọn 1 nguồn sự thật, ghi rõ trong PR).

**Acceptance**
- [ ] Buy rồi giá tăng → unrealized PNL dương đúng
- [ ] Buy rồi sell một phần → realized PNL đúng
- [ ] Total PNL card = realized + unrealized
- [ ] Build/lint/type-check pass

---

## T4 — Wallet read-only sync

**Mục tiêu:** nhập address → tự pull balance, đỡ nhập tay.

**Việc cần làm**
- Trang Wallets: thêm `{ label, chain, address }`, READ-ONLY (không bao giờ nhập private key/seed).
- Provider EVM (Etherscan/Alchemy) lấy native + ERC20 balance; BTC dùng mempool.space.
- API key provider để trong env, không hardcode.
- Map balance → holdings source `'wallet'` (không trộn lẫn với manual).
- Nút refresh thủ công.

**Acceptance**
- [ ] Thêm 1 địa chỉ EVM công khai → kéo được số dư ETH + token
- [ ] Holdings từ ví được tag `source: 'wallet'`
- [ ] Không có chỗ nào yêu cầu private key
- [ ] Build/lint/type-check pass

---

## T5 — Snapshot mở rộng cho Discord (tận dụng Export Snapshot sẵn có)

**Mục tiêu:** chuẩn hóa snapshot để vừa giữ `.tnos.json` (cho TN Life OS) vừa bắn được lên Discord.

**Việc cần làm**
- Đảm bảo Export Snapshot xuất các field: `totalUSD, pnlUSD, pnl24hPct, btcHeld, ethHeld, stablecoinUSD, coldStorageUSD, topMovers[], btcGoalPct, ts`.
- Giữ nguyên format `.tnos.json` cho TN Life OS (không phá schema import).
- Tách hàm `buildSnapshot(): CryptoSnapshot` để T6 tái dùng.

**Acceptance**
- [ ] `.tnos.json` vẫn import được vào TN Life OS như cũ
- [ ] `buildSnapshot()` trả đủ field trên
- [ ] Build/lint/type-check pass

---

## T6 — Discord daily snapshot (webhook)

**Mục tiêu:** mỗi ngày tự đẩy tổng quan portfolio vào Discord channel.

**Việc cần làm**
- Settings: ô nhập `DISCORD_WEBHOOK_URL` (lưu env hoặc settings local, KHÔNG commit, KHÔNG hardcode).
- Hàm `pushToDiscord(snapshot)` build embed: Total Portfolio, PNL 24h, top movers, % tới BTC goal, timestamp.
- Trigger: nút "Push to Discord" thủ công trước; cron/daily làm sau.
- Xử lý lỗi: webhook sai/timeout không crash app.

**Acceptance**
- [ ] Bấm nút → Discord nhận embed đúng số liệu
- [ ] Webhook URL không xuất hiện trong source/commit
- [ ] Lỗi webhook được catch, có thông báo trong UI
- [ ] Build/lint/type-check pass

---

## Backlog (sau v1, mỗi cái 1 task riêng)
- Exchange read-only sync (API key READ-only, mã hóa khi lưu)
- Portfolio chart theo thời gian + benchmark vs BTC/ETH
- Target allocation / rebalance gợi ý
- DeFi positions: APY, impermanent loss, health factor + alert thanh lý
- Token approval audit + revoke
- Alert engine đa kênh (price / drawdown / liquidation → Discord realtime)
- Discord bot slash commands (`/portfolio`, `/pnl`)
- Fear & Greed index + watchlist
- Import CSV + xuất báo cáo thuế

---

## Quy tắc chung cho mọi task
1. Chỉ đụng scope của task đó, không refactor lan man.
2. Không phá mô hình local-data + `.tnos.json` export read-only.
3. Không hardcode secret; dùng env; thêm vào `.gitignore` nếu cần.
4. Ví: chỉ address read-only. Sàn: API key chỉ quyền READ.
5. Chạy `pnpm lint && pnpm type-check && pnpm build` trước khi báo xong.
