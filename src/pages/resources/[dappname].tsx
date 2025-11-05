import arrow from "../../assets/icons/arrowLeft.svg";
import Layout from "../../components/Layout";
import { readdir, readFile } from "fs/promises";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import Router from "next/router";
import path from "path";

interface ResourcesPageProps {
  dappInfo: DappInfo;
}

const ResourcesPage: NextPage<ResourcesPageProps> = ({ dappInfo }) => {
  return (
    <Layout
      title={`${dappInfo.name} - Resources & Tutorials`}
      description={`Learn how to use ${dappInfo.name} with our comprehensive guides and tutorials`}
    >
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
            {/* Video Tutorials */}
            {dappInfo.media?.videoUrl && (
              <section>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">
                  Video Tutorials
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

            {/* Community Resources */}
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

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async (
  context
) => {
  const dappname = context.params?.dappname;

  if (!dappname) {
    throw new Error("Dapp name not provided");
  }

  const dappFile = path.join(process.cwd(), "data", `${dappname}.json`);
  const content = await readFile(dappFile, "utf8");

  const dappInfo: DappInfo = JSON.parse(content);

  return {
    props: {
      dappInfo,
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
