import type { OSType } from "@tn-os/schemas";

const CHILD_APP_URLS: Partial<Record<OSType, string>> = {
  wealth_os: process.env.NEXT_PUBLIC_WEALTH_OS_URL ?? "http://localhost:3003",
  investment_os: process.env.NEXT_PUBLIC_INVESTMENT_OS_URL ?? "http://localhost:3001",
  trading_os: process.env.NEXT_PUBLIC_TRADING_OS_URL ?? "http://localhost:3002",
  crypto_os: process.env.NEXT_PUBLIC_CRYPTO_OS_URL ?? "http://localhost:3005",
  stocks_os: process.env.NEXT_PUBLIC_STOCKS_OS_URL ?? "http://localhost:3006",
  business_os: process.env.NEXT_PUBLIC_BUSINESS_OS_URL ?? "http://localhost:3004",
};

export function getOSAppUrl(osType: OSType): string | undefined {
  return CHILD_APP_URLS[osType];
}
