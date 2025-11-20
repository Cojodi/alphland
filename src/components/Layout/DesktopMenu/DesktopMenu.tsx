import moon from "../../../assets/icons/moon.svg";
import sun from "../../../assets/icons/sun.svg";
import logoLight from "../../../assets/logo-alphland-light.svg";
import logo from "../../../assets/logo-alphland.svg";
import { useCategoryStore } from "../../../hooks/useCategoryStore";
// import ConnectWallet from "../../Button/ConnectWallet";
import AuthButton from "../../Button/AuthButton";
import Button from "../../Button/Button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

interface DesktopMenuProps {
  currentTheme?: string;
  setTheme: (theme: string) => void;
}

const DesktopMenu = ({ currentTheme, setTheme }: DesktopMenuProps) => {
  const router = useRouter();
  const setFilters = useCategoryStore((state) => state.setFilters);
  const changeCategory = useCategoryStore((state) => state.changeCategory);
  const setSort = useCategoryStore((state) => state.setSelectedSort);
  const setRatings = useCategoryStore((state) => state.setRatings);

  // Check if current page is bounty, sponsor, or user profile related
  const isBountyPage =
    router.pathname.startsWith("/bounty") ||
    router.pathname.startsWith("/auth");

  return (
    <div className="hidden lg:block bg-white dark:bg-light-black">
      <div className="relative w-full flex justify-between items-center px-6 py-4 border-t border-b border-border-grey dark:border-white/10">
        <div className="flex items-center gap-6 z-[2]">
          <Link href="/">
            <a
              className="flex items-center hover:opacity-80 transition-opacity"
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
            </a>
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
            <AuthButton />
          ) : (
            <Button
              variant="primary"
              className="h-min"
              style={{ padding: "13px 24px", lineHeight: "normal" }}
              href="/admin"
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
