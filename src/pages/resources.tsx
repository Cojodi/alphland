import Layout from "../components/Layout";

const ResourcesPage = () => {
  return (
    <Layout
      title="Resources"
      description="Learn about Alephium and discover helpful resources"
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Hero Section */}
        <section className="text-center py-12 lg:py-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
            Resources
          </h1>
          <p className="text-xl text-light-charcoal dark:text-lightgrey max-w-2xl mx-auto">
            Everything you need to know about the Alephium ecosystem
          </p>
        </section>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 mb-16">
          {/* Documentation */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Documentation
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Official documentation and guides for developers
            </p>
            <a
              href="https://docs.alephium.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              View Docs
            </a>
          </div>

          {/* GitHub */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              GitHub
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Explore the source code and contribute to the ecosystem
            </p>
            <a
              href="https://github.com/alephium"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              View GitHub
            </a>
          </div>

          {/* Community */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Community
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Join the community on Discord, Telegram, and Twitter
            </p>
            <a
              href="https://alephium.org/#community"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Get Involved
            </a>
          </div>

          {/* Tutorials */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Tutorials
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Step-by-step guides to get started with Alephium
            </p>
            <a
              href="https://docs.alephium.org/dapps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Start Learning
            </a>
          </div>

          {/* Whitepaper */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Whitepaper
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Read the technical whitepaper and understand the protocol
            </p>
            <a
              href="https://github.com/alephium/white-paper"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Read Whitepaper
            </a>
          </div>

          {/* Brand Assets */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Brand Assets
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Download logos and brand guidelines
            </p>
            <a
              href="https://alephium.org/brand"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Download Assets
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResourcesPage;
