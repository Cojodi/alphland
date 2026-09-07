import { DollarSign } from "lucide-react";
import { formatAlph, formatUsd, useAlphPrice } from "../hooks/useAlphPrice";

export type Denomination = "alph" | "usd";

interface RewardInputProps {
  denomination: Denomination;
  /** The single number the sponsor types — ALPH or USD per `denomination`. */
  amount: string;
  onDenominationChange: (d: Denomination) => void;
  onAmountChange: (value: string) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full pl-14 pr-4 py-3 bg-smoked-white dark:bg-light-black border " +
  "border-border-grey dark:border-dark-charcoal rounded-lg text-black " +
  "dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange";

const labelClass =
  "block text-sm font-semibold text-light-charcoal dark:text-lightgrey " +
  "font-barlow mb-2";

/**
 * Reward amount + which currency the sponsor is fixing it in.
 *
 * Exactly one number is ever entered. The other side is shown underneath as
 * an approximation and is never submitted — the server derives and stores it
 * from its own rate. This replaces the old form's hand-typed "USD Reference"
 * field, which was the source of every unverifiable USD figure in the DB.
 */
export default function RewardInput({
  denomination,
  amount,
  onDenominationChange,
  onAmountChange,
  disabled,
}: RewardInputProps) {
  const { price, loading } = useAlphPrice();

  const numeric = parseFloat(amount);
  const hasAmount = Number.isFinite(numeric) && numeric > 0;

  const conversion = () => {
    if (!hasAmount) return null;
    if (loading) return "Loading exchange rate…";
    if (!price) {
      return denomination === "usd"
        ? "Exchange rate unavailable — the ALPH amount will be set once it returns."
        : "Exchange rate unavailable — the USD value will be filled in shortly.";
    }
    return denomination === "alph"
      ? `≈ ${formatUsd(numeric * price.usd)}`
      : `≈ ${formatAlph(numeric / price.usd)} at today's rate — recalculated ` +
          `at the rate on the day you pay out.`;
  };

  const hint = conversion();

  return (
    <>
      <div>
        <label className={labelClass}>Reward Denomination *</label>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["alph", "Fixed in ALPH"],
              ["usd", "Fixed in USD"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="denomination"
                checked={denomination === value}
                disabled={disabled}
                onChange={() => onDenominationChange(value)}
                className="w-4 h-4 text-orange focus:ring-orange"
              />
              <span className="text-black dark:text-white font-barlow">
                {label}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-light-charcoal dark:text-lightgrey mt-2 font-barlow">
          {denomination === "alph"
            ? "You pay exactly this many ALPH. Its USD value moves with the market."
            : "You guarantee this much USD value. The ALPH you pay moves with the market."}
        </p>
      </div>

      <div>
        <label className={labelClass}>
          Reward Amount ({denomination === "alph" ? "ALPH" : "USD"}) *
        </label>
        <div className="relative">
          {denomination === "alph" ? (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-light-charcoal dark:text-lightgrey">
              ALPH
            </span>
          ) : (
            <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-light-charcoal dark:text-lightgrey" />
          )}
          <input
            type="number"
            name="reward_amount"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            required
            min="0"
            step="0.01"
            disabled={disabled}
            placeholder={denomination === "alph" ? "e.g., 500" : "0.00"}
            className={inputClass}
          />
        </div>
        {hint && (
          <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1 font-barlow">
            {hint}
          </p>
        )}
      </div>
    </>
  );
}
