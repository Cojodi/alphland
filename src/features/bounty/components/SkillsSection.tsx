interface SkillsSectionProps {
  skills?: {
    [category: string]: string[];
  };
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const defaultSkills = {
    FRONTEND: ["React"],
    BACKEND: ["Javascript", "Python", "C++"],
    BLOCKCHAIN: ["Rust", "Solidity"],
  };

  const displaySkills = skills || defaultSkills;

  return (
    <div className="bg-white dark:bg-hero-dark rounded-xl p-6 border border-border-grey dark:border-dark-charcoal">
      <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
        Skills
      </h2>
      <div className="space-y-4">
        {Object.entries(displaySkills).map(([category, items]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-light-charcoal dark:text-lightgrey uppercase tracking-wide mb-2">
              {category}
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-orange/10 dark:bg-orange/20 text-orange rounded-lg text-sm font-medium hover:bg-orange/20 dark:hover:bg-orange/30 transition-colors cursor-pointer"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
