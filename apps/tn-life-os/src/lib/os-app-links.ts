import type { OSType } from "@tn-os/schemas";

const CHILD_APP_PORTS: Partial<Record<OSType, number>> = {
  wealth_os:     3003,
  investment_os: 3001,
  trading_os:    3002,
  crypto_os:     3005,
  stocks_os:     3006,
  business_os:   3004,
};

function buildUrl(port: number): string {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`;
}

export function getOSAppUrl(osType: OSType): string | undefined {
  const envOverrides: Partial<Record<OSType, string | undefined>> = {
    wealth_os:     process.env.NEXT_PUBLIC_WEALTH_OS_URL,
    investment_os: process.env.NEXT_PUBLIC_INVESTMENT_OS_URL,
    trading_os:    process.env.NEXT_PUBLIC_TRADING_OS_URL,
    crypto_os:     process.env.NEXT_PUBLIC_CRYPTO_OS_URL,
    stocks_os:     process.env.NEXT_PUBLIC_STOCKS_OS_URL,
    business_os:   process.env.NEXT_PUBLIC_BUSINESS_OS_URL,
  };

  const envUrl = envOverrides[osType];
  if (envUrl) return envUrl;

  const port = CHILD_APP_PORTS[osType];
  if (port == null) return undefined;
  return buildUrl(port);
}
