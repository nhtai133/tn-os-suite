import { NextResponse } from "next/server";
import { getPrices } from "@tn-os/market-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbols = (url.searchParams.get("symbols") ?? "")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  try {
    const prices = await getPrices(symbols);
    return NextResponse.json({ prices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown market data error";
    return NextResponse.json({ error: message, prices: {} }, { status: 502 });
  }
}
