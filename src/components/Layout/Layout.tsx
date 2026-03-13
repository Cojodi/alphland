import { useCategoryStore } from "../../hooks/useCategoryStore";
import { useDarkMode } from "../../hooks/useDarkMode";
import Footer from "./Footer";
import Header from "./Header";
import Head from "next/head";
import styled from "styled-components";

const MainContainer = styled.main`
  padding-top: 0;
  @media (min-width: 1024px) {
    padding-top: 0;
  }
`;

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  isHome?: boolean;
}

export const Layout = ({
  children,
  title,
  description,
  image,
  canonical,
  isHome,
}: LayoutProps) => {
  const selectedFilters = useCategoryStore((state) => state.selectedFilters);
  const selectedRatings = useCategoryStore((state) => state.selectedRatings);
  const { currentTheme } = useDarkMode();

  const pageTitle = title
    ? `${title} on Alphland – The best of Alephium's ecosystem`
    : `Alphland | Discover the best of Alephium's ecosystem`;

  const ogTitle = title
    ? `Discover ${title} on Alphland – the best of Alephium's ecosystem`
    : `Alphland | Discover the best of Alephium's ecosystem`;

  const metaDescription = description
    ? description
    : `Alphland is the go-to directory for Alephium's ecosystem — explore dApps, DeFi protocols, NFT platforms, tools, and bounties built on Alephium blockchain.`;

  const ogImage = image ?? "https://www.alph.land/share-preview.png";
  const canonicalUrl = canonical ?? "https://alph.land";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Alphland",
    url: "https://alph.land",
    logo: "https://alph.land/android-chrome-512x512.png",
    description: metaDescription,
    sameAs: ["https://github.com/cojodi/Alphland"],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Alphland",
    url: "https://alph.land",
    description: metaDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://alph.land/?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:site_name" content="Alphland" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:site" content="@alephium" />

        {/* JSON-LD Structured Data */}
        {isHome && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(organizationSchema),
              }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(websiteSchema),
              }}
            />
          </>
        )}

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <Header />
      <MainContainer>{children}</MainContainer>
      <Footer currentTheme={currentTheme} />
    </>
  );
};
