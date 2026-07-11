import { NextResponse } from "next/server";

/** USD-base rates (approximate; refreshed periodically for demo). */
const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.921,
  GBP: 0.789,
  JPY: 156.8,
  INR: 83.42,
  AUD: 1.528,
  CAD: 1.367,
  CHF: 0.894,
  CNY: 7.245,
  SGD: 1.342,
  AED: 3.673,
  MXN: 17.12,
  BRL: 5.18,
  KRW: 1378.5,
  ZAR: 18.65,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")?.toUpperCase() ?? "USD";
  const to = searchParams.get("to")?.toUpperCase() ?? "EUR";

  const fromRate = USD_RATES[from];
  const toRate = USD_RATES[to];

  if (fromRate == null || toRate == null) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  const rate = toRate / fromRate;

  return NextResponse.json({
    from,
    to,
    rate,
    date: new Date().toISOString().slice(0, 10),
    source: "local-demo",
  });
}
