import { Globe, Github, MessageCircle, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SpotlightCardProps {
  title: string;
  short_description: string;
  logo: string;
  url: string;
  tags: string[];
  links?: {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    github?: string;
  };
}

const SpotlightCard = ({
  title,
  short_description,
  logo,
  url,
  tags,
  links,
}: SpotlightCardProps) => {
  const hasLinks =
    links &&
    (links.website ||
      links.twitter ||
      links.discord ||
      links.telegram ||
      links.github);

  return (
    <div className="relative bg-white dark:bg-hero-dark rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border border-transparent hover:border-orange/30 group">
      {/* External link icon */}
      <Link href={url}>
        <a className="absolute top-4 right-4 text-gray-400 hover:text-orange transition-colors">
          <ExternalLink className="w-4 h-4" />
        </a>
      </Link>

      {/* Logo and Title */}
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/10">
          <div className="relative w-full h-full">
            <Image
              src={logo}
              alt={`${title} logo`}
              layout="fill"
              objectFit="cover"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Link href={url}>
            <a className="block">
              <h3 className="font-bold text-lg text-black dark:text-white truncate group-hover:text-orange transition-colors">
                {title}
              </h3>
            </a>
          </Link>
          {/* Tags */}
          {tags.length > 0 && (
            <span className="inline-block text-xs font-medium text-orange bg-orange/10 px-2 py-0.5 rounded-full mt-1">
              {tags[0]}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-light-charcoal dark:text-gray-300 leading-relaxed mb-4 line-clamp-3">
        {short_description}
      </p>

      {/* Social Links */}
      {hasLinks && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-orange hover:bg-orange/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {links.discord && (
            <a
              href={links.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-orange hover:bg-orange/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {links.twitter && (
            <a
              href={links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-orange hover:bg-orange/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
          {links.website && (
            <a
              href={links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-orange hover:bg-orange/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default SpotlightCard;
