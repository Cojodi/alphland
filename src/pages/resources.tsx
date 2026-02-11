import Layout from "../components/Layout";
import ResourceCard from "../components/ResourceCard/ResourceCard";
import resourcesData from "../data/resources.json";
import { getAllDapps } from "../data/getAllDapps";
import { GetStaticProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Resource {
  title: string;
  link: string;
  format: string;
  topic: string;
  language: string;
}

interface DappResource {
  slug: string;
  name: string;
  logoUrl: string;
  resources: Resource[];
}

interface ResourcesPageProps {
  dappResources: DappResource[];
  generalResources: Resource[];
}

const TOPICS = [
  "All",
  "DeFi",
  "Infra / Tools",
  "Nodes / Mining",
  "NFT",
  "Other",
];
const FORMATS = ["All", "Video", "Article", "Tweet", "Technical documentation"];

const ResourcesPage = ({
  dappResources,
  generalResources,
}: ResourcesPageProps) => {
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedFormat, setSelectedFormat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filterResources = (resources: Resource[]) => {
    return resources.filter((r) => {
      const matchesTopic = selectedTopic === "All" || r.topic === selectedTopic;
      const matchesFormat =
        selectedFormat === "All" || r.format === selectedFormat;
      const matchesSearch =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTopic && matchesFormat && matchesSearch;
    });
  };

  const filteredDappResources = dappResources
    .map((dr) => ({
      ...dr,
      resources: filterResources(dr.resources),
    }))
    .filter((dr) => dr.resources.length > 0);

  const filteredGeneralResources = filterResources(generalResources);

  const totalResources =
    filteredDappResources.reduce((sum, dr) => sum + dr.resources.length, 0) +
    filteredGeneralResources.length;

  return (
    <Layout
      title="Resources"
      description="Tutorials, guides and resources for the Alephium ecosystem"
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Hero Section */}
        <section className="text-center py-12 lg:py-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
            Ecosystem Resources
          </h1>
          <p className="text-xl text-light-charcoal dark:text-lightgrey max-w-2xl mx-auto">
            Tutorials, guides and documentation from the Alephium ecosystem
          </p>
        </section>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-border-grey dark:border-white/10 bg-white dark:bg-white/5 dark:text-white focus:outline-none focus:border-orange"
          />

          {/* Topic Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-light-charcoal dark:text-lightgrey mr-2 self-center">
              Topic:
            </span>
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTopic === topic
                    ? "bg-orange text-white"
                    : "bg-gray-100 dark:bg-white/10 text-light-charcoal dark:text-lightgrey hover:bg-gray-200 dark:hover:bg-white/20"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Format Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-light-charcoal dark:text-lightgrey mr-2 self-center">
              Format:
            </span>
            {FORMATS.map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFormat === format
                    ? "bg-orange text-white"
                    : "bg-gray-100 dark:bg-white/10 text-light-charcoal dark:text-lightgrey hover:bg-gray-200 dark:hover:bg-white/20"
                }`}
              >
                {format}
              </button>
            ))}
          </div>

          <p className="text-sm text-light-charcoal dark:text-lightgrey">
            {totalResources} resource{totalResources !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* General Resources */}
        {filteredGeneralResources.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">
              General Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGeneralResources.map((resource, i) => (
                <ResourceCard key={i} resource={resource} />
              ))}
            </div>
          </section>
        )}

        {/* dApp Resources */}
        {filteredDappResources.map((dapp) => (
          <section key={dapp.slug} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Link href={`/${dapp.slug}`}>
                <a className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 relative rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={dapp.logoUrl}
                      alt={dapp.name}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <h2 className="text-2xl font-bold dark:text-white">
                    {dapp.name}
                  </h2>
                </a>
              </Link>
              <span className="text-sm text-light-charcoal dark:text-lightgrey">
                ({dapp.resources.length} resource
                {dapp.resources.length !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dapp.resources.map((resource, i) => (
                <ResourceCard key={i} resource={resource} />
              ))}
            </div>
          </section>
        ))}

        {totalResources === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-light-charcoal dark:text-lightgrey">
              No resources match your filters.
            </p>
            <button
              onClick={() => {
                setSelectedTopic("All");
                setSelectedFormat("All");
                setSearchQuery("");
              }}
              className="mt-4 text-orange hover:opacity-80"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async () => {
  const allDapps = await getAllDapps();
  const resources = resourcesData as Record<string, Resource[]>;

  const dappResources: DappResource[] = [];

  for (const [slug, res] of Object.entries(resources)) {
    if (slug === "_general") continue;
    const dapp = allDapps.find((d) => d.url === slug);
    if (dapp) {
      dappResources.push({
        slug,
        name: dapp.name,
        logoUrl: dapp.media.logoUrl,
        resources: res,
      });
    }
  }

  // Sort by number of resources (most first)
  dappResources.sort((a, b) => b.resources.length - a.resources.length);

  return {
    props: {
      dappResources,
      generalResources: resources["_general"] || [],
    },
    revalidate: 60,
  };
};

export default ResourcesPage;
