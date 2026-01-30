import FAQ from "../components/FAQ/FAQ";
import Hero from "../components/Hero/Hero";
import Layout from "../components/Layout";
import Spotlight from "../components/Spotlight/Spotlight";
import { getAllDapps } from "../data/getAllDapps";
import { useRouter } from "next/router";
import { useState } from "react";

// Featured dApps slugs - handpicked for the spotlight section
const FEATURED_DAPPS = [
  "linx-app",
  "elexium",
  "aura",
  "alephium-bridge",
  "alephium-official-wallets",
  "alphpad",
  "deadrare",
  "dia",
  "alephium-explorer",
  "henrycoder",
  "learnify",
  "myonion",
  "nightshade",
  "onekey-wallet",
  "presenceprotocol",
  "safepal-wallet",
];

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

const Home = ({
  spotlightDapps,
  totalDappCount,
}: {
  spotlightDapps: SpotlightDapp[];
  totalDappCount: number;
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
          />
        </div>

        <Spotlight dapps={spotlightDapps} />

        {/* FAQ Section */}
        <div className="max-w-3xl">
          <FAQ />
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps = async () => {
  const dapps = await getAllDapps();

  // Filter and map featured dApps for spotlight
  const spotlightDapps = FEATURED_DAPPS.map((slug) => {
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
  }).filter(Boolean) as SpotlightDapp[];

  return {
    props: {
      spotlightDapps,
      totalDappCount: dapps.length,
    },
  };
};

export default Home;
