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
import { useState, useRef, useEffect } from "react";

interface DesktopMenuProps {
  currentTheme?: string;
  setTheme: (theme: string) => void;
}

const DesktopMenu = ({ currentTheme, setTheme }: DesktopMenuProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [sponsorDropdownOpen, setSponsorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const setFilters = useCategoryStore((state) => state.setFilters);
  const changeCategory = useCategoryStore((state) => state.changeCategory);
  const setSort = useCategoryStore((state) => state.setSelectedSort);
  const setRatings = useCategoryStore((state) => state.setRatings);
  const [isSponsor, setIsSponsor] = useState(false);
  const [sponsorId, setSponsorId] = useState<string | null>(null);

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

  return (
    <div className="hidden lg:block bg-white dark:bg-light-black">
      <div className="relative w-full flex justify-between items-center px-6 py-4 border-t border-b border-border-grey dark:border-white/10">
        <div className="flex items-center gap-6 z-[2]">
          <Link href="/">
            <span
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => {
                setFilters([]);
                setSort(null);
                setRatings([]);
                changeCategory("all");
              }}
            >
              <Image
                src={currentTheme === "dark" ? logoLight : logo}
                alt="Alphland logo"
                width={133}
                height={40}
                style={{ height: "auto" }}
              />
            </span>
          </Link>
        </div>
        <div className="flex gap-3.5 z-[2] items-center">
          <button
            type="button"
            className="p-2 flex justify-center items-center hover:bg-smoked-white dark:hover:bg-white/5 transition-colors rounded"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          >
            {currentTheme === "dark" ? (
              <Image src={sun} alt="sun icon" />
            ) : (
              <Image src={moon} alt="moon icon" />
            )}
          </button>
          {/* <ConnectWallet /> */}
          {isBountyPage ? (
            <>
              {isSponsor ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setSponsorDropdownOpen(!sponsorDropdownOpen)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-orange border border-orange rounded-lg hover:bg-orange/10 transition-colors"
                  >
                    Sponsor Dashboard
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        sponsorDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {sponsorDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-hero-dark rounded-lg border border-border-grey dark:border-dark-charcoal shadow-lg py-1 z-50">
                      <Link href="/bounty/sponsor/dashboard">
                        <span
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors cursor-pointer"
                          onClick={() => setSponsorDropdownOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-light-charcoal" />
                          Dashboard
                        </span>
                      </Link>
                      {sponsorId && (
                        <Link href={`/bounty/sponsor/${sponsorId}`}>
                          <span
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors cursor-pointer"
                            onClick={() => setSponsorDropdownOpen(false)}
                          >
                            <User className="w-4 h-4 text-light-charcoal" />
                            Sponsor Profile
                          </span>
                        </Link>
                      )}
                      <Link href="/bounty/sponsor/edit">
                        <span
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors cursor-pointer"
                          onClick={() => setSponsorDropdownOpen(false)}
                        >
                          <Edit className="w-4 h-4 text-light-charcoal" />
                          Edit Sponsor Profile
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={getSponsorLink()}
                  className="px-4 py-2 text-sm font-medium text-orange border border-orange rounded-lg hover:bg-orange/10 transition-colors"
                >
                  Become a Sponsor
                </Link>
              )}
              {session?.user?.id && (
                <NotificationBell userId={session.user.id} />
              )}
              <AuthButton />
            </>
          ) : (
            <Button
              variant="primary"
              className="h-min"
              style={{ padding: "13px 24px", lineHeight: "normal" }}
              href="/submit"
            >
              Add your Dapp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopMenu;
