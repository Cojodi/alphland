import moon from "../../../assets/icons/moon.svg";
import sun from "../../../assets/icons/sun.svg";
import logoLight from "../../../assets/logo-alphland-light.svg";
import logoDark from "../../../assets/logo-alphland.svg";
import { useCategoryStore } from "../../../hooks/useCategoryStore";
// import ConnectWallet from "../../Button/ConnectWallet";
import AuthButton from "../../Button/AuthButton";
import Button from "../../Button/Button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

interface DesktopMenuProps {
  currentTheme?: string;
  setTheme: (theme: string) => void;
}

const HomeDesktopMenu = ({ currentTheme, setTheme }: DesktopMenuProps) => {
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
    <div className="hidden lg:block bg-white dark:bg-hero-dark ">
      <div className="relative w-full flex justify-between items-center pr-6 border-b border-border-grey dark:border-white/10">
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
          <Link href="/bounty">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Bounties
            </a>
          </Link>
          <Link href="/resources">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Resources
            </a>
          </Link>
          {/* <Link href="/forum">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Forum
            </a>
          </Link> */}
          {/* <Link href="/agenda">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Agenda
            </a>
          </Link> */}
          <Link href="/ecosystem-map">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Ecosystem Map
            </a>
          </Link>
          <Link href="/dashboard">
            <a className="p-6 flex justify-center items-center uppercase font-medium font-base border-r border-border-grey dark:border-white/10 hover:bg-smoked-white dark:hover:bg-white/5 transition-colors">
              Dashboard
            </a>
          </Link>
        </div>
        <div className="flex gap-2.5 z-[2]">
          {/* <ConnectWallet /> */}
          {isBountyPage ? (
            <AuthButton />
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
      <div className="relative flex flex-col justify-center items-center pb-[86px]">
        <Link href="/">
          <a className="cursor-pointer">
            <Image
              src={currentTheme === "dark" ? logoLight : logoDark}
              width={525}
              height={150}
              alt="Alphland logo"
            />
          </a>
        </Link>
        <h1 className="bg-black dark:bg-white text-white dark:text-black pl-4 pr-4 pt-1 pb-2 text-center text-[32px] font-bold leading-[38px] rounded-md mb-6">
          Discover the best of Alephium&apos;s ecosystem
        </h1>
        <h2 className="text-black dark:text-white text-[16px] leading-[20px] font-lighter">
          Proudly sponsored by{" "}
          <a href="https://alephium.org/" target={"_blank"} rel="noreferrer">
            Alephium
          </a>{" "}
          and{" "}
          <a
            href="https://twitter.com/Blockflow_DAO"
            target={"_blank"}
            rel="noreferrer"
          >
            Blockflow Alliance DAO
          </a>
        </h2>
      </div>
    </div>
  );
};

export default HomeDesktopMenu;
