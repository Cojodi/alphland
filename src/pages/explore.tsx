import Card from "../components/Card/Card";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar/SearchBar";
import Select from "../components/Select/Select";
import { categories } from "../data/categories";
import { getAllDapps } from "../data/getAllDapps";
import { filterDappcardsByRating, getRatings } from "../helpers/rating";
import sortByAttribute from "../helpers/sort";
import { useCategoryStore } from "../hooks/useCategoryStore";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Explore = ({ dappCards }: { dappCards: DappCard[] }) => {
  const [ratings, setRatings] = useState<{ [key: string]: string[] }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const selectedCategories = useCategoryStore(
    (state) => state.selectedCategories,
  );
  const setCategories = useCategoryStore((state) => state.setCategories);
  const selectedSort = useCategoryStore((state) => state.selectedSort);
  const setSelectedSort = useCategoryStore((state) => state.setSelectedSort);
  const selectedRatings = useCategoryStore((state) => state.selectedRatings);

  // Initialize from URL query
  useEffect(() => {
    if (router.isReady) {
      if (router.query.search) {
        setSearchQuery(router.query.search as string);
      }
      if (router.query.categories) {
        const cats = (router.query.categories as string).split(",");
        setCategories(cats.filter((c) => c.length > 0));
      }
    }
  }, [router.isReady, router.query.search, router.query.categories]);

  useEffect(() => {
    const getAllRatings = async () => {
      const ratings = await getRatings();
      setRatings(ratings);
    };
    getAllRatings();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    if (!router.isReady) return;

    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    if (selectedSort) {
      params.set("sort", selectedSort);
    }

    const url = params.toString()
      ? `/explore?${params.toString()}`
      : "/explore";
    router.replace(url, undefined, { scroll: false });
  }, [searchQuery, selectedCategories, selectedSort, router.isReady]);

  const filteredDapps = dappCards.filter((dapp) => {
    // Filter by search query - match against title first, then description/tags
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      dapp.title.toLowerCase().includes(query) ||
      dapp.short_description?.toLowerCase().includes(query) ||
      dapp.tags?.some((tag) => tag.toLowerCase().includes(query));

    // Filter by selected categories (OR logic)
    const matchesCategories =
      selectedCategories.length === 0 ||
      selectedCategories.some((cat) => {
        const categoryName = categories.find((c) => c.key === cat)?.name;
        return categoryName && dapp.tags?.includes(categoryName);
      });

    return matchesSearch && matchesCategories;
  });

  // Sort filtered results: prioritize title matches (startsWith > includes > description/tag only)
  const rankedDapps = searchQuery
    ? [...filteredDapps].sort((a, b) => {
        const query = searchQuery.toLowerCase();
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aStartsWith = aTitle.startsWith(query) ? 0 : 1;
        const bStartsWith = bTitle.startsWith(query) ? 0 : 1;
        if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
        const aTitleMatch = aTitle.includes(query) ? 0 : 1;
        const bTitleMatch = bTitle.includes(query) ? 0 : 1;
        return aTitleMatch - bTitleMatch;
      })
    : filteredDapps;

  const dappsByRating = filterDappcardsByRating({
    dappCards: rankedDapps,
    dappRatings: ratings,
    isMainCategory: false,
    selectedRatings,
  });
  const sortedDapps = sortByAttribute(dappsByRating, selectedSort);

  // Get active category name for display
  const activeCategoryName =
    selectedCategories.length === 1
      ? categories.find((c) => c.key === selectedCategories[0])?.name
      : null;

  return (
    <Layout>
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Header */}
        <div className="mt-8 lg:mt-12 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">
            {activeCategoryName
              ? `${activeCategoryName} dApps`
              : "Explore All dApps"}
          </h1>
          <p className="text-light-charcoal dark:text-gray-400 mb-6">
            {activeCategoryName
              ? `Browse ${activeCategoryName.toLowerCase()} apps and tools on Alephium`
              : "Browse the complete Alephium ecosystem catalog"}
          </p>

          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search dApps..."
              />
            </div>
            <div className="w-[164px]">
              <Select
                defaultValue={selectedSort}
                placeholder="Sort By"
                options={[
                  { label: "A-Z", value: "A-Z" },
                  { label: "Z-A", value: "Z-A" },
                  { label: "Newest", value: "Newest" },
                  { label: "Oldest", value: "Oldest" },
                ]}
                onChange={(sortBy) => setSelectedSort(sortBy)}
              />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategories.map((cat) => {
              const category = categories.find((c) => c.key === cat);
              return (
                <button
                  key={cat}
                  onClick={() =>
                    setCategories(selectedCategories.filter((c) => c !== cat))
                  }
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange/10 text-orange rounded-full text-sm font-medium hover:bg-orange/20 transition-colors"
                >
                  {category?.name}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              );
            })}
            <button
              onClick={() => setCategories([])}
              className="px-3 py-1.5 text-light-charcoal dark:text-gray-400 text-sm font-medium hover:text-orange transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="mb-6 text-sm text-light-charcoal dark:text-gray-400">
          {sortedDapps.length} {sortedDapps.length === 1 ? "dApp" : "dApps"}{" "}
          found
        </div>

        {/* dApps Grid */}
        <div className="grid grid-cols-1 w-full gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedDapps.map((card) => (
            <Card key={card.url} {...card} />
          ))}
        </div>

        {sortedDapps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-light-charcoal dark:text-gray-400 text-lg">
              No dApps found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export const getStaticProps = async () => {
  const dapps = await getAllDapps();

  const parsedDapps = dapps.map((dapp: DappInfo & { url: string }) => ({
    short_description: dapp.short_description,
    title: dapp.name,
    tags: dapp.tags,
    url: dapp.url,
    logo: dapp.media.logoUrl,
    image: dapp.media.previewUrl,
    featured: dapp.dotw,
    annonymous: dapp.teamInfo.anonymous,
    audits: dapp.audits,
    verified: dapp.verified,
    councils_choice: dapp.councils_choice,
    founded: dapp.teamInfo.founded,
    links: dapp.links,
  }));

  return {
    props: {
      dappCards: parsedDapps,
    },
  };
};

export default Explore;
