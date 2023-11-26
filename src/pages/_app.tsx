import { AlephiumWalletProvider } from "@alephium/web3-react";
import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import Script from "next/script";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <AlephiumWalletProvider network="mainnet">
        <Script
          strategy="afterInteractive"
          defer
          data-domain="alphad.app"
          data-api="/x/api/event"
          src="/x/js/script.js"
        />
        <Component {...pageProps} />
      </AlephiumWalletProvider>
    </ThemeProvider>
  );
}

export default MyApp;
