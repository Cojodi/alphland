import arrow from "../../../assets/icons/arrowLeft.svg";
import Button from "../../../components/Button/Button";
import Layout from "../../../components/Layout";
import { readdir, readFile } from "fs/promises";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Router from "next/router";
import path from "path";

interface BountyDetailPageProps {
  dappInfo: DappInfo;
  bountyId: string;
}

// Sample bounty data structure (in real app, this would come from a database/API)
const bountyData: {
  [key: string]: {
    title: string;
    description: string;
    fullDescription: string;
    reward: string;
    status: string;
    dueDate: string;
    requirements: string[];
    deliverables: string[];
    skills: string[];
  };
} = {
  "integrate-api": {
    title: "Integrate our API",
    description: "Build a frontend integration using our public API endpoints",
    fullDescription:
      "We're looking for a skilled frontend developer to create a comprehensive integration with our public API. This bounty involves building a user-friendly interface that demonstrates the core functionality of our API endpoints, including authentication, data fetching, and real-time updates.",
    reward: "$500",
    status: "Active",
    dueDate: "Due in 15 days",
    requirements: [
      "Experience with React or Vue.js",
      "Understanding of RESTful APIs",
      "Ability to work with async/await patterns",
      "Knowledge of error handling best practices",
    ],
    deliverables: [
      "Complete source code on GitHub",
      "Documentation of the integration",
      "Demo video showcasing the functionality",
      "Unit tests for critical components",
    ],
    skills: ["JavaScript", "React", "API Integration", "TypeScript"],
  },
  "find-bug": {
    title: "Find a smart contract bug",
    description:
      "Security audit and vulnerability assessment of our main contracts",
    fullDescription:
      "We're seeking experienced security researchers to audit our smart contracts and identify potential vulnerabilities. This is a critical bounty that helps ensure the safety and security of our protocol. Rewards scale based on the severity of findings.",
    reward: "up to $5,000",
    status: "Active",
    dueDate: "Due in 30 days",
    requirements: [
      "Experience with smart contract security auditing",
      "Knowledge of Solidity and common vulnerabilities",
      "Familiarity with tools like Slither, Mythril, or Echidna",
      "Understanding of DeFi protocols and attack vectors",
    ],
    deliverables: [
      "Detailed vulnerability report",
      "Proof of concept (if applicable)",
      "Recommendations for fixes",
      "Severity assessment using CVSS",
    ],
    skills: [
      "Smart Contracts",
      "Security",
      "Solidity",
      "Blockchain",
      "Auditing",
    ],
  },
  "video-tutorial": {
    title: "Create a video tutorial",
    description: "Produce educational content explaining our protocol features",
    fullDescription:
      "We need engaging video content that explains how to use our protocol to newcomers. The tutorial should be beginner-friendly, well-produced, and cover the core features of our platform in an easy-to-understand manner.",
    reward: "$1,500",
    status: "Overdue",
    dueDate: "Overdue by 5 days",
    requirements: [
      "Video editing experience",
      "Clear speaking voice and good presentation skills",
      "Understanding of DeFi concepts",
      "Ability to explain complex topics simply",
    ],
    deliverables: [
      "10-15 minute video tutorial",
      "Script and storyboard",
      "Subtitles/closed captions",
      "Promotional thumbnail and description",
    ],
    skills: ["Video Production", "Content Creation", "Teaching", "DeFi"],
  },
};

