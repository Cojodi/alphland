import home from "../../../assets/icons/home.svg";
import homeDark from "../../../assets/icons/home_dark.svg";
import moon from "../../../assets/icons/moon.svg";
import sun from "../../../assets/icons/sun.svg";
import logoLight from "../../../assets/logo-alphland-light.svg";
import logo from "../../../assets/logo-alphland.svg";
import { useCategoryStore } from "../../../hooks/useCategoryStore";
// import ConnectWallet from "../../Button/ConnectWallet";
import AuthButton from "../../Button/AuthButton";
import Button from "../../Button/Button";
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

type NavbarItem = {
  name: string;
  href: string;
  icon: string;
};

const MobileMenu = ({ currentTheme, setTheme }: MobileMenuProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sponsorDropdownOpen, setSponsorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSponsor, setIsSponsor] = useState(false);
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const nav = useRef<HTMLDivElement>(null);

  const navbarItems: NavbarItem[] = [
    {
      name: "Explore dApps",
      href: "/",
      icon: currentTheme === "dark" ? homeDark : home,
    },
    {
      name: "Bounties",
      href: "/bounty",
      icon: currentTheme === "dark" ? homeDark : home,
    },
    {
      name: "Resources",
      href: "/resources",
      icon: currentTheme === "dark" ? homeDark : home,
    },
    // {
    //   name: "Forum",
    //   href: "/forum",
    //   icon: currentTheme === "dark" ? homeDark : home,
    // },
    // {
    //   name: "Agenda",
    //   href: "/agenda",
    //   icon: currentTheme === "dark" ? homeDark : home,
    // },
    {
      name: "Ecosystem Map",
      href: "/ecosystem-map",
      icon: currentTheme === "dark" ? homeDark : home,
    },
    {
      name: "Token Explorer",
      href: "/eco-token-price-chart",
      icon: currentTheme === "dark" ? homeDark : home,
    },
  ];

  // Check if current page is bounty, sponsor, or user profile related
  const isBountyPage =
    router.pathname.startsWith("/bounty") ||
    router.pathname.startsWith("/auth");

  // Check if user is a sponsor
  useEffect(() => {
    async function checkSponsorStatus() {
      if (!session?.user?.id) {
        setIsSponsor(false);
        setSponsorId(null);
        return;
      }

      try {
        const response = await fetch(`/api/sponsors/user/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsSponsor(!!data.sponsor);
          setSponsorId(data.sponsor?.id || null);
        } else {
          setIsSponsor(false);
          setSponsorId(null);
        }
      } catch (error) {
        console.error("Error checking sponsor status:", error);
        setIsSponsor(false);
        setSponsorId(null);
      }
    }

    checkSponsorStatus();
  }, [session?.user?.id]);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to check if a path is active
  const isActivePath = (path: string) => {
    if (path === "/") {
      return router.pathname === "/" || router.pathname.startsWith("/category");
    }
    return router.pathname.startsWith(path);
  };

  return (
    <MenuContainer
      className={[
        "lg:hidden z-[999] fixed top-0 left-0 w-full bg-white dark:bg-hero-dark shadow-[0_0_20px_0_rgba(0,0,0,0.3)]",
        isNavbarScrolled ? "navbar-scrolled" : "",
        isMobileMenuOpen ? "is-active-menu" : "",
      ].join(" ")}
      ref={nav}
    >
      <div className="flex justify-between items-center py-2 px-4 relative z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <span
              className="flex items-center cursor-pointer"
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
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
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
                        <span
                          className="flex items-center gap-2 px-3 py-2 text-xs text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors cursor-pointer"
                          onClick={() => setSponsorDropdownOpen(false)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-light-charcoal" />
                          Dashboard
                        </span>
                      </Link>
                      {sponsorId && (
                        <Link href={`/bounty/sponsor/${sponsorId}`}>
                          <span
                            className="flex items-center gap-2 px-3 py-2 text-xs text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors cursor-pointer"
                            onClick={() => setSponsorDropdownOpen(false)}
                          >
                            <User className="w-3.5 h-3.5 text-light-charcoal" />
                            Sponsor Profile
                          </span>
                        </Link>
                      )}
                      <Link href="/bounty/sponsor/edit">
                        <span
                          className="flex items-center gap-2 px-3 py-2 text-xs text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors cursor-pointer"
                          onClick={() => setSponsorDropdownOpen(false)}
                        >
                          <Edit className="w-3.5 h-3.5 text-light-charcoal" />
                          Edit Profile
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={getSponsorLink()}
                  className="px-2.5 py-1.5 text-xs font-medium text-orange border border-orange rounded-md hover:bg-orange/10 transition-colors whitespace-nowrap"
                >
                  Sponsor
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
          <div className="hamburger-wrapper">
            <button
              className={[
                "hamburger",
                isMobileMenuOpen ? "is-active" : "",
                mounted && currentTheme === "dark" ? "is-dark" : "",
              ].join(" ")}
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="hamburger-box">
                <span className="hamburger-inner"></span>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div
        className={[
          "absolute top-0 left-0 w-full h-screen hidden pt-[56px] bg-white dark:bg-light-black",
          isMobileMenuOpen ? "is-active-menu" : "",
        ].join(" ")}
      >
        <ul className="list-none mb-3">
          {navbarItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href}>
                <a
                  className={`flex items-center py-3 px-6 bg-white dark:bg-light-black uppercase font-medium font-base ${
                    isActivePath(item.href)
                      ? "text-orange dark:text-orange font-bold"
                      : "text-black dark:text-white"
                  }`}
                  onClick={() => {
                    if (item.href === "/") {
                      setFilters([]);
                      setSort(null);
                      setRatings([]);
                      changeCategory("all");
                    }
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Image src={item.icon} alt={item.name} />
                  <p>{item.name}</p>
                </a>
              </Link>
            </li>
          ))}
          <li className="py-3 px-6 bg-white dark:bg-light-black">
            <button
              type="button"
              onClick={() =>
                setTheme(currentTheme === "dark" ? "light" : "dark")
              }
              className="flex items-center uppercase font-medium font-base"
            >
              <Image
                src={currentTheme === "dark" ? sun : moon}
                alt="dark mode icon"
              />
              <p>Dark mode</p>
            </button>
          </li>
        </ul>
        <div className="mx-7">
          {isBountyPage ? (
            <AuthButton />
          ) : (
            <Button
              variant="primary"
              className="w-full"
              withoutMobile
              href="/submit"
            >
              Add your Dapp
            </Button>
          )}
        </div>
      </div>
    </MenuContainer>
  );
};

export default MobileMenu;
