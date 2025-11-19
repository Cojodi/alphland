import moon from "../../../assets/icons/moon.svg";
import sun from "../../../assets/icons/sun.svg";
import { useCategoryStore } from "../../../hooks/useCategoryStore";
import Button from "../../Button/Button";
import ConnectWallet from "../../Button/ConnectWallet";
import Image from "next/image";
import Link from "next/link";

interface DesktopMenuProps {
  currentTheme?: string;
  setTheme: (theme: string) => void;
}

const DesktopMenu = ({ currentTheme, setTheme }: DesktopMenuProps) => {
  const setFilters = useCategoryStore((state) => state.setFilters);
  const changeCategory = useCategoryStore((state) => state.changeCategory);
  const setSort = useCategoryStore((state) => state.setSelectedSort);
  const setRatings = useCategoryStore((state) => state.setRatings);
  return (
    <div className="hidden lg:block bg-white dark:bg-light-black">
      <div className="relative w-full flex justify-between items-center pr-6 border-t border-b border-border-grey dark:border-white/10">
        <div className="flex z-[2]">
          <button
            type="button"
            className="p-6 flex justify-center items-center border-r border-border-grey dark:border-white/10"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          >
            {currentTheme === "dark" ? (
              <Image src={sun} alt="sun icon" />
            ) : (
              <Image src={moon} alt="moon icon" />
            )}
          </button>
          <Link href="/">
            <a
              className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors"
              onClick={() => {
                setFilters([]);
                setSort(null);
                setRatings([]);
                changeCategory("all");
              }}
            >
              Explore dApps
            </a>
          </Link>
          <Link href="/bounties">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Bounties
            </a>
          </Link>
          <Link href="/resources">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Resources
            </a>
          </Link>
          <Link href="/forum">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Forum
            </a>
          </Link>
          <Link href="/agenda">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Agenda
            </a>
          </Link>
          <Link href="/ecosystem-map">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Ecosystem Map
            </a>
          </Link>
        </div>
        <div className="flex gap-3.5 z-[2]">
          <ConnectWallet />
          <Button
            variant="primary"
            className="h-min"
            style={{ padding: "13px 24px", lineHeight: "normal" }}
            href="/admin"
          >
            Add your Dapp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesktopMenu;
