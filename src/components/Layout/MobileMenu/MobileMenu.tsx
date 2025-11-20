import moon from "../../../assets/icons/moon.svg";
import sun from "../../../assets/icons/sun.svg";
import logoLight from "../../../assets/logo-alphland-light.svg";
import logo from "../../../assets/logo-alphland.svg";
import { useCategoryStore } from "../../../hooks/useCategoryStore";
// import ConnectWallet from "../../Button/ConnectWallet";
import AuthButton from "../../Button/AuthButton";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const MenuContainer = styled.div`
  box-shadow: none;
  transition: all 0.2s ease;

  &.navbar-scrolled:not(.is-active-menu) {
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1);
  }

  ul li {
    border-top: 1px solid rgba(150, 150, 150, 0.2);

    p {
      margin-left: 16px;
    }
  }

  svg {
    max-width: 140px;
  }

  .is-active-menu {
    display: block;
  }
`;

interface MobileMenuProps {
  currentTheme?: string;
  setTheme: (theme: string) => void;
}

const MobileMenu = ({ currentTheme, setTheme }: MobileMenuProps) => {
  const router = useRouter();
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);

  const nav = useRef<HTMLDivElement>(null);

  // Check if current page is bounty, sponsor, or user profile related
  const isBountyPage =
    router.pathname.startsWith("/bounty") ||
    router.pathname.startsWith("/auth");

  const handleScroll = () => {
    const position = window.pageYOffset;
    if (nav.current) {
      if (position > 15) {
        setIsNavbarScrolled(true);
      } else {
        setIsNavbarScrolled(false);
      }
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const setFilters = useCategoryStore((state) => state.setFilters);
  const changeCategory = useCategoryStore((state) => state.changeCategory);
  const setSort = useCategoryStore((state) => state.setSelectedSort);
  const setRatings = useCategoryStore((state) => state.setRatings);

  return (
    <MenuContainer
      className={[
        "lg:hidden z-[999] fixed top-0 left-0 w-full",
        isNavbarScrolled ? "navbar-scrolled" : "",
      ].join(" ")}
      ref={nav}
    >
      <div className="flex justify-between items-center py-2 px-4 relative z-50 bg-smoked-white dark:bg-light-black">
        <Link href="/">
          <a
            className="flex items-center"
            onClick={() => {
              setFilters([]);
              setSort(null);
              setRatings([]);
              changeCategory("all");
            }}
          >
            <Image
              src={currentTheme === "dark" ? logoLight : logo}
              alt="logo"
              width={133}
              height={40}
              style={{ height: "auto !important" }}
            />
          </a>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 flex justify-center items-center"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          >
            {currentTheme === "dark" ? (
              <Image src={sun} alt="sun icon" />
            ) : (
              <Image src={moon} alt="moon icon" />
            )}
          </button>
          {/* <ConnectWallet /> */}
          {isBountyPage && (
            <div className="scale-75">
              <AuthButton />
            </div>
          )}
        </div>
      </div>
    </MenuContainer>
  );
};

export default MobileMenu;
