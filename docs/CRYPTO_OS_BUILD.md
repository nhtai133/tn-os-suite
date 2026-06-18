# Crypto OS — Build Spec & Roadmap

> TN OS Suite · `Crypto OS` · port 3005
> Mục tiêu: biến dashboard tĩnh (đang toàn $0, nhập tay) thành một crypto OS dùng được hằng ngày, có live data, auto-sync, alert và đẩy snapshot lên Discord.

---

## 0. Trạng thái hiện tại

Đang có (UI shell tốt):
- Dashboard layout: Total Portfolio, Total PNL, BTC/ETH held, Stablecoins, DeFi Exposure, Cold Storage, Security Score
- Các card: Exchange Risk, Security Status, BTC Target, Top Holdings, DeFi Positions, Security Checklist
- Nav: Holdings · Wallets · Exchanges · Stablecoins · DeFi Positions · Transactions · Crypto Thesis · Security · Export Snapshot · Settings

Vấn đề cốt lõi: **không có lớp market data + không có nguồn số dư**, nên mọi metric = $0. Đây là việc cần làm trước.

---

## 1. Roadmap theo tier (ưu tiên build từ trên xuống)

### Tier 1 — Làm dashboard "sống dậy" (bắt buộc)
- [ ] **Live price feed** — cắm CoinGecko / CMC API: giá, market cap, 24h %, 7d %
- [ ] **Auto-sync số dư**
  - [ ] Ví read-only: nhập address → pull balance (EVM, BTC, Solana)
  - [ ] Sàn read-only: API key chỉ quyền READ (Binance, OKX, Bybit...)
- [ ] **Cost basis + PNL thật** — avg entry, realized vs unrealized, FIFO/LIFO
- [ ] **Manual entry fallback** — vẫn cho nhập tay khi không có API

### Tier 2 — Đầu tư tốt hơn
- [ ] **Portfolio chart theo thời gian** + benchmark vs BTC/ETH ("nếu all-in BTC thì sao")
- [ ] **Target allocation / rebalance** — tỷ trọng hiện tại vs mục tiêu, gợi ý cân lại
- [ ] **DCA tracker** — lịch sử mua đều, avg entry, % tới goal (mở rộng "BTC Target")
- [ ] **Alerts engine** — cảnh báo giá, cảnh báo biến động portfolio > X%

### Tier 3 — DeFi & Security (phần yếu nhất hiện tại)
- [ ] **DeFi nâng cao** — APY/yield đang ăn, impermanent loss
- [ ] **Health factor + cảnh báo thanh lý** cho vị thế vay (Aave, Compound...)
- [ ] **Token approval audit + revoke** — quét approval rủi ro trên ví
- [ ] **Security Score thực** — chấm điểm dựa trên checklist thật (2FA, cold storage %, approval sạch...)
- [ ] **Fear & Greed index + watchlist** — coin đang research nhưng chưa hold

### Tier 4 — Discord & Export
- [ ] **Discord webhook** — push daily snapshot tự động
- [ ] **Discord bot** — lệnh `/portfolio`, `/pnl`, `/alerts`
- [ ] **Route alert** (giá + liquidation) về channel
- [ ] **Import CSV + xuất báo cáo thuế**

**Thứ tự build đề xuất:** Live price → Auto-sync ví → PNL thật → Discord alert.

---

## 2. Đặc tả tính năng (chi tiết để tách thành task/issue)

### 2.1 Live Price Feed
- Nguồn: CoinGecko (free tier ok để bắt đầu), fallback CMC
- Cache giá 30–60s để tránh rate limit
- Lưu giá lịch sử để vẽ chart (xem 2.2)
- Output: `priceMap[symbol] = { usd, change24h, change7d, marketCap }`

### 2.2 Portfolio History & Chart
- Cron snapshot tổng giá trị portfolio mỗi X giờ → lưu vào DB
- Chart: 24h / 7d / 30d / 1y / all
- Overlay benchmark: portfolio vs BTC vs ETH (chuẩn hoá về 100 tại điểm đầu)

