import { Globe, Github, ExternalLink } from "lucide-react";
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
  return (
    <div className="relative bg-white dark:bg-hero-dark rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border border-transparent hover:border-orange/30 group h-full flex flex-col">
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
      <p className="text-sm text-light-charcoal dark:text-gray-300 leading-relaxed mb-4 line-clamp-2 min-h-[40px]">
        {short_description}
      </p>

      {/* Social Links */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/10 mt-auto min-h-[48px]">
        {links?.github && (
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
        {links?.discord && (
          <a
            href={links.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-orange hover:bg-orange/10 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.7123 21C17.7123 21 16.9726 20.0785 16.3561 19.2642C19.0479 18.4713 20.0753 16.7142 20.0753 16.7142C19.2328 17.2928 18.4314 17.7001 17.7123 17.9784C16.6849 18.4285 15.6986 18.7284 14.7329 18.8999C12.7602 19.2856 10.952 19.1785 9.41096 18.8785C8.23963 18.6427 7.23278 18.2999 6.39042 17.9571C5.91776 17.7642 5.40408 17.5285 4.89026 17.2285C4.82874 17.1856 4.76707 17.1642 4.70541 17.1213C4.6644 17.0999 4.64375 17.0785 4.62324 17.0572C4.2534 16.8428 4.0479 16.6929 4.0479 16.6929C4.0479 16.6929 5.03424 18.4071 7.64378 19.2213C7.02742 20.0357 6.26709 20.9999 6.26709 20.9999C1.72588 20.8499 0 17.7428 0 17.7428C0 10.843 2.95888 5.25014 2.95888 5.25014C5.91776 2.93587 8.7328 3.00018 8.7328 3.00018L8.9383 3.2574C5.23974 4.37139 3.53422 6.06443 3.53422 6.06443C3.53422 6.06443 3.98623 5.80735 4.74643 5.44305C6.94511 4.43585 8.69179 4.15738 9.41096 4.09308C9.53415 4.07155 9.63697 4.05016 9.7603 4.05016C11.1373 3.8631 12.5308 3.84874 13.911 4.00739C15.8629 4.24308 17.9589 4.84306 20.0958 6.06443C20.0958 6.06443 18.4726 4.45738 14.9794 3.34309L15.2671 3.00033C15.2671 3.00033 18.0821 2.93587 21.041 5.25028C21.041 5.25028 24 10.843 24 17.7428C24 17.7428 22.2533 20.85 17.7123 21ZM8.15746 10.993C6.98627 10.993 6.06173 12.0643 6.06173 13.3714C6.06173 14.6786 7.00678 15.7499 8.15746 15.7499C9.32879 15.7499 10.2533 14.6786 10.2533 13.3714C10.274 12.0643 9.32865 10.993 8.15746 10.993ZM15.6575 10.993C14.4862 10.993 13.5615 12.0643 13.5615 13.3714C13.5615 14.6786 14.5069 15.7499 15.6575 15.7499C16.8287 15.7499 17.7533 14.6786 17.7533 13.3714C17.7533 12.0643 16.8287 10.993 15.6575 10.993Z" />
            </svg>
          </a>
        )}
        {links?.twitter && (
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
        {links?.website && (
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
    </div>
  );
};

export default SpotlightCard;
