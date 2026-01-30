import FilterButton from "../components/Button/FilterButton";
import Card from "../components/Card/Card";
import Categories from "../components/Categories/Categories";
import FilterMenu from "../components/FilterMenu/FilterMenu";
import Layout from "../components/Layout";
import Select from "../components/Select/Select";
import { categories } from "../data/categories";
import { getAllDapps } from "../data/getAllDapps";
import { filterDappcardsByRating, getRatings } from "../helpers/rating";
import sortByAttribute from "../helpers/sort";
import { useCategoryStore } from "../hooks/useCategoryStore";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";

const StyledSection = styled.section`
  grid-template-areas:
    "list cards"
    "list cards";
  grid-template-columns: minmax(300px, 340px) 1fr;
  grid-column-gap: 64px;

  .categories {
    grid-area: list;
  }
`;

const Explore = ({ dappCards }: { dappCards: DappCard[] }) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [ratings, setRatings] = useState<{ [key: string]: string[] }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const selectedFilters = useCategoryStore((state) => state.selectedFilters);
  const selectedRatings = useCategoryStore((state) => state.selectedRatings);
  const selectedCategories = useCategoryStore(
    (state) => state.selectedCategories,
  );
  const selectedSort = useCategoryStore((state) => state.selectedSort);
  const selectedCategory = useCategoryStore((state) => state.selectedCategory);
  const setSelectedSort = useCategoryStore((state) => state.setSelectedSort);

  // Initialize search from URL query
  useEffect(() => {
    if (router.isReady && router.query.search) {
      setSearchQuery(router.query.search as string);
    }
  }, [router.isReady, router.query.search]);

  useEffect(() => {
    const getAllRatings = async () => {
      const ratings = await getRatings();
      setRatings(ratings);
    };
    getAllRatings();
  }, []);

  useEffect(() => {
    const allFilters = selectedFilters.join(",");
    const allRatings = selectedRatings.join(",");
    const allCategories = selectedCategories.join(",");
    const sortBy = selectedSort;
    let url = "/explore";
    const params = [];
    if (searchQuery) {
      params.push(`search=${encodeURIComponent(searchQuery)}`);
    }
    if (allFilters.length) {
      params.push(`filters=${allFilters}`);
    }
    if (sortBy && sortBy.length) {
      params.push(`sort=${sortBy}`);
    }
    if (selectedRatings.length) {
      params.push(`ratings=${allRatings}`);
    }
    if (selectedCategories.length) {
      params.push(`categories=${allCategories}`);
    }
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }
    if (router.isReady && selectedCategory === "all") {
      router.push(url, undefined, { scroll: false });
    }
  }, [
    selectedFilters,
    selectedSort,
    selectedCategory,
    selectedRatings,
    selectedCategories,
    searchQuery,
  ]);

  const filteredDapps = dappCards.filter((dapp) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      dapp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dapp.short_description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      dapp.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    // Filter by selected categories (OR logic)
    const matchesCategories =
      selectedCategories.length === 0 ||
      selectedCategories.some((cat) => {
        const categoryName = categories.find((c) => c.key === cat)?.name;
        return categoryName && dapp.tags?.includes(categoryName);
      });

    // Filter by selected filters (AND logic)
    const matchesFilters =
      selectedFilters.reduce((acc, val) => {
        if (val === "dotw" && dapp.featured) {
          acc = acc + 1;
        }
        if (val === "doxxed" && !dapp.annonymous) {
          acc = acc + 1;
        }
        if (val === "audited" && dapp.audits && dapp.audits.length > 0) {
          acc = acc + 1;
        }
        if (val === "verified" && dapp.verified) {
          acc = acc + 1;
        }
        if (val === "councils_choice" && dapp.councils_choice) {
          acc = acc + 1;
        }
        return acc;
      }, 0) === selectedFilters.length;

    return matchesSearch && matchesCategories && matchesFilters;
  });

  const dappsByRating = filterDappcardsByRating({
    dappCards: filteredDapps,
    dappRatings: ratings,
    isMainCategory: false,
    selectedRatings,
  });
  const sortedDapps = sortByAttribute(dappsByRating, selectedSort);
  const filterCount = selectedFilters.length + selectedRatings.length;

  return (
    <Layout>
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        <div className="mt-8 lg:mt-12 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">
            Explore All dApps
          </h1>
          <p className="text-light-charcoal dark:text-gray-400">
            Browse the complete Alephium ecosystem catalog
          </p>
        </div>

        <StyledSection className="lg:grid">
          <Categories
            className="categories lg:max-w-[340px]"
            dappCards={dappCards}
            dappRatings={ratings}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <div className="cards">
            <h3 className="lg:hidden font-semibold text-xl leading-none mb-5">
              All projects
            </h3>
            <div className="lg:block flex w-full mb-6">
              <FilterButton
                onClick={() => setShowMobileFilters(true)}
                filterCount={filterCount}
              />
              <div className="w-[164px] float-left lg:float-right">
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
            {showMobileFilters && (
              <FilterMenu
                dappRatings={ratings}
                dappCards={dappCards}
                isMobileMenuOpen={showMobileFilters}
                setIsMobileMenuOpen={setShowMobileFilters}
              />
            )}
            <div className="grid grid-cols-1 w-full gap-y-8 justify-center md:grid-cols-2 lg:grid-cols-1 lg:mx-0 gap-x-20 lg:gap-y-20 xl:grid-cols-2 2xl:grid-cols-3">
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
        </StyledSection>
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
