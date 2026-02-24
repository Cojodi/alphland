interface StatsSectionProps {
  earned?: number;
  alphEarned?: number;
  submissions?: number;
  won?: number;
}

export function StatsSection({
  earned = 0,
  alphEarned = 0,
  submissions = 0,
  won = 0,
}: StatsSectionProps) {
  return (
    <div className="bg-white dark:bg-hero-dark rounded-xl p-6 border border-border-grey dark:border-dark-charcoal">
      <div className="grid grid-cols-3 gap-4">
        {/* Earned — shows USD ref and/or actual ALPH paid */}
        <div className="text-center">
          {earned > 0 && (
            <p className="text-2xl font-bold text-accessible-green leading-tight">
              ${earned.toLocaleString()}
            </p>
          )}
          {alphEarned > 0 && (
            <p className="text-2xl font-bold text-accessible-green leading-tight">
              {alphEarned.toLocaleString()} ALPH
            </p>
          )}
          {earned === 0 && alphEarned === 0 && (
            <p className="text-2xl font-bold text-accessible-green leading-tight">
              —
            </p>
          )}
          <p className="text-sm text-light-charcoal dark:text-lightgrey mt-1">
            Earned
          </p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-accessible-green mb-1">
            {submissions.toString()}
          </p>
          <p className="text-sm text-light-charcoal dark:text-lightgrey">
            Submissions
          </p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-accessible-green mb-1">
            {won.toString()}
          </p>
          <p className="text-sm text-light-charcoal dark:text-lightgrey">Won</p>
        </div>
      </div>
    </div>
  );
}
