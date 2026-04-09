import alephiumLogoDark from "../../assets/alephium-logos/dark/Logo-Horizontal-Dark.svg";
import alephiumLogoLight from "../../assets/alephium-logos/light/Logo-Horizontal-Light.svg";
import githubLogo from "../../assets/github-icon.svg";
import githubLogoLight from "../../assets/github-light.svg";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { toast } from "react-toastify";

interface FooterProps {
  currentTheme?: string;
}

const Footer = ({ currentTheme }: FooterProps) => {
  // const donationWalletAddr = "16uJvxtaSkuKEz3DEzCKHsemE4LWvnqZS1WrSAhoeL9Fr";
  return (
    <section>
      <footer className="w-full py-6 px-4 border-t border-border-grey dark:border-white/10 flex flex-col md:flex-row justify-between">
        <div className="flex flex-row items-center justify-center mb-4 md:mb-0">
          <div>
            <a
              href={"https://github.com/cojodi/Alphland"}
              className="flex justify-center items-center"
            >
              <Image
                src={currentTheme === "dark" ? githubLogoLight : githubLogo}
                width={50}
                alt="GitHub Logo"
              />
            </a>
          </div>
          <p className="font-medium text-base leading-[16px]">Powered by</p>
          <div>
            <a
              className="flex justify-center items-center"
              href={"https://alephium.org"}
            >
              <Image
                src={
                  currentTheme === "dark" ? alephiumLogoLight : alephiumLogoDark
                }
                width={120}
                height={50}
                alt={"alephium logo"}
              />
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 font-medium text-base mb-4 md:mb-0">
          <Link href="/disclosure-statement">
            <a className="px-2">Disclosure statement</a>
          </Link>
          <Link href="/terms">
            <a className="px-2">Terms of use</a>
          </Link>
          <Link href="/privacy">
            <a className="px-2">Privacy policy</a>
          </Link>
          <Link href="/dashboard">
            <a className="px-2">Dashboard</a>
          </Link>
          <Link href="/status">
            <a className="flex items-center gap-1.5 px-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accessible-green opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accessible-green" />
              </span>
              Network Status
            </a>
          </Link>
        </div>
        {/* <button
          onClick={() => {
            navigator.clipboard.writeText(donationWalletAddr).then(() => {
              toast.success(`Copied: ${donationWalletAddr}`);
            });
          }}
        >
          <p className="text-center font-normal  text-xs text-base leading-[16px] ">
            Donations (ALPH): <br /> {donationWalletAddr}
          </p>
        </button> */}
      </footer>
    </section>
  );
};

export default Footer;
