import arrow from "../../assets/icons/arrowLeft.svg";
import Layout from "../../components/Layout";
import ResourceCard from "../../components/ResourceCard/ResourceCard";
import resourcesData from "../../data/resources.json";
import { readdir, readFile } from "fs/promises";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Script from "next/script";
import Router from "next/router";
import path from "path";

interface Resource {
  title: string;
  link: string;
  format: string;
  topic: string;
  language: string;
  embedHtml?: string;
  ogImage?: string;
}

interface ResourcesPageProps {
  dappInfo: DappInfo;
  dappResources: Resource[];
}

const ResourcesPage: NextPage<ResourcesPageProps> = ({
  dappInfo,
  dappResources,
}) => {
  const hasTweets = dappResources.some((r) => r.embedHtml);

  return (
    <Layout
      title={`${dappInfo.name} - Resources & Tutorials`}
      description={`Learn how to use ${dappInfo.name} with our comprehensive guides and tutorials`}
    >
      {hasTweets && (
        <Script
          src="https://platform.twitter.com/widgets.js"
          strategy="afterInteractive"
        />
      )}
      <div className="min-h-screen bg-white dark:bg-hero-dark">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <button
            onClick={() => Router.back()}
            className="text-orange text-base font-semibold mb-8 flex items-center hover:opacity-80"
          >
            <Image src={arrow} alt="arrow" width={20} height={20} />
            <span className="ml-2">Back to {dappInfo.name}</span>
          </button>

          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 relative rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={dappInfo.media.logoUrl}
                  alt={dappInfo.name}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold dark:text-white">
                  {dappInfo.name} Resources
                </h1>
                <p className="text-light-charcoal dark:text-lightgrey mt-2">
                  Learn how to use {dappInfo.name} with our comprehensive guides
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {/* Resources from JSON data */}
            {dappResources.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">
                  Tutorials & Guides
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dappResources.map((resource, i) => (
                    <ResourceCard key={i} resource={resource} />
                  ))}
                </div>
              </section>
            )}

            {/* Video from dApp media */}
            {dappInfo.media?.videoUrl &&
              !dappResources.some(
                (r) => r.link === dappInfo.media.videoUrl,
              ) && (
                <section>
                  <h2 className="text-2xl font-bold mb-6 dark:text-white">
                    Video
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="border border-border-grey dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-white/5">
                      <div className="relative aspect-video">
                        <video
                          src={dappInfo.media.videoUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 dark:text-white">
                          Getting Started with {dappInfo.name}
                        </h3>
                        <p className="text-sm text-light-charcoal dark:text-lightgrey">
                          Complete beginner&apos;s guide to get started
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

            {/* Documentation */}
            {(dappInfo.links?.docs || dappInfo.links?.github) && (
              <section>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">
                  Documentation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dappInfo.links?.docs && (
                    <a
                      href={dappInfo.links.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-6 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:shadow-box-image-shadow-hover transition-shadow"
                    >
                      <h3 className="font-semibold text-lg mb-2 dark:text-white">
                        Official Documentation
                      </h3>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey mb-4">
                        Comprehensive guides and API references for developers
                      </p>
                      <span className="text-orange text-sm font-semibold">
                        View Docs →
                      </span>
                    </a>
                  )}

                  {dappInfo.links?.github && (
                    <a
                      href={dappInfo.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-6 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:shadow-box-image-shadow-hover transition-shadow"
                    >
                      <h3 className="font-semibold text-lg mb-2 dark:text-white">
                        GitHub Repository
                      </h3>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey mb-4">
                        Explore the source code and contribute to the project
                      </p>
                      <span className="text-orange text-sm font-semibold">
                        View on GitHub →
                      </span>
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Community Resources */}
            {(dappInfo.links?.discord ||
              dappInfo.links?.telegram ||
              dappInfo.links?.medium) && (
              <section>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">
                  Community & Support
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {dappInfo.links?.discord && (
                    <a
                      href={dappInfo.links.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-6 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:shadow-box-image-shadow-hover transition-shadow text-center"
                    >
                      <h3 className="font-semibold mb-2 dark:text-white">
                        Discord
                      </h3>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey">
                        Join our community for support and discussions
                      </p>
                    </a>
                  )}

                  {dappInfo.links?.telegram && (
                    <a
                      href={dappInfo.links.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-6 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:shadow-box-image-shadow-hover transition-shadow text-center"
                    >
                      <h3 className="font-semibold mb-2 dark:text-white">
                        Telegram
                      </h3>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey">
                        Get real-time updates and support
                      </p>
                    </a>
                  )}

                  {dappInfo.links?.medium && (
                    <a
                      href={dappInfo.links.medium}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-6 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:shadow-box-image-shadow-hover transition-shadow text-center"
                    >
                      <h3 className="font-semibold mb-2 dark:text-white">
                        Medium Blog
                      </h3>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey">
                        Read our latest articles and updates
                      </p>
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Gallery */}
            {dappInfo.media?.gallery && dappInfo.media.gallery.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">
                  Screenshots & Gallery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dappInfo.media.gallery.map((image, i) => (
                    <div
                      key={i}
                      className="rounded-lg h-64 bg-no-repeat bg-center bg-cover shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow"
                      style={{ backgroundImage: `url(${image.url})` }}
                      title={image.description}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
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
    // Match both attribute orderings: property="og:image" content="..." and content="..." property="og:image"
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

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async (
  context,
) => {
  const dappname = context.params?.dappname;

  if (!dappname) {
    throw new Error("Dapp name not provided");
  }

  const dappFile = path.join(process.cwd(), "data", `${dappname}.json`);
  const content = await readFile(dappFile, "utf8");

  const dappInfo: DappInfo = JSON.parse(content);

  const allResources = resourcesData as Record<string, Resource[]>;
  const rawResources = allResources[dappname as string] || [];

  const dappResources = await Promise.all(
    rawResources.map(async (resource) => {
      if (isTweetUrl(resource.link)) {
        const embedHtml = await fetchTweetEmbed(resource.link);
        return embedHtml ? { ...resource, embedHtml } : resource;
      }
      // YouTube is handled client-side via iframe; skip OG fetch for it
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

export const getStaticPaths: GetStaticPaths<{
  dappname: string;
}> = async () => {
  const dappsDirectory = path.join(process.cwd(), "data");
  const filenames = await readdir(dappsDirectory);

  return {
    paths: filenames
      .filter((filename) => filename.endsWith(".json"))
      .map((filename) => ({
        params: {
          dappname: filename.replace(/\.json$/, ""),
        },
      })),
    fallback: false,
  };
};

export default ResourcesPage;
