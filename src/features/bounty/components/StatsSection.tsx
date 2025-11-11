interface StatsSectionProps {
  earned?: number;
  submissions?: number;
  won?: number;
}

export function StatsSection({
  earned = 0,
  submissions = 0,
  won = 0,
}: StatsSectionProps) {
  const stats = [
    { label: "Earned", value: `$${earned.toLocaleString()}` },
    { label: "Submissions", value: submissions.toString() },
    { label: "Won", value: won.toString() },
  ];

  return (
    <div className="bg-white dark:bg-hero-dark rounded-xl p-6 border border-border-grey dark:border-dark-charcoal">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-bold text-accessible-green mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-light-charcoal dark:text-lightgrey">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
