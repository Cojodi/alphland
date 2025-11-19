import arrow from "../assets/icons/arrowLeft.svg";
import expandIcon from "../assets/icons/expand.svg";
import flagIcon from "../assets/icons/flag.svg";
import { AnnouncementBar } from "../components/AnnouncementBar";
import Button from "../components/Button/Button";
import Layout from "../components/Layout";
import SocialLink from "../components/SocialLink/SocialLink";
import Tag from "../components/Tag/Tag";
import DappPageRating from "../sections/DappPage/DappPageRating";
import { readdir, readFile } from "fs/promises";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import path from "path";
import { useEffect, useState } from "react";

interface DappPageProps {
  dappInfo: DappInfo;
}

const DappPage: NextPage<DappPageProps> = ({ dappInfo }) => {
  const [showPrev, setShowPrev] = useState(false);
  const router = useRouter();
  const name = (router?.query?.name as string) || "";

  useEffect(() => {
    const pid = setTimeout(() => {
      setShowPrev(!history.state?.options?.shallow);
    }, 40);
    return () => clearTimeout(pid);
  }, []);

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
      if (links[link]) {
        orderedLinks.push({ name: link, link: links[link] });
      } else {
        orderedLinks.push({ name: link, link: "" });
      }
    });
    return orderedLinks;
  };

  // Sample bounties data (in real app, this would come from API/database)
  const sampleBounties = [
    {
      id: "integrate-api",
      title: "Integrate our API",
      description:
        "Build a frontend integration using our public API endpoints",
      reward: "$500",
      status: "Active",
      dueDate: "Due in 15 days",
    },
    {
      id: "find-bug",
      title: "Find a smart contract bug",
      description:
        "Security audit and vulnerability assessment of our main contracts",
      reward: "up to $5,000",
      status: "Active",
      dueDate: "Due in 30 days",
    },
    {
      id: "video-tutorial",
      title: "Create a video tutorial",
      description:
        "Produce educational content explaining our protocol features",
      reward: "$1,500",
      status: "Overdue",
      dueDate: "Overdue by 5 days",
    },
  ];

  return (
    <Layout
      title={dappInfo.name}
      description={dappInfo.short_description}
      image={dappInfo.media.previewUrl}
    >
      {/* Banner */}
      <div
        className="relative mt-[56px] lg:mt-0 max-h-[380px] min-h-[104px] sm:min-h-[240px] lg:min-h-[420px] w-full overflow-hidden bg-no-repeat bg-cover bg-center"
        style={{
          backgroundImage: `url(${dappInfo.media.bannerUrl})`,
        }}
      ></div>

      {/* Logo */}
      <div className="px-4 md:mx-[10vw] xl:mx-[15vw] 2xl:mx-[20vw] -mt-[40px] mb-6 xl:-mt-[80px] max-w-[1200px]">
        <div className="relative max-w-[80px] min-h-[80px] xl:min-h-[160px] xl:max-w-[160px]">
          <Image
            src={dappInfo.media.logoUrl}
            alt="icon"
            layout="fill"
            className="rounded-full"
          />
        </div>
      </div>

      <div className="min-h-screen bg-white dark:bg-hero-dark">
        {/* Header */}
        <header className="border-b border-border-grey dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6"></div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Hero Section */}
              <section>
                <p className="text-lg dark:text-white/90 mb-6 leading-relaxed">
                  {dappInfo.description}
                </p>
                {dappInfo.links?.website && (
                  <Link href={dappInfo.links.website} passHref>
                    <Button
                      variant="primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Launch Dapp
                    </Button>
                  </Link>
                )}
              </section>

              {/* Project Information */}
              <section>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">
                  Project Information
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5">
                    <p className="text-sm text-light-charcoal dark:text-clay mb-1">
                      Founded
                    </p>
                    <p className="font-semibold dark:text-white">
                      {dappInfo.teamInfo.founded
                        ? new Date(
                            dappInfo.teamInfo.founded
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="p-4 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5">
                    <p className="text-sm text-light-charcoal dark:text-clay mb-1">
                      Team
                    </p>
                    <p className="font-semibold text-accessible-green dark:text-accessible-green">
                      {dappInfo.teamInfo.anonymous ? "Anonymous" : "Public"}
                    </p>
                  </div>
                  <div className="p-4 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5">
                    <p className="text-sm text-light-charcoal dark:text-clay mb-1">
                      Audit
                    </p>
                    <p className="font-semibold dark:text-white">
                      {dappInfo.audits && dappInfo.audits.length > 0 ? (
                        <span className="text-accessible-green">
                          Yes ({dappInfo.audits[0].name})
                        </span>
                      ) : (
                        "No"
                      )}
                    </p>
                  </div>
                  <div className="p-4 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5">
                    <p className="text-sm text-light-charcoal dark:text-clay mb-1">
                      Token
                    </p>
                    <p className="font-semibold dark:text-white">
                      {dappInfo.tokens && dappInfo.tokens.length > 0
                        ? dappInfo.tokens[0].symbol
                        : "No Token"}
                    </p>
                  </div>
                  <div className="p-4 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5">
                    <p className="text-sm text-light-charcoal dark:text-clay mb-1">
                      Verified
                    </p>
                    <p className="font-semibold dark:text-white">
                      {dappInfo.verified ? (
                        <span className="text-accessible-green">Yes</span>
                      ) : (
                        "No"
                      )}
                    </p>
                  </div>
                  <div className="p-4 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5">
                    <p className="text-sm text-light-charcoal dark:text-clay mb-1">
                      Smart Contract
                    </p>
                    <p className="font-semibold dark:text-white">
                      {dappInfo.contracts && dappInfo.contracts.length > 0 ? (
                        <span className="text-accessible-green">Verified</span>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                </div>
              </section>

              {/* Resources & Tutorials */}
              {dappInfo.media?.videoUrl && (
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
                    <div className="border border-border-grey dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-white/5">
                      <div className="relative bg-gradient-to-br from-teal-900 to-slate-900 aspect-video flex items-center justify-center">
                        <div className="absolute top-3 left-3 bg-orange text-white px-2 py-1 rounded text-xs font-semibold">
                          Video
                        </div>
                        <video
                          src={dappInfo.media.videoUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 dark:text-white">
                          How to start with {dappInfo.name}
                        </h3>
                        <p className="text-sm text-light-charcoal dark:text-lightgrey">
                          Complete beginner&apos;s guide to get started with{" "}
                          {dappInfo.name}
                        </p>
                      </div>
                    </div>
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
                  {sampleBounties.map((bounty) => (
                    <Link key={bounty.id} href={`/bounty/${name}/${bounty.id}`}>
                      <a className="block p-6 border border-border-grey dark:border-white/10 rounded-lg bg-white dark:bg-white/5 hover:shadow-box-image-shadow-hover transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-semibold dark:text-white flex-1">
                            {bounty.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${
                              bounty.status === "Active"
                                ? "bg-accessible-green/20 text-accessible-green"
                                : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {bounty.status}
                          </span>
                        </div>
                        <p className="text-sm text-light-charcoal dark:text-lightgrey mb-6">
                          {bounty.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-accessible-green font-semibold">
                            {bounty.reward}
                          </span>
                          <span className="text-light-charcoal dark:text-clay text-xs">
                            {bounty.dueDate}
                          </span>
                        </div>
                      </a>
                    </Link>
                  ))}
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
                <a
                  href="https://x.com/fugashu_codes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-lightgrey hover:text-orange transition-colors"
                >
                  <Image
                    src={flagIcon}
                    alt="flag icon"
                    width={16}
                    height={16}
                  />
                  <span className="ml-2">Report</span>
                </a>
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
              <div>
                <DappPageRating dappKey={name} />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<DappPageProps> = async (
  context
) => {
  const name = context.params?.name;

  if (!name) {
    throw new Error("Name not provided");
  }

  const dappFile = path.join(process.cwd(), "data", `${name}.json`);
  const content = await readFile(dappFile, "utf8");

  const dappInfo: DappInfo = JSON.parse(content);

  return {
    props: {
      dappInfo,
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
    fallback: false,
  };
};

export default DappPage;
