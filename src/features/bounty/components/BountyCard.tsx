import Link from "next/link";
import Image from "next/image";

interface BountyCardProps {
  id: string;
  logo?: string;
  title: string;
  company: string;
  reward: string;
  tags: string[];
}

export function BountyCard({
  id,
  logo,
  title,
  company,
  reward,
  tags,
}: BountyCardProps) {
  return (
    <Link href={`/bounty/${id}`}>
      <div className="p-6 bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-xl hover:shadow-box-image-shadow-hover transition hover:border-orange/20 cursor-pointer">
        <div className="flex gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange/20 to-accessible-green/20 dark:from-orange/10 dark:to-accessible-green/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
            {logo && logo !== "💼" ? (
              logo.startsWith("http://") ||
              logo.startsWith("https://") ||
              logo.startsWith("/") ? (
                // Use Next.js Image for R2 URLs and internal paths
                <Image
                  src={logo}
                  alt={company}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                // Fallback for emoji
                <span className="text-2xl">{logo}</span>
              )
            ) : (
              <span className="text-2xl">📦</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-black dark:text-white mb-1 line-clamp-2 hover:text-orange transition">
              {title}
            </h3>
            <p className="text-sm text-light-charcoal dark:text-lightgrey mb-3">
              {company}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    tag === "FEATURED"
                      ? "bg-orange/10 text-orange dark:bg-orange/20"
                      : "bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-lightgrey"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Reward */}
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-accessible-green text-lg">{reward}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
