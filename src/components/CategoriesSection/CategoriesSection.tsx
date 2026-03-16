import { categories } from "../../data/categories";
import { useDarkMode } from "../../hooks/useDarkMode";
import Image from "next/image";
import Link from "next/link";

interface CategoryCount {
  [key: string]: number;
}

interface CategoriesSectionProps {
  categoryCounts: CategoryCount;
}

const CategoriesSection = ({ categoryCounts }: CategoriesSectionProps) => {
  const { currentTheme } = useDarkMode();

  // Filter out categories with 0 dApps and "ComingSoon"
  const visibleCategories = categories.filter(
    (cat) => cat.key !== "soon" && (categoryCounts[cat.key] || 0) > 0,
  );

  return (
    <section className="mb-16">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-1">
          Explore Categories
        </h2>
        <p className="text-light-charcoal dark:text-gray-400">
          Discover apps and tools by category
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleCategories.map((category) => (
          <Link key={category.key} href={`/explore?categories=${category.key}`}>
            <a className="flex items-center gap-4 p-4 bg-white dark:bg-hero-dark rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-white/10 hover:border-orange/30 transition-all group">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange/10 transition-colors">
                <Image
                  src={
                    currentTheme === "dark" ? category.iconDark : category.icon
                  }
                  alt={category.name}
                  width={24}
                  height={24}
                />
              </div>

              {/* Text */}
              <div className="min-w-0">
                <h3 className="font-semibold text-black dark:text-white group-hover:text-orange transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-light-charcoal dark:text-gray-400">
                  {categoryCounts[category.key] || 0} apps & tools
                </p>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
