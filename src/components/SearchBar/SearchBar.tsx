import searchIcon from "../../assets/icons/search.svg";
import searchIconLight from "../../assets/icons/searchLight.svg";
import { useDarkMode } from "../../hooks/useDarkMode";
import Image from "next/image";
import React from "react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search dApps...",
  className = "",
}: SearchBarProps) => {
  const { currentTheme } = useDarkMode();

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none">
          <Image
            src={currentTheme === "dark" ? searchIconLight : searchIcon}
            alt="search icon"
            width={18}
            height={18}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/10 shadow-box-image-shadow rounded-lg text-sm font-semibold text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange transition-all"
        />
      </div>
    </div>
  );
};

export default SearchBar;
