import Layout from "../components/Layout";

const EcosystemMapPage = () => {
  return (
    <Layout
      title="Ecosystem Map"
      description="Explore the complete Alephium ecosystem landscape"
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Hero Section */}
        <section className="text-center py-12 lg:py-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
            Ecosystem Map
          </h1>
          <p className="text-xl text-light-charcoal dark:text-lightgrey max-w-2xl mx-auto">
            A comprehensive view of the Alephium ecosystem and its components
          </p>
        </section>

        {/* Ecosystem Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* DeFi */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-6 shadow-box-image-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">D</span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white">DeFi</h3>
            </div>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              Decentralized finance protocols and platforms
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                DEXes
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Lending
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Staking
              </span>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-6 shadow-box-image-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-accessible-green rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">I</span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white">
                Infrastructure
              </h3>
            </div>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              Core infrastructure and developer tools
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Explorers
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                APIs
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Tools
              </span>
            </div>
          </div>

          {/* NFTs */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-6 shadow-box-image-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">N</span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white">NFTs</h3>
            </div>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              NFT marketplaces and collections
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Marketplaces
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Art
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Gaming
              </span>
            </div>
          </div>

          {/* Wallets */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-6 shadow-box-image-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-accessible-green rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">W</span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white">Wallets</h3>
            </div>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              Secure wallet solutions for managing assets
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Desktop
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Mobile
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Hardware
              </span>
            </div>
          </div>

          {/* Games */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-6 shadow-box-image-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">G</span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white">Games</h3>
            </div>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              Gaming and entertainment applications
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                P2E
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Casual
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Strategy
              </span>
            </div>
          </div>

          {/* Social */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-6 shadow-box-image-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-accessible-green rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">S</span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white">Social</h3>
            </div>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              Social and community platforms
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                DAOs
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Forums
              </span>
              <span className="text-xs bg-smoked-white dark:bg-light-black px-2 py-1 rounded dark:text-white">
                Governance
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <section className="bg-white dark:bg-hero-dark rounded-lg p-8 lg:p-12">
          <h2 className="text-3xl font-bold mb-8 dark:text-white">
            Ecosystem Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange mb-2">50+</div>
              <div className="text-light-charcoal dark:text-lightgrey">
                Total dApps
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accessible-green mb-2">
                15+
              </div>
              <div className="text-light-charcoal dark:text-lightgrey">
                Categories
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange mb-2">100K+</div>
              <div className="text-light-charcoal dark:text-lightgrey">
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accessible-green mb-2">
                Growing
              </div>
              <div className="text-light-charcoal dark:text-lightgrey">
                Daily
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default EcosystemMapPage;
