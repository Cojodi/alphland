import Layout from "../components/Layout";
import { getAllDapps } from "../data/getAllDapps";
import Image from "next/image";
import Link from "next/link";

interface DappsByCategory {
  [category: string]: Array<{
    name: string;
    url: string;
    logo: string;
  }>;
}

interface EcosystemMapProps {
  dappsByCategory: DappsByCategory;
  totalDapps: number;
  categoryCount: number;
}

// Define category order and grid sizes
const categoryConfig: { [key: string]: { order: number; cols: number } } = {
  DeFi: { order: 1, cols: 5 },
  Infrastructure: { order: 2, cols: 5 },
  Wallets: { order: 3, cols: 5 },
  NFT: { order: 4, cols: 5 },
  Gaming: { order: 5, cols: 5 },
  DEX: { order: 6, cols: 4 },
  Bridges: { order: 7, cols: 4 },
  Tools: { order: 8, cols: 4 },
  Analytics: { order: 9, cols: 4 },
  Staking: { order: 10, cols: 4 },
  Lending: { order: 11, cols: 4 },
  DAO: { order: 12, cols: 4 },
  Social: { order: 13, cols: 4 },
  Marketplace: { order: 14, cols: 4 },
  Onramps: { order: 15, cols: 4 },
};

const EcosystemMapPage = ({
  dappsByCategory,
  totalDapps,
  categoryCount,
}: EcosystemMapProps) => {
  // Sort categories by config order, then alphabetically
  const sortedCategories = Object.keys(dappsByCategory).sort((a, b) => {
    const orderA = categoryConfig[a]?.order ?? 100;
    const orderB = categoryConfig[b]?.order ?? 100;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });

  // Group categories into rows for better layout
  const getGridCols = (category: string) => {
    return categoryConfig[category]?.cols ?? 4;
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout
      title="Ecosystem Map"
      description="Explore the complete Alephium ecosystem landscape"
    >
      {/* Full width background */}
      <div className="min-h-screen bg-[#f5f3ef] dark:bg-[#1a1a1a]">
        <div className="container px-4 mx-auto pb-16">
          {/* Header */}
          <header className="py-8 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#2a2a2a] dark:text-white tracking-tight">
                  ALEPHIUM{" "}
                  <span className="font-normal text-[#5a5a5a] dark:text-gray-400">
                    ECOSYSTEM MAP
                  </span>
                </h1>
              </div>
              <div className="text-sm text-[#7a7a7a] dark:text-gray-500 italic">
                *Updated {currentDate}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-orange">
                  {totalDapps}
                </span>
                <span className="text-sm text-[#5a5a5a] dark:text-gray-400">
                  dApps
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accessible-green">
                  {categoryCount}
                </span>
                <span className="text-sm text-[#5a5a5a] dark:text-gray-400">
                  Categories
                </span>
              </div>
            </div>
          </header>

          {/* Ecosystem Grid - Masonry-like layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedCategories.map((category) => {
              const dapps = dappsByCategory[category];
              const gridCols = getGridCols(category);

              return (
                <div
                  key={category}
                  className={`bg-white dark:bg-[#252525] rounded-xl p-5 shadow-sm border border-[#e5e3df] dark:border-[#333] ${
                    dapps.length > 12 ? "md:col-span-2" : ""
                  }`}
                >
                  {/* Category Label */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1.5 bg-[#6b6b6b] dark:bg-[#444] text-white text-xs font-semibold uppercase tracking-wider rounded">
                      {category}
                    </span>
                  </div>

                  {/* Dapp Grid */}
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(gridCols, Math.ceil(dapps.length / Math.ceil(dapps.length / gridCols)))}, minmax(0, 1fr))`,
                    }}
                  >
                    {dapps.map((dapp) => (
                      <Link key={dapp.url} href={`/${dapp.url}`}>
                        <a
                          className="group flex flex-col items-center text-center p-2 rounded-lg hover:bg-[#f5f3ef] dark:hover:bg-[#333] transition-all duration-200"
                          title={dapp.name}
                        >
                          {/* Logo Circle */}
                          <div className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden bg-[#f5f3ef] dark:bg-[#333] border-2 border-[#e5e3df] dark:border-[#444] group-hover:border-orange transition-colors duration-200 flex items-center justify-center">
                            <Image
                              src={dapp.logo}
                              alt={dapp.name}
                              width={40}
                              height={40}
                              objectFit="contain"
                              className="rounded-full"
                            />
                          </div>
                          {/* Name */}
                          <span className="mt-1.5 text-[10px] lg:text-xs text-[#5a5a5a] dark:text-gray-400 font-medium leading-tight max-w-[70px] truncate group-hover:text-orange transition-colors duration-200">
                            {dapp.name}
                          </span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-[#e5e3df] dark:border-[#333]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <a
                  href="https://twitter.com/alaboratoio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5a5a5a] hover:text-orange transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://discord.gg/alephium"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5a5a5a] hover:text-orange transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                  </svg>
                </a>
                <a
                  href="https://t.me/alephiumgroup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5a5a5a] hover:text-orange transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#7a7a7a] dark:text-gray-500">
                  Powered by
                </span>
                <Link href="/">
                  <a className="flex items-center gap-1 text-orange font-semibold hover:opacity-80 transition-opacity">
                    <div className="w-5 h-5 bg-orange rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">A</span>
                    </div>
                    ALPH.LAND
                  </a>
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps = async () => {
  const dapps = await getAllDapps();

  // Group dapps by their first tag
  const dappsByCategory: DappsByCategory = {};

  dapps.forEach((dapp) => {
    // Get the first tag or use "Uncategorized" if no tags
    const category =
      dapp.tags && dapp.tags.length > 0 ? dapp.tags[0] : "Uncategorized";

    if (!dappsByCategory[category]) {
      dappsByCategory[category] = [];
    }

    dappsByCategory[category].push({
      name: dapp.name,
      url: dapp.url,
      logo: dapp.media?.logoUrl || "/default-logo.png",
    });
  });

  // Sort dapps within each category alphabetically
  Object.keys(dappsByCategory).forEach((category) => {
    dappsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
  });

  return {
    props: {
      dappsByCategory,
      totalDapps: dapps.length,
      categoryCount: Object.keys(dappsByCategory).length,
    },
  };
};

export default EcosystemMapPage;
