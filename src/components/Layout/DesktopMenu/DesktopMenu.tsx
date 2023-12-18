import moon from "../../../assets/icons/moon.svg";
import sun from "../../../assets/icons/sun.svg";
import logoLightLottie from "../../../assets/logo-alphland-light.svg";
import logoDarkLottie from "../../../assets/logo-alphland.svg";
import { useCategoryStore } from "../../../hooks/useCategoryStore";
import { AnnouncementBar } from "../../AnnouncementBar";
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
      <AnnouncementBar>The best Alephium Dapps.</AnnouncementBar>
      <div className="relative w-full flex justify-between items-center pr-6 border-t border-b border-border-grey dark:border-white/10">
        <div className="absolute w-full h-full flex justify-center items-center">
          <Link href="/">
            <div
              onClick={() => {
                setFilters([]);
                setSort(null);
                setRatings([]);
                changeCategory("all");
              }}
            >
              <Image
                src={currentTheme === "dark" ? logoLightLottie : logoDarkLottie}
                width={200}
                alt={"Alphland logo"}
              />
            </div>
          </Link>
        </div>
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
              className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10"
              onClick={() => {
                setFilters([]);
                setSort(null);
                setRatings([]);
                changeCategory("all");
              }}
            >
              HOME
            </a>
          </Link>
        </div>
        <div className="flex gap-3.5 z-[2]">
          <ConnectWallet />
          <Button
            variant="primary"
            className="h-min"
            style={{ padding: "13px 24px", lineHeight: "normal" }}
            href="https://github.com/cojodi/alphland#-add-your-dapp-to-Alphland"
            target="_blank"
            rel="noopener noreferrer"
          >
            Add your Dapp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesktopMenu;
