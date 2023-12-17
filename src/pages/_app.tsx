import "../styles/globals.css";
import { AlephiumWalletProvider } from "@alephium/web3-react";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import Script from "next/script";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <AlephiumWalletProvider network="mainnet">
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <Script
          strategy="afterInteractive"
          defer
          data-domain="alph.land"
          data-api="/x/api/event"
          src="/x/js/script.js"
        />
        <Component {...pageProps} />
      </AlephiumWalletProvider>
    </ThemeProvider>
  );
}

export default MyApp;