### 2.3 Wallet & Exchange Sync
- Ví: dùng RPC/explorer API (Etherscan/Alchemy cho EVM, mempool.space cho BTC)
- Sàn: API key **read-only**, không bao giờ lưu key có quyền trade/withdraw
- Lưu key mã hoá (không để plaintext trong DB/localStorage)
- Refresh thủ công + auto refresh theo interval

### 2.4 PNL Engine
- Mỗi giao dịch: `{ asset, side, qty, priceUSD, fee, timestamp }`
- Avg cost theo phương pháp chọn được (FIFO/LIFO/avg)
- Realized PNL (đã bán) vs Unrealized PNL (đang hold)
- Hiển thị theo từng coin + tổng

### 2.5 Alerts Engine
- Loại alert: price above/below, % change 24h, portfolio drawdown, health factor thấp
- Mỗi alert: `{ type, target, condition, channel (in-app | discord), enabled }`
- Engine chạy theo interval, so điều kiện, bắn notification + log

### 2.6 DeFi & Health Factor
- Pull vị thế từ protocol (subgraph hoặc API như DeBank/Zapper)
- Tính: collateral, debt, health factor, liquidation price
- Alert khi health factor < ngưỡng (vd 1.5)

### 2.7 Token Approval Audit
- Quét approvals của ví (Revoke.cash API hoặc tự đọc Approval events)
- Đánh dấu approval unlimited / contract đáng ngờ
- Nút dẫn tới revoke (mở tx hoặc link revoke.cash)

---

## 3. Gợi ý data model

```ts
// Holding
{ id, asset, symbol, qty, source: 'manual'|'wallet'|'exchange', sourceId }

// Transaction
{ id, asset, side: 'buy'|'sell'|'transfer', qty, priceUSD, fee, ts, note }

// Wallet
{ id, label, chain, address, readOnly: true }

// ExchangeAccount
{ id, label, exchange, apiKeyEnc, permission: 'read' }

// DeFiPosition
{ id, protocol, type: 'lp'|'lend'|'borrow', assets[], apy, healthFactor, liqPrice }

// Alert
{ id, type, asset, condition, threshold, channel, enabled }

// Snapshot
{ ts, totalUSD, pnlUSD, btcHeld, ethHeld, stablecoinUSD, securityScore }
```

---

## 4. Discord Integration

### 4.1 Daily snapshot (webhook — dễ nhất, làm trước)
- Cron mỗi ngày → tạo embed: tổng portfolio, PNL 24h, top movers, % tới BTC goal
- POST tới Discord webhook URL (lưu trong Settings)
- Tận dụng sẵn nút **Export Snapshot** làm payload

### 4.2 Bot commands (làm sau)
- `/portfolio` — tổng quan hiện tại
- `/pnl [period]` — lãi/lỗ theo khoảng thời gian
- `/holding <symbol>` — chi tiết 1 coin
- `/alerts` — list + bật/tắt alert

### 4.3 Alert routing
- Alert engine (2.5) có channel = `discord` → bắn realtime vào channel
- Ưu tiên: liquidation warning, price target hit, drawdown lớn

**Bảo mật Discord:** webhook URL và bot token để trong env/Settings, không hardcode, không commit lên git.

---

## 5. Nguyên tắc bảo mật (xuyên suốt)
- API key sàn: **chỉ READ**, không bao giờ xin quyền trade/withdraw
- Mã hoá mọi secret khi lưu; không để plaintext
- Ví chỉ read-only (address), không bao giờ nhập private key/seed vào app
- `.env` + secrets không commit; thêm vào `.gitignore`
- Security Score nên phản ánh thực: cold storage %, 2FA, approval sạch, không key thừa quyền

---

## 6. Định nghĩa "xong" cho v1
- [ ] Mọi metric trên dashboard có số thật (không còn $0 giả)
- [ ] Ít nhất 1 ví + 1 sàn auto-sync
- [ ] PNL realized + unrealized đúng
- [ ] Chart portfolio + benchmark BTC
- [ ] Daily snapshot tự đẩy lên Discord
- [ ] 1 loại alert hoạt động end-to-end (price → Discord)
