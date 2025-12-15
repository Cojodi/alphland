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

const EcosystemMapPage = ({
  dappsByCategory,
  totalDapps,
  categoryCount,
}: EcosystemMapProps) => {
  // Sort categories alphabetically
  const sortedCategories = Object.keys(dappsByCategory).sort();

  return (
    <Layout
      title="Ecosystem Map"
      description="Explore the complete Alephium ecosystem landscape"
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Hero Section */}
        <section className="text-center py-12 lg:py-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
            Ecosystem Map
          </h1>
          <p className="text-xl text-light-charcoal dark:text-lightgrey max-w-2xl mx-auto mb-8">
            A comprehensive view of the Alephium ecosystem and its components
          </p>
          <div className="flex justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-orange">{totalDapps}</div>
              <div className="text-sm text-light-charcoal dark:text-lightgrey">
                Total dApps
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accessible-green">
                {categoryCount}
              </div>
              <div className="text-sm text-light-charcoal dark:text-lightgrey">
                Categories
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCategories.map((category) => (
            <div
              key={category}
              className="bg-white dark:bg-hero-dark rounded-lg p-6 shadow-lg border border-border-grey dark:border-tooltip-dark"
            >
              {/* Category Header */}
              <div className="mb-4 pb-3 border-b border-border-grey dark:border-tooltip-dark">
                <h3 className="text-lg font-semibold dark:text-white">
                  {category}
                </h3>
                <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                  {dappsByCategory[category].length}{" "}
                  {dappsByCategory[category].length === 1 ? "dApp" : "dApps"}
                </p>
              </div>

              {/* Dapp Grid */}
              <div className="grid grid-cols-3 gap-3">
                {dappsByCategory[category].map((dapp) => (
                  <Link key={dapp.url} href={`/${dapp.url}`}>
                    <a
                      className="group aspect-square relative rounded-lg overflow-hidden bg-smoked-white dark:bg-light-black hover:shadow-lg transition-all duration-200 border border-transparent hover:border-orange flex items-center justify-center p-2"
                      title={dapp.name}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={dapp.logo}
                          alt={dapp.name}
                          layout="fill"
                          objectFit="contain"
                          className="transition-transform duration-200 group-hover:scale-110"
                        />
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          ))}
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
