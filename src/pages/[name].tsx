import arrow from "../assets/icons/arrowLeft.svg";
import expandIcon from "../assets/icons/expand.svg";
import flagIcon from "../assets/icons/flag.svg";
import { AnnouncementBar } from "../components/AnnouncementBar";
import Button from "../components/Button/Button";
import Layout from "../components/Layout";
import ResourceCard from "../components/ResourceCard/ResourceCard";
import SocialLink from "../components/SocialLink/SocialLink";
import Tag from "../components/Tag/Tag";
import resourcesData from "../data/resources.json";
import DappPageRating from "../sections/DappPage/DappPageRating";
import { readdir, readFile } from "fs/promises";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import Script from "next/script";
import path from "path";
import { useEffect, useState } from "react";

interface DappResource {
  title: string;
  link: string;
  format: string;
  topic: string;
  language: string;
  embedHtml?: string;
  ogImage?: string;
}

interface DappPageProps {
  dappInfo: DappInfo;
  dappResources: DappResource[];
}

const DappPage: NextPage<DappPageProps> = ({ dappInfo, dappResources }) => {
  const hasTweets = dappResources.some((r) => r.embedHtml);
  const [showPrev, setShowPrev] = useState(false);
  const [bounties, setBounties] = useState<any[]>([]);
  const [loadingBounties, setLoadingBounties] = useState(true);
  const router = useRouter();
  const name = (router?.query?.name as string) || "";

  useEffect(() => {
    const pid = setTimeout(() => {
      setShowPrev(!history.state?.options?.shallow);
    }, 40);
    return () => clearTimeout(pid);
  }, []);

  // Fetch bounties for this dapp
  useEffect(() => {
    async function fetchDappBounties() {
      try {
        setLoadingBounties(true);
        const response = await fetch(
          `/api/bounties?dapp_name=${encodeURIComponent(dappInfo.name)}`,
        );
        const data = await response.json();
        setBounties(data.bounties || []);
      } catch (error) {
        console.error("Failed to fetch bounties:", error);
        setBounties([]);
      } finally {
        setLoadingBounties(false);
      }
    }

    if (dappInfo.name) {
      fetchDappBounties();
    }
  }, [dappInfo.name]);

  const linkOrder = [
    "website",
    "twitter",
    "linkedin",
    "telegram",
    "medium",
    "discord",
    "docs",
    "github",
    "youtube",
    "mirror",
  ] as unknown as Array<keyof Links>;

  const handleLinksOrder = () => {
    const links = dappInfo.links;
    const orderedLinks: Array<{ name: keyof Links; link: string }> = [];
    linkOrder.forEach((link) => {
      // linkedin fallback: use careers field if linkedin is empty
      const value =
        link === "linkedin" && !links[link]
          ? links.careers || ""
          : links[link] || "";
      if (value) {
        orderedLinks.push({ name: link, link: value });
      }
    });
    return orderedLinks;
  };

  // Filter only open/active bounties for display
  const activeBounties = bounties.filter((b) => b.status === "open");

  return (
    <Layout
      title={dappInfo.name}
      description={dappInfo.short_description}
      image={dappInfo.media.previewUrl}
      canonical={`https://alph.land/${name}`}
    >
      {hasTweets && (
        <Script
          src="https://platform.twitter.com/widgets.js"
          strategy="afterInteractive"
        />
      )}
      {/* Banner */}
      <div
        className="relative mt-[56px] lg:mt-0 max-h-[380px] min-h-[104px] sm:min-h-[240px] lg:min-h-[420px] w-full overflow-hidden bg-no-repeat bg-cover bg-center"
        style={{
          backgroundImage: `url(${dappInfo.media.bannerUrl})`,
        }}
      ></div>

      {/* Logo */}
      <div className="px-4 md:mx-[10vw] xl:mx-[15vw] 2xl:mx-[20vw] -mt-[40px] mb-6 xl:-mt-[80px] max-w-[1200px]">
        {dappInfo.links?.website ? (
          <Link href={dappInfo.links.website} passHref>
            <a className="relative max-w-[80px] min-h-[80px] xl:min-h-[160px] xl:max-w-[160px] block">
              <Image
                src={dappInfo.media.logoUrl}
                alt="icon"
                layout="fill"
                className="rounded-full"
              />
            </a>
          </Link>
        ) : (
          <div className="relative max-w-[80px] min-h-[80px] xl:min-h-[160px] xl:max-w-[160px]">
            <Image
              src={dappInfo.media.logoUrl}
              alt="icon"
              layout="fill"
              className="rounded-full"
            />
          </div>
        )}
      </div>

      {/* <div className="min-h-screen bg-white dark:bg-hero-dark"> */}
      {/* Header */}
      {/* <header className="border-b border-border-grey dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6"></div>
        </header> */}

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Hero Section */}
            <section>
              <h1 className="text-3xl font-bold dark:text-white mb-4">
                {dappInfo.name}
              </h1>
              <p className="text-lg dark:text-white/90 mb-6 leading-relaxed whitespace-pre-wrap">
                {dappInfo.description}
              </p>
              {dappInfo.links?.website && (
                <div className="flex justify-center md:justify-start">
                  <Link href={dappInfo.links.website} passHref>
                    <Button
                      variant="primary"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8"
                    >
                      Launch Dapp
                    </Button>
                  </Link>
                </div>
              )}
            </section>

            {/* Resources & Tutorials */}
            {dappResources.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold dark:text-white">
                    Resources & Tutorials
                  </h2>
                  <Link href={`/resources/${name}`}>
                    <a className="text-orange text-sm font-semibold hover:opacity-80 flex items-center gap-2">
                      View All
                      <Image
                        src={expandIcon}
                        alt="expand"
                        width={12}
                        height={12}
                      />
                    </a>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dappResources.slice(0, 4).map((resource, i) => (
                    <ResourceCard
                      key={i}
                      resource={resource}
                      dappBannerUrl={dappInfo.media.bannerUrl}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Active Bounties */}
            <section id="bounties">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white">
                  Active Bounties
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loadingBounties ? (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-light-charcoal dark:text-lightgrey">
                      Loading bounties...
                    </p>
                  </div>
                ) : activeBounties.length === 0 ? (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-light-charcoal dark:text-lightgrey mb-2">
                      No active bounties for {dappInfo.name} yet.
                    </p>
                    <Link href="/bounty">
                      <a className="text-orange hover:underline text-sm">
                        View all bounties →
                      </a>
                    </Link>
                  </div>
                ) : (
                  activeBounties.map((bounty) => {
                    // Calculate days remaining
                    const daysRemaining = bounty.end_date
                      ? Math.ceil(
                          (new Date(bounty.end_date * 1000).getTime() -
                            Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )
                      : null;

                    // Format due date display
                    const dueDateText =
                      daysRemaining !== null && daysRemaining > 0
                        ? `Due in ${daysRemaining}d`
                        : daysRemaining === 0
                          ? "Due today"
                          : daysRemaining !== null && daysRemaining < 0
                            ? "Overdue"
                            : "Active";

                    // Determine if overdue for styling
                    const isOverdue =
                      daysRemaining !== null && daysRemaining < 0;

                    return (
                      <Link key={bounty.id} href={`/bounty/${bounty.id}`}>
                        <a className="block p-6 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:shadow-box-image-shadow-hover transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="font-semibold dark:text-white flex-1">
                              {bounty.title}
                            </h3>
                            <span className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 bg-accessible-green/20 text-accessible-green">
                              Active
                            </span>
                          </div>
                          <p className="text-sm text-light-charcoal dark:text-lightgrey mb-6 line-clamp-2">
                            {bounty.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-accessible-green font-semibold">
                              {bounty.reward_amount}{" "}
                              {bounty.reward_currency || "ALPH"}
                            </span>
                            <span
                              className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-light-charcoal dark:text-clay"}`}
                            >
                              {dueDateText}
                            </span>
                          </div>
                        </a>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>

            {/* Gallery */}
            {dappInfo.media?.gallery && dappInfo.media.gallery.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">
                  Gallery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dappInfo.media.gallery.map((image, i) => (
                    <div
                      key={i}
                      className="rounded-lg h-64 bg-no-repeat bg-center bg-cover shadow-box-image-shadow"
                      style={{ backgroundImage: `url(${image.url})` }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Tags */}
            {dappInfo.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 dark:text-white">
                  Tags
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {dappInfo.tags.map((tag) => (
                    <Tag key={tag} name={tag} />
                  ))}
                </div>
              </div>
            )}

            {/* Report */}
            <div>
              <Link href={`/report/?dapp=${encodeURIComponent(dappInfo.name)}`}>
                <a className="flex items-center text-sm text-lightgrey hover:text-orange transition-colors">
                  <Image
                    src={flagIcon}
                    alt="flag icon"
                    width={16}
                    height={16}
                  />
                  <span className="ml-2">Report an Issue</span>
                </a>
              </Link>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4 dark:text-white">
                Links
              </h3>
              <div className="flex gap-4 flex-wrap">
                {handleLinksOrder().map((link) => (
                  <SocialLink
                    key={link.name}
                    name={link.name}
                    link={link.link}
                  />
                ))}
              </div>
            </div>

            {/* Rating */}
            {/* <div>
                <DappPageRating dappKey={name} />
              </div> */}
          </aside>
        </div>
      </main>
      {/* </div> */}
    </Layout>
  );
};

const isTweetUrl = (url: string) =>
  /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url);

const fetchTweetEmbed = async (url: string): Promise<string | null> => {
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&dnt=true`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.html as string) || null;
  } catch {
    return null;
  }
};

const fetchOgImage = async (url: string): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Alphland/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      );
    return match?.[1] || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const getStaticProps: GetStaticProps<DappPageProps> = async (
  context,
) => {
  const name = context.params?.name;

  if (!name) {
    throw new Error("Name not provided");
  }

  const dappFile = path.join(process.cwd(), "data", `${name}.json`);
  const content = await readFile(dappFile, "utf8");

  const dappInfo: DappInfo = JSON.parse(content);

  const allResources = resourcesData as Record<string, DappResource[]>;
  const rawResources = allResources[name as string] || [];

  const dappResources = await Promise.all(
    rawResources.map(async (resource) => {
      if (isTweetUrl(resource.link)) {
        const embedHtml = await fetchTweetEmbed(resource.link);
        return embedHtml ? { ...resource, embedHtml } : resource;
      }
      const isYouTube = /youtube\.com\/watch|youtu\.be\//.test(resource.link);
      if (!isYouTube) {
        const ogImage = await fetchOgImage(resource.link);
        return ogImage ? { ...resource, ogImage } : resource;
      }
      return resource;
    }),
  );

  return {
    props: {
      dappInfo,
      dappResources,
    },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths<{ name: string }> = async () => {
  const dappsDirectory = path.join(process.cwd(), "data");
  const filenames = await readdir(dappsDirectory);

  return {
    paths: filenames
      .filter((filename) => {
        return filename.endsWith(".json");
      })
      .map((filename) => ({
        params: {
          name: filename.replace(/\.json$/, ""),
        },
      })),
    fallback: "blocking",
  };
};

export default DappPage;
