import alephiumLogoDark from "../../assets/alephium-logos/dark/Logo-Horizontal-Dark.svg";
import alephiumLogoLight from "../../assets/alephium-logos/light/Logo-Horizontal-Light.svg";
import githubLogo from "../../assets/github-icon.svg";
import githubLogoLight from "../../assets/github-light.svg";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface FooterProps {
  currentTheme?: string;
}

const Footer = ({ currentTheme }: FooterProps) => {
  return (
    <section>
      <footer className="w-full py-6 px-4 border-t border-border-grey dark:border-white/10 flex flex-col md:flex-row justify-between">
        <div className="flex flex-row items-center justify-center mb-4 md:mb-0">
          <div>
            <a
              href={"https://github.com/cojodi/alphadapps"}
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
        <p className="text-center font-medium text-base leading-[16px] mb-4 md:mb-0">
          <Link href="/disclosure-statement">
            <a className="inline-block mx-2">Disclosure statement</a>
          </Link>
          <Link href="/terms" className="inline-block my-4 mx-4">
            <a className="inline-block mx-2">Terms of use</a>
          </Link>
          <Link href="/privacy" className="inline-block my-4 mx-4">
            <a className="inline-block mx-2">Privacy policy</a>
          </Link>
        </p>
      </footer>
    </section>
  );
};

export default Footer;
