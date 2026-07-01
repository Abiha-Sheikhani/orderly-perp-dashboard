import { formatUnits, parseUnits } from "viem";

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export function truncateHash(hash: string, chars = 6): string {
  if (!hash) return "";
  return `${hash.slice(0, 2 + chars)}…${hash.slice(-chars)}`;
}

export function formatUsd(value: number, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value);
}

export function formatTokenAmount(raw: bigint, decimals: number, maxFractionDigits = 4): string {
  const formatted = formatUnits(raw, decimals);
  const [whole, fraction = ""] = formatted.split(".");
  const trimmedFraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, "");
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

export function safeParseUnits(value: string, decimals: number): bigint | null {
  if (!value || Number.isNaN(Number(value)) || Number(value) < 0) return null;
  try {
    return parseUnits(value, decimals);
  } catch {
    return null;
  }
}

export function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const divisions: [Intl.RelativeTimeFormatUnit, number][] = [
    ["seconds", 60],
    ["minutes", 60],
    ["hours", 24],
    ["days", 7],
  ];
  let duration = diffSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "seconds";
  for (const [u, amount] of divisions) {
    if (Math.abs(duration) < amount) {
      unit = u;
      break;
    }
    duration = Math.trunc(duration / amount);
    unit = u;
  }
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(duration, unit);
}
