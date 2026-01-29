import crossCircle from "../../assets/icons/crossCircle.svg";
import crossCircleLight from "../../assets/icons/crossCircleLight.svg";
import star from "../../assets/icons/starFilled.svg";
import { categories, reputation, ratings } from "../../data/categories";
import { checkIfCategoryExists, generateUrl } from "../../helpers/category";
import { filterDappcardsByRating } from "../../helpers/rating";
import { useCategoryStore } from "../../hooks/useCategoryStore";
import { useDarkMode } from "../../hooks/useDarkMode";
import FAQ from "../FAQ/FAQ";
import SearchBar from "../SearchBar/SearchBar";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, ReactNode } from "react";
import styled from "styled-components";

const CategoryContainer = styled.div<{
  className?: string;
  children?: ReactNode;
}>`
  ul.hovered li {
    transition: opacity 0.2s ease-in-out;
    opacity: 0.6;

    &:hover,
    &.active {
      opacity: 1;
    }
  }

  ul li.with-blur:not(.active):not(:hover) {
    opacity: 0.6;
  }
`;

interface CategoriesProps {
  className?: string;
  dappCards: DappCard[];
  isHome?: boolean;
  dappRatings: { [key: string]: string[] };
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const Categories = ({
  className,
  dappCards,
  dappRatings,
  searchQuery = "",
  onSearchChange,
}: CategoriesProps) => {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const { currentTheme } = useDarkMode();

  const selectedCategory = useCategoryStore((state) => state.selectedCategory);
  const changeCategory = useCategoryStore((state) => state.changeCategory);
  const selectedCategories = useCategoryStore(
    (state) => state.selectedCategories,
  );
  const addCategory = useCategoryStore((state) => state.addCategory);
  const setCategories = useCategoryStore((state) => state.setCategories);
  const selectedSort = useCategoryStore((state) => state.selectedSort);
  const selectedFilters = useCategoryStore((state) => state.selectedFilters);
  const addFilter = useCategoryStore((state) => state.addFilter);
  const setFilters = useCategoryStore((state) => state.setFilters);
  const selectedRatings = useCategoryStore((state) => state.selectedRatings);
  const addRating = useCategoryStore((state) => state.addRating);
  const setRatings = useCategoryStore((state) => state.setRatings);
  const setSelectedSort = useCategoryStore((state) => state.setSelectedSort);

  useEffect(() => {
    if (router.isReady) {
      const filters = (router?.query?.filters as string)?.split(",") || [];
      const sortBy = router?.query?.sort as string;
      const category = (router?.query?.category as string) || "all";
      const ratings = (router?.query?.ratings as string)?.split(",") || [];
      const cats = (router?.query?.categories as string)?.split(",") || [];
      setFilters(filters);
      setRatings(ratings);
      setCategories(cats.filter((c) => c.length > 0));
      setSelectedSort(sortBy && sortBy.length ? sortBy : null);
      changeCategory(category);
    }
  }, [
    router.isReady,
    router?.query?.filters,
    router?.query?.sort,
    router?.query?.category,
    router?.query?.ratings,
    router?.query?.categories,
  ]);
  const renderCategoryCount = (
    category: string,
    isMainCategory?: boolean,
    isRatingCategory?: boolean,
  ) => {
    const dappCardsFilteredByRating = !isRatingCategory
      ? filterDappcardsByRating({
          dappCards,
          dappRatings,
          selectedRatings,
          isMainCategory,
        })
      : dappCards;
    const selectedCategoryName =
      selectedCategory !== "all"
        ? categories.find((cat) => cat.key === selectedCategory)?.name
        : null;
    const allFilters =
      selectedCategoryName && !isMainCategory
        ? [selectedCategoryName, category, ...selectedFilters]
        : [category, ...selectedFilters];
    return dappCardsFilteredByRating.reduce((prevValue, currentValue) => {
      const filtersCount = allFilters.reduce((prevFiltersCount, nextFilter) => {
        const filterMatched = checkIfCategoryExists(
          currentValue,
          nextFilter,
          dappRatings,
        );
        return filterMatched ? prevFiltersCount + 1 : prevFiltersCount;
      }, 0);
      return filtersCount === allFilters.length ? prevValue + 1 : prevValue;
    }, 0);
  };

  const checkIfAnyCategoryIsActive = () =>
    [...categories, ...reputation, ...ratings].some(
      (category) => category.key === selectedCategory,
    );

  const checkIfCategoryHasDapps = (
    category: Array<{ key: string; name: string; icon: any }>,
    isMainCategory?: boolean,
    isRatingCategory?: boolean,
  ) => {
    let activeCategories = 0;
    category.forEach((item) => {
      if (
        renderCategoryCount(item.name, isMainCategory, isRatingCategory) > 0 &&
        (isMainCategory ||
          (!selectedFilters.includes(item.key) &&
            !selectedRatings.includes(item.key)))
      ) {
        activeCategories++;
      }
    });
    return Boolean(activeCategories);
  };

  const getFilteredCategories = () => {
    return [...categories, ...reputation, ...ratings]
      .filter(
        (category) =>
          selectedFilters.includes(category.key) ||
          selectedRatings.includes(category.key) ||
          selectedCategories.includes(category.key) ||
          category.key === selectedCategory,
      )
      .map((category) => ({
        ...category,
        isRating: selectedRatings.includes(category.key),
        isCategory: selectedCategories.includes(category.key),
      }));
  };

  const filteredCategories = getFilteredCategories();

  return (
    <CategoryContainer
      className={["mb-4", className ? className : ""].join(" ")}
    >
      {/* Search Bar and Total Count */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-xl leading-none lg:text-[22px] lg:font-bold">
            All Projects
          </h3>
          <div className="text-sm font-semibold text-light-charcoal dark:text-clay">
            {dappCards.length} dApps
          </div>
        </div>
        {onSearchChange && (
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search dApps..."
          />
        )}
      </div>

      {filteredCategories.length > 0 && (
        <>
          <h3 className="hidden lg:block font-semibold text-xl leading-none pt-8 pb-4 lg:text-[22px] lg:font-bold">
            Active filters
          </h3>
          <ul
            className={`hidden lg:block ${hovered ? "hovered" : ""}`}
            onMouseOver={() => !hovered && setHovered(true)}
            onMouseLeave={() => hovered && setHovered(false)}
          >
            {filteredCategories.map((category) => (
              <li
                className={`flex items-center bg-white dark:bg-white/10 shadow-box-image-shadow rounded-lg mr-2 min-w-[108px] cursor-pointer flex-row mb-2 justify-start active
                    } ${checkIfAnyCategoryIsActive() ? "with-blur" : ""}`}
                key={category.name}
                tabIndex={0}
                onClick={() => {
                  if (category.key === selectedCategory) {
                    changeCategory("all");
                    router.push(
                      generateUrl({
                        selectedSort: selectedSort,
                        selectedFilters: selectedFilters,
                        selectedRatings: selectedRatings,
                        selectedCategory: "all",
                      }),
                      undefined,
                      { scroll: false },
                    );
                  } else {
                    if (category.isRating) {
                      addRating(category.key);
                    } else if (category.isCategory) {
                      addCategory(category.key);
                    } else {
                      addFilter(category.key);
                    }
                  }
                }}
              >
                <div className="flex items-center justify-between w-full py-4 px-4">
                  <div className="flex items-center">
                    {category.isRating ? (
                      <div className="flex items-center gap-1.5">
                        {[...Array(parseInt(category.name))].map((_, i) => (
                          <Image
                            src={
                              currentTheme === "dark"
                                ? category.iconDark
                                : category.icon
                            }
                            key={i}
                            alt={category.name}
                          />
                        ))}
                      </div>
                    ) : (
                      <Image
                        src={
                          currentTheme === "dark"
                            ? category.iconDark
                            : category.icon
                        }
                        alt={category.name}
                      />
                    )}
                    <p className="font-semibold leading-none text-sm ml-3 mt-0 text-black dark:text-white">
                      {category.isRating ? "" : category.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-light-charcoal dark:text-clay text-sm font-semibold leading-none">
                      {category.key === selectedCategory
                        ? renderCategoryCount(category.name, true)
                        : category.isRating
                          ? renderCategoryCount(category.name, false, true)
                          : category.isCategory
                            ? renderCategoryCount(category.name, true)
                            : renderCategoryCount(category.name)}
                    </p>
                    <button
                      role="button"
                      className="p-0 m-0 outline-0 bg-none border-none flex"
                      onClick={() => {}}
                    >
                      <Image
                        width={16}
                        height={16}
                        alt="remove-button"
                        src={
                          currentTheme === "dark"
                            ? crossCircleLight
                            : crossCircle
                        }
                      />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {checkIfCategoryHasDapps(categories, true) && (
        <h3 className="font-semibold text-xl leading-none pt-8 pb-4 lg:text-[22px] lg:font-bold">
          Categories
        </h3>
      )}
      <ul
        className={`flex overflow-x-scroll lg:flex-col lg:overflow-auto pb-2 lg:pb-0 ${
          hovered ? "hovered" : ""
        }`}
        onMouseOver={() => !hovered && setHovered(true)}
        onMouseLeave={() => hovered && setHovered(false)}
      >
        {categories
          .filter((category) => !selectedCategories.includes(category.key))
          .map(
            (category) =>
              (renderCategoryCount(category.name, true) > 0 ||
                selectedFilters.length ||
                selectedRatings.length ||
                selectedCategories.length ||
                selectedCategory !== "all") && (
                <li
                  className={`flex flex-col items-center justify-center bg-white dark:bg-white/10 shadow-box-image-shadow rounded-lg mr-2 min-w-[108px] cursor-pointer lg:flex-row lg:mb-2 lg:justify-start ${
                    selectedCategories.includes(category.key) ? "active" : ""
                  } ${checkIfAnyCategoryIsActive() ? "with-blur" : ""}`}
                  key={category.name}
                  tabIndex={0}
                  onClick={() => addCategory(category.key)}
                >
                  <div className="flex items-center justify-center w-full lg:justify-between py-4 px-4">
                    <div className="flex items-center flex-col lg:flex-row">
                      <Image
                        src={
                          currentTheme === "dark"
                            ? category.iconDark
                            : category.icon
                        }
                        alt={category.name}
                      />
                      <p className="mt-2 font-semibold leading-none text-sm lg:ml-3 lg:mt-0 text-black dark:text-white">
                        {category.name}
                      </p>
                    </div>
                    <p className="text-light-charcoal dark:text-clay text-sm font-semibold leading-none ml-auto hidden lg:block">
                      {renderCategoryCount(category.name, true)}
                    </p>
                  </div>
                </li>
              ),
          )}
      </ul>
      {checkIfCategoryHasDapps(reputation) ||
      checkIfCategoryHasDapps(ratings, false, true) ? (
        <h3 className="hidden lg:block font-semibold text-xl leading-none pt-8 pb-4 lg:text-[22px] lg:font-bold">
          Reputation
        </h3>
      ) : null}
      <ul
        className={`hidden lg:block pb-5 ${hovered ? "hovered" : ""}`}
        onMouseOver={() => !hovered && setHovered(true)}
        onMouseLeave={() => hovered && setHovered(false)}
      >
        {reputation
          .filter((rep) => !selectedFilters.includes(rep.key))
          .map(
            (category) =>
              renderCategoryCount(category.name) > 0 && (
                <li
                  className={`flex flex-col items-center justify-center bg-white dark:bg-white/10 shadow-box-image-shadow rounded-lg mr-2 min-w-[108px] cursor-pointer lg:flex-row lg:mb-2 lg:justify-start ${
                    selectedCategory === category.key ? "active" : ""
                  } ${checkIfAnyCategoryIsActive() ? "with-blur" : ""}`}
                  key={category.name}
                  tabIndex={0}
                  onClick={() => {
                    addFilter(category.key);
                  }}
                >
                  <div className="flex items-center justify-between w-full py-4 px-4">
                    <div className="flex items-center">
                      <Image
                        src={
                          currentTheme === "dark"
                            ? category.iconDark
                            : category.icon
                        }
                        alt={category.name}
                      />
                      <p className="mt-2 font-semibold leading-none text-sm lg:ml-3 lg:mt-0 text-black dark:text-white">
                        {category.name}
                      </p>
                    </div>
                    <p className="text-light-charcoal dark:text-clay text-sm font-semibold leading-none ml-auto hidden lg:block">
                      {renderCategoryCount(category.name)}
                    </p>
                  </div>
                </li>
              ),
          )}
        {ratings
          .filter((rating) => !selectedRatings.includes(rating.key))
          .map(
            (category) =>
              renderCategoryCount(category.name, false, true) > 0 && (
                <li
                  className={`flex flex-col items-center justify-center bg-white dark:bg-white/10 shadow-box-image-shadow rounded-lg mr-2 min-w-[108px] cursor-pointer lg:flex-row lg:mb-2 lg:justify-start ${
                    selectedCategory === category.key ? "active" : ""
                  } ${checkIfAnyCategoryIsActive() ? "with-blur" : ""}`}
                  key={category.name}
                  tabIndex={0}
                  onClick={() => {
                    addRating(category.key);
                  }}
                >
                  <div className="flex items-center justify-between w-full py-4 px-4">
                    <div className="flex items-center">
                      <div className="flex items-center gap-1.5">
                        {[...Array(parseInt(category.name))].map((_, i) => (
                          <Image
                            src={star}
                            alt={`${category.name}-star`}
                            key={`${category.name}-${i}-star`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-light-charcoal dark:text-clay text-sm font-semibold leading-none ml-auto hidden lg:block">
                      {renderCategoryCount(category.name, false, true)}
                    </p>
                  </div>
                </li>
              ),
          )}
      </ul>
      <FAQ />
    </CategoryContainer>
  );
};

export default Categories;
