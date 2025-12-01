import "../styles/globals.css";
import { AlephiumWalletProvider } from "@alephium/web3-react";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import Script from "next/script";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CookieConsent from "../components/CookieConsent/CookieConsent";
import { Analytics } from "@vercel/analytics/next";

function MyApp({ Component, pageProps }: AppProps) {
  // Suppress ethereum property redefinition errors from browser extensions
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.message.includes("Cannot redefine property: ethereum") ||
        event.message.includes("defineProperty") ||
        event.message.includes("The mark 'beforeRender' does not exist")
      ) {
        event.preventDefault();
        console.warn(
          "Suppressed error from browser extension or performance monitoring:",
          event.message,
        );
        return true;
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Fix for Next.js performance mark error
  useEffect(() => {
    if (typeof window !== "undefined" && window.performance) {
      const originalMeasure = window.performance.measure.bind(
        window.performance,
      );
      window.performance.measure = function (
        measureName: string,
        startOrMeasureOptions?: string | PerformanceMeasureOptions,
        endMark?: string,
      ): PerformanceMeasure {
        try {
          return originalMeasure(measureName, startOrMeasureOptions, endMark);
        } catch (error) {
          // Silently ignore performance mark errors
          console.debug("Performance measure error suppressed:", error);
          return {} as PerformanceMeasure;
        }
      };
    }
  }, []);

  // Initialize Netlify Identity for CMS authentication
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).netlifyIdentity) {
      (window as any).netlifyIdentity.on("init", (user: any) => {
        if (!user) {
          (window as any).netlifyIdentity.on("login", () => {
            document.location.href = "/admin/";
          });
        }
      });
    }
  }, []);
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
        <Script
          strategy="afterInteractive"
          src="https://identity.netlify.com/v1/netlify-identity-widget.js"
        />
        <CookieConsent />
        <Component {...pageProps} />
        <Analytics />
      </AlephiumWalletProvider>
    </ThemeProvider>
  );
}

export default MyApp;
