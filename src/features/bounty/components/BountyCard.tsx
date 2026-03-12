import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { sponsorSlug } from "../utils";

interface BountyCardProps {
  id: string;
  sponsorId?: string;
  logo?: string;
  title: string;
  company: string;
  reward: string;
  tags: string[];
  sponsorVerified?: boolean;
}

// Helper function to determine tag style based on semantic meaning
const getTagStyle = (tag: string): string => {
  const tagLower = tag.toLowerCase();

  // Featured/highlighted - orange
  if (tag === "FEATURED") {
    return "bg-orange/10 text-orange dark:bg-orange/20";
  }

  // Positive states - green (including "due in Xd")
  if (
    tagLower === "active" ||
    tagLower === "open" ||
    tagLower === "verified" ||
    tagLower.startsWith("due in") ||
    tagLower === "due today"
  ) {
    return "bg-accessible-green/10 text-accessible-green dark:bg-accessible-green/20";
  }

  // Negative/warning states - red
  if (tagLower === "overdue" || tagLower === "ended" || tagLower === "closed") {
    return "bg-danger-red/10 text-danger-red dark:bg-danger-red/20";
  }

  // Completed state - muted/neutral success
  if (tagLower === "completed") {
    return "bg-accessible-green/10 text-light-charcoal dark:text-lightgrey";
  }

  // Neutral states - default styling (categories, difficulty, due dates, etc.)
  return "bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-lightgrey";
};

export function BountyCard({
  id,
  sponsorId,
  logo,
  title,
  company,
  reward,
  tags,
  sponsorVerified = false,
}: BountyCardProps) {
  return (
    <Link href={`/bounty/${id}`}>
      <a className="block p-6 bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-xl hover:shadow-box-image-shadow-hover transition hover:border-orange/20 cursor-pointer">
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
            <p className="text-sm text-light-charcoal dark:text-lightgrey mb-3 flex items-center gap-1">
              {sponsorId && company ? (
                <Link href={`/bounty/sponsor/${sponsorSlug(company)}`}>
                  <a
                    className="hover:text-orange transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {company}
                  </a>
                </Link>
              ) : (
                company
              )}
              {sponsorVerified && (
                <CheckCircle className="w-4 h-4 text-accessible-green flex-shrink-0" />
              )}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className={`text-xs font-medium px-2 py-1 rounded ${getTagStyle(tag)}`}
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
      </a>
    </Link>
  );
}
