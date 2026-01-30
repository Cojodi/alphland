import { ArrowRight } from "lucide-react";
import Link from "next/link";
import SpotlightCard from "./SpotlightCard";

interface SpotlightDapp {
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

interface SpotlightProps {
  dapps: SpotlightDapp[];
}

const Spotlight = ({ dapps }: SpotlightProps) => {
  return (
    <section className="mb-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-1">
            Spotlight
          </h2>
          <p className="text-light-charcoal dark:text-gray-400">
            Handpicked by our team
          </p>
        </div>
        <Link href="/explore">
          <a className="hidden sm:flex items-center gap-1 text-orange hover:text-orange/80 font-medium transition-colors">
            Browse all Apps
            <ArrowRight className="w-4 h-4" />
          </a>
        </Link>
      </div>

      {/* Grid of Spotlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {dapps.map((dapp) => (
          <SpotlightCard key={dapp.url} {...dapp} />
        ))}
      </div>

      {/* Mobile Browse All Button */}
      <div className="mt-6 sm:hidden">
        <Link href="/explore">
          <a className="flex items-center justify-center gap-2 w-full py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 transition-colors">
            Browse all Apps
            <ArrowRight className="w-4 h-4" />
          </a>
        </Link>
      </div>
    </section>
  );
};

export default Spotlight;