const BountyDetailPage: NextPage<BountyDetailPageProps> = ({
  dappInfo,
  bountyId,
}) => {
  const bounty = bountyData[bountyId];

  if (!bounty) {
    return (
      <Layout title="Bounty Not Found">
        <div className="min-h-screen bg-white dark:bg-hero-dark flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold dark:text-white mb-4">
              Bounty Not Found
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey mb-8">
              The bounty you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button variant="primary" onClick={() => Router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${bounty.title} - ${dappInfo.name} Bounty`}
      description={bounty.description}
    >
      <div className="min-h-screen bg-white dark:bg-hero-dark">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <button
            onClick={() => Router.back()}
            className="text-orange text-base font-semibold mb-8 flex items-center hover:opacity-80"
          >
            <Image src={arrow} alt="arrow" width={20} height={20} />
            <span className="ml-2">Back to {dappInfo.name}</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 relative rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={dappInfo.media.logoUrl}
                      alt={dappInfo.name}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-light-charcoal dark:text-lightgrey">
                      {dappInfo.name} Bounty
                    </p>
                    <h1 className="text-3xl font-bold dark:text-white">
                      {bounty.title}
                    </h1>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                      bounty.status === "Active"
                        ? "bg-accessible-green/20 text-accessible-green"
                        : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {bounty.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <section className="bg-white dark:bg-white/5 border border-border-grey dark:border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">
                  Description
                </h2>
                <p className="text-light-charcoal dark:text-lightgrey leading-relaxed">
                  {bounty.fullDescription}
                </p>
              </section>

              {/* Requirements */}
              <section className="bg-white dark:bg-white/5 border border-border-grey dark:border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {bounty.requirements.map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-light-charcoal dark:text-lightgrey"
                    >
                      <span className="text-orange mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Deliverables */}
              <section className="bg-white dark:bg-white/5 border border-border-grey dark:border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">
                  Deliverables
                </h2>
                <ul className="space-y-2">
                  {bounty.deliverables.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-light-charcoal dark:text-lightgrey"
                    >
                      <span className="text-accessible-green mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* How to Apply */}
              <section className="bg-orange/10 dark:bg-orange/20 border border-orange/30 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">
                  How to Apply
                </h2>
                <p className="text-light-charcoal dark:text-lightgrey mb-4">
                  Interested in this bounty? Follow these steps:
                </p>
                <ol className="space-y-2 mb-6">
                  <li className="flex items-start gap-3 text-light-charcoal dark:text-lightgrey">
                    <span className="font-semibold text-orange">1.</span>
                    <span>Review all requirements and deliverables</span>
                  </li>
                  <li className="flex items-start gap-3 text-light-charcoal dark:text-lightgrey">
                    <span className="font-semibold text-orange">2.</span>
                    <span>
                      Join our Discord/Telegram to discuss your approach
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-light-charcoal dark:text-lightgrey">
                    <span className="font-semibold text-orange">3.</span>
                    <span>Submit your proposal for review</span>
                  </li>
                </ol>
                <div className="flex gap-4 flex-wrap">
                  {dappInfo.links?.discord && (
                    <a
                      href={dappInfo.links.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="primary">Join Discord</Button>
                    </a>
                  )}
                  {dappInfo.links?.telegram && (
                    <a
                      href={dappInfo.links.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary">Join Telegram</Button>
                    </a>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Reward */}
              <div className="bg-white dark:bg-white/5 border border-border-grey dark:border-white/10 rounded-lg p-6">
                <p className="text-sm text-light-charcoal dark:text-clay mb-2">
                  Reward
                </p>
                <p className="text-3xl font-bold text-accessible-green">
                  {bounty.reward}
                </p>
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-white/5 border border-border-grey dark:border-white/10 rounded-lg p-6">
                <p className="text-sm text-light-charcoal dark:text-clay mb-2">
                  Timeline
                </p>
                <p className="font-semibold dark:text-white">
                  {bounty.dueDate}
                </p>
              </div>

              {/* Skills */}
              <div className="bg-white dark:bg-white/5 border border-border-grey dark:border-white/10 rounded-lg p-6">
                <h3 className="font-semibold mb-4 dark:text-white">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {bounty.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-smoked-white dark:bg-light-black text-light-black dark:text-white rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Project Info */}
              <div className="bg-white dark:bg-white/5 border border-border-grey dark:border-white/10 rounded-lg p-6">
                <h3 className="font-semibold mb-4 dark:text-white">
                  About {dappInfo.name}
                </h3>
                <p className="text-sm text-light-charcoal dark:text-lightgrey mb-4">
                  {dappInfo.short_description}
                </p>
                {dappInfo.links?.website && (
                  <a
                    href={dappInfo.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange text-sm font-semibold hover:opacity-80"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BountyDetailPageProps> = async (
  context
) => {
  const dappname = context.params?.dappname;
  const bountyid = context.params?.bountyid;

  if (!dappname || !bountyid) {
    throw new Error("Parameters not provided");
  }

  const dappFile = path.join(process.cwd(), "data", `${dappname}.json`);
  const content = await readFile(dappFile, "utf8");

  const dappInfo: DappInfo = JSON.parse(content);

  return {
    props: {
      dappInfo,
      bountyId: bountyid as string,
    },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths<{
  dappname: string;
  bountyid: string;
}> = async () => {
  const dappsDirectory = path.join(process.cwd(), "data");
  const filenames = await readdir(dappsDirectory);

  // Generate paths for all dapps with sample bounties
  const paths = filenames
    .filter((filename) => filename.endsWith(".json"))
    .flatMap((filename) => {
      const dappname = filename.replace(/\.json$/, "");
      return ["integrate-api", "find-bug", "video-tutorial"].map(
        (bountyid) => ({
          params: { dappname, bountyid },
        })
      );
    });

  return {
    paths,
    fallback: false,
  };
};

export default BountyDetailPage;
