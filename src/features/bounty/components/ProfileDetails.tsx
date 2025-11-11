interface ProfileDetailsProps {
  lookingFor?: string;
  worksAt?: string;
  location?: string;
}

export function ProfileDetails({
  lookingFor,
  worksAt,
  location,
}: ProfileDetailsProps) {
  const details = [
    {
      label: "Looking for",
      value: lookingFor || "Not specified",
    },
    {
      label: "Works at",
      value: worksAt || "Not specified",
    },
    {
      label: "Based in",
      value: location || "Not specified",
    },
  ];

  return (
    <div className="bg-white dark:bg-hero-dark rounded-xl p-6 border border-border-grey dark:border-dark-charcoal">
      <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
        Details
      </h2>
      <div className="space-y-4">
        {details.map((item, idx) => (
          <div
            key={idx}
            className="border-b border-border-grey dark:border-dark-charcoal pb-3 last:border-b-0"
          >
            <p className="text-sm text-light-charcoal dark:text-lightgrey mb-1">
              {item.label}
            </p>
            <p className="text-black dark:text-white font-medium">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
