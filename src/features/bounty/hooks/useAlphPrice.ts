import { useEffect, useState } from "react";

export interface AlphPrice {
  usd: number;
  fetched_at: number;
  age_seconds: number;
}

/**
 * The ALPH/USD rate the backend last recorded (refreshed daily at 08:00
 * Europe/Berlin). Used only to show the approximate other side of a reward —
 * never to compute a value that gets stored, which the server does itself so
 * the client cannot influence what a bounty is worth.
 *
 * `price` stays null while loading and if the feed is unavailable; callers
 * must render without the conversion rather than showing a wrong number.
 */
export function useAlphPrice() {
  const [price, setPrice] = useState<AlphPrice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/price/alph")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setPrice(
          data && typeof data.usd === "number" && data.usd > 0 ? data : null,
        );
      })
      .catch(() => {
        if (!cancelled) setPrice(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { price, loading };
}

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const alphFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export const formatUsd = (n: number) => usdFmt.format(n);
export const formatAlph = (n: number) => `${alphFmt.format(n)} ALPH`;
