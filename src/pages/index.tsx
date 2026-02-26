import CategoriesSection from "../components/CategoriesSection/CategoriesSection";
import FAQ from "../components/FAQ/FAQ";
import Hero from "../components/Hero/Hero";
import Layout from "../components/Layout";
import Spotlight from "../components/Spotlight/Spotlight";
import { categories } from "../data/categories";
import { getAllDapps } from "../data/getAllDapps";
import { useRouter } from "next/router";
import { useState } from "react";

// dApps shown in the Hero banner carousel (top of page)
const BANNER_DAPPS = ["powfi", "linx-app"];

// Featured dApps slugs - handpicked for the spotlight section
const FEATURED_DAPPS = [
  // Community dApps
  "alphbanx",
  "alphpad",
  "aura",
  "chain-reaction",
  "deadrare",
  "elexium",
  "learnify",
  // "moonshot-boxes", // coming soon
  "nightshade",
  "presenceprotocol",
  "wemine",
  // Official & Infrastructure
  "alephium-bridge",
  "alephium-explorer",
  "alephium-official-wallets",
  "dia",
  "henrycoder",
  "ledger-wallet",
  "onekey-wallet",
  "safepal-wallet",
  "tangem-wallet",
];

interface DappCard {
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

// Keep SpotlightDapp as an alias for backwards compat with Spotlight component
type SpotlightDapp = DappCard;

interface CategoryCount {
  [key: string]: number;
}

const Home = ({
  bannerDapps,
  spotlightDapps,
  totalDappCount,
  categoryCounts,
}: {
  bannerDapps: DappCard[];
  spotlightDapps: SpotlightDapp[];
  totalDappCount: number;
  categoryCounts: CategoryCount;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Handle search - redirect to explore page with query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      router.push(`/explore?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <Layout isHome>
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        <div className="mt-8 lg:mt-12">
          <Hero
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            dappCount={totalDappCount}
            bannerDapps={bannerDapps}
          />
        </div>

        <Spotlight dapps={spotlightDapps} />

        <CategoriesSection categoryCounts={categoryCounts} />

        {/* FAQ Section */}
        <FAQ />
      </div>
    </Layout>
  );
};

export const getStaticProps = async () => {
  const dapps = await getAllDapps();

  // Build hero banner dApps
  const mapDapp = (slug: string) => {
    const dapp = dapps.find((d) => d.url === slug);
    if (!dapp) return null;
    return {
      title: dapp.name,
      short_description: dapp.short_description,
      logo: dapp.media.logoUrl,
      url: `/${dapp.url}`,
      tags: dapp.tags,
      links: dapp.links,
    };
  };

  const bannerDapps = BANNER_DAPPS.map(mapDapp).filter(Boolean) as DappCard[];

  // Filter and map featured dApps for spotlight
  const spotlightDapps = FEATURED_DAPPS.map(mapDapp).filter(
    Boolean,
  ) as SpotlightDapp[];

  // Calculate category counts
  const categoryCounts: CategoryCount = {};
  categories.forEach((cat) => {
    categoryCounts[cat.key] = dapps.filter((dapp) =>
      dapp.tags.includes(cat.name),
    ).length;
  });

  return {
    props: {
      bannerDapps,
      spotlightDapps,
      totalDappCount: dapps.length,
      categoryCounts,
    },
  };
};

export default Home;
