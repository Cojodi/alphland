import Layout from "../components/Layout";
import styled from "styled-components";

// Custom styled-components (if needed)
const BountySection = styled.section`
  /* Add custom styles here if needed */
`;

const BountyPage = () => {
  return (
    <Layout
      title="Bounty Program"
      description="Contribute to Alphland and earn rewards"
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Hero Section */}
        <section className="text-center py-12 lg:py-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
            Bounty Program
          </h1>
          <p className="text-xl text-light-charcoal dark:text-lightgrey max-w-2xl mx-auto">
            Contribute to the Alphland ecosystem and earn rewards
          </p>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Card Example 1 */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Bug Bounties
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Find and report bugs to help improve the platform
            </p>
            <button className="bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              View Bounties
            </button>
          </div>

          {/* Card Example 2 */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Feature Requests
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Suggest and implement new features
            </p>
            <button className="bg-accessible-green text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Submit Idea
            </button>
          </div>
        </div>

        {/* List Section Example */}
        <section className="bg-white dark:bg-hero-dark rounded-lg p-8 lg:p-12">
          <h2 className="text-3xl font-bold mb-8 dark:text-white">
            Active Bounties
          </h2>

          <div className="space-y-6">
            {/* Bounty Item Example */}
            <div className="border-b border-border-grey dark:border-dark-charcoal pb-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold dark:text-white">
                  Example Bounty Title
                </h3>
                <span className="bg-orange text-white px-4 py-1 rounded-full text-sm font-medium">
                  $500
                </span>
              </div>
              <p className="text-light-charcoal dark:text-lightgrey mb-3">
                Description of the bounty task goes here...
              </p>
              <div className="flex gap-2">
                <span className="text-sm bg-smoked-white dark:bg-light-black px-3 py-1 rounded dark:text-white">
                  Development
                </span>
                <span className="text-sm bg-smoked-white dark:bg-light-black px-3 py-1 rounded dark:text-white">
                  Medium Priority
                </span>
              </div>
            </div>

            {/* Add more bounty items here */}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default BountyPage;
