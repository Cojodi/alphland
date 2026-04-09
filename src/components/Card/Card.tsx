import truncate from "../../helpers/truncate";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";

const DAPP_TAGS = ["DeFi", "NFTs", "Games", "Quests", "Social"];

function getEntryTypeLabel(tags: string[]): string {
  if (tags.some((t) => DAPP_TAGS.includes(t))) return "dApp";
  if (tags.includes("Wallets")) return "Wallet";
  if (tags.includes("CEX") || tags.includes("Onramps")) return "Exchange";
  if (tags.includes("Bridges")) return "Bridge";
  return "Tool";
}

interface CardProps {
  image: string | StaticImageData;
  logo: string | StaticImageData;
  title: string;
  short_description: string;
  url: string;
  tags: string[];
}

const Card = ({
  image,
  logo,
  title,
  short_description,
  tags,
  url,
}: CardProps) => {
  // Show all tags at the bottom
  const displayTags = tags;
  const typeLabel = getEntryTypeLabel(tags);
  return (
    <Link href={url || "/"}>
      <a className="block w-full cursor-pointer group">
        {/* Desktop Card */}
        <div className="hidden lg:block relative rounded-2xl bg-white dark:bg-hero-dark shadow-lg hover:shadow-xl transition-shadow duration-300">
          {/* Banner Section - Top Half */}
          <div className="relative h-40 overflow-hidden rounded-t-2xl">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{
                backgroundImage: `url(${image})`,
              }}
            >
              {/* Overlay for better readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
            </div>
            {/* Type badge */}
            <span className="absolute top-3 right-3 z-10 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/20 text-white border border-white/30">
              {typeLabel}
            </span>
          </div>

          {/* Bottom Left Logo Circle - Overlapping both sections */}
          <div className="absolute left-6 z-20" style={{ top: "128px" }}>
            <div className="w-16 h-16 rounded-full bg-white dark:bg-tooltip-dark flex items-center justify-center shadow-lg border-4 border-white dark:border-hero-dark">
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={logo}
                  alt={`${title} - logo`}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </div>
          </div>

          {/* Description Section - Bottom Half */}
          <div className="p-6 pt-12 rounded-b-2xl">
            {/* Title */}
            <h3 className="text-xl font-bold text-light-black dark:text-white mb-2 line-clamp-1">
              {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-light-charcoal dark:text-white leading-relaxed mb-4 line-clamp-2 h-[46px]">
              {short_description}
            </p>

            {/* Tags - Always render container to maintain consistent card height */}
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {displayTags.length > 0 && (
                <>
                  {displayTags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block text-xs font-medium text-light-charcoal dark:text-white bg-smoked-white dark:bg-tooltip-dark px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {displayTags.length > 3 && (
                    <span className="inline-block text-xs font-medium text-light-charcoal dark:text-white px-2 py-1">
                      +{displayTags.length - 3}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Card - Horizontal Layout */}
        <div className="lg:hidden grid grid-cols-[64px_1fr_auto] items-center gap-3 p-3 bg-white dark:bg-hero-dark rounded-xl shadow-md">
          <div className="w-16 h-16 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
            <div className="relative w-full h-full">
              <Image
                src={logo}
                alt={`${title} - logo`}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="min-w-0">
            <h5 className="text-base font-bold text-light-black dark:text-white truncate">
              {title}
            </h5>
            <p className="text-sm text-light-charcoal dark:text-white line-clamp-2">
              {truncate(short_description, 10)}
            </p>
          </div>
          <div className="flex justify-center items-center bg-orange hover:bg-orange/90 text-white font-semibold text-xs px-4 py-2 rounded-full whitespace-nowrap transition-colors">
            View
          </div>
        </div>
      </a>
    </Link>
  );
};

export default Card;
