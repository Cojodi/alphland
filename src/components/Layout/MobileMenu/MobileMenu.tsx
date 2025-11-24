import moon from "../../../assets/icons/moon.svg";
import sun from "../../../assets/icons/sun.svg";
import logoLight from "../../../assets/logo-alphland-light.svg";
import logo from "../../../assets/logo-alphland.svg";
import { useCategoryStore } from "../../../hooks/useCategoryStore";
// import ConnectWallet from "../../Button/ConnectWallet";
import AuthButton from "../../Button/AuthButton";
import { NotificationBell } from "@/features/bounty/components/NotificationBell";
import { useSession } from "@/lib/auth-client";
import { ChevronDown, LayoutDashboard, User, Edit } from "lucide-react";
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
  const { data: session } = useSession();
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);
  const [sponsorDropdownOpen, setSponsorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nav = useRef<HTMLDivElement>(null);

  // Check if current page is bounty, sponsor, or user profile related
  const isBountyPage =
    router.pathname.startsWith("/bounty") ||
    router.pathname.startsWith("/auth");

  // Check if user is already a sponsor
  const isSponsor = (session?.user as any)?.is_sponsor || false;
  const sponsorId = (session?.user as any)?.sponsor_id;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSponsorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate sponsor link - if not logged in, go to login with redirect
  const getSponsorLink = () => {
    if (!session?.user) {
      return "/auth/login?redirect=/bounty/sponsor";
    }
    if (isSponsor) {
      return "/bounty/sponsor/dashboard";
    }
    return "/bounty/sponsor";
  };

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
            <>
              {isSponsor ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setSponsorDropdownOpen(!sponsorDropdownOpen)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-orange border border-orange rounded-md hover:bg-orange/10 transition-colors whitespace-nowrap"
                  >
                    Dashboard
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        sponsorDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {sponsorDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-hero-dark rounded-lg border border-border-grey dark:border-dark-charcoal shadow-lg py-1 z-[1000]">
                      <Link href="/bounty/sponsor/dashboard">
                        <a
                          className="flex items-center gap-2 px-3 py-2 text-xs text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
                          onClick={() => setSponsorDropdownOpen(false)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-light-charcoal" />
                          Dashboard
                        </a>
                      </Link>
                      {sponsorId && (
                        <Link href={`/bounty/sponsor/${sponsorId}`}>
                          <a
                            className="flex items-center gap-2 px-3 py-2 text-xs text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
                            onClick={() => setSponsorDropdownOpen(false)}
                          >
                            <User className="w-3.5 h-3.5 text-light-charcoal" />
                            Sponsor Profile
                          </a>
                        </Link>
                      )}
                      <Link href="/bounty/sponsor/edit">
                        <a
                          className="flex items-center gap-2 px-3 py-2 text-xs text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
                          onClick={() => setSponsorDropdownOpen(false)}
                        >
                          <Edit className="w-3.5 h-3.5 text-light-charcoal" />
                          Edit Profile
                        </a>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link href={getSponsorLink()}>
                  <a className="px-2.5 py-1.5 text-xs font-medium text-orange border border-orange rounded-md hover:bg-orange/10 transition-colors whitespace-nowrap">
                    Sponsor
                  </a>
                </Link>
              )}
              {session?.user?.id && (
                <div className="scale-90">
                  <NotificationBell userId={session.user.id} />
                </div>
              )}
              <div className="scale-75">
                <AuthButton />
              </div>
            </>
          )}
        </div>
      </div>
    </MenuContainer>
  );
};

export default MobileMenu;
