import Layout from "../components/Layout";

const ForumPage = () => {
  return (
    <Layout title="Forum" description="Join the Alphland community discussions">
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Hero Section */}
        <section className="text-center py-12 lg:py-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
            Community Forum
          </h1>
          <p className="text-xl text-light-charcoal dark:text-lightgrey max-w-2xl mx-auto">
            Connect with the Alephium community and participate in discussions
          </p>
        </section>

        {/* Forum Links Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Discord */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Discord
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Join our Discord server for real-time discussions, support, and
              community events
            </p>
            <a
              href="https://alephium.org/discord"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Join Discord
            </a>
          </div>

          {/* Telegram */}
          <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow hover:shadow-box-image-shadow-hover transition-shadow">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Telegram
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey mb-6">
              Connect with the community on Telegram for announcements and
              discussions
            </p>
            <a
              href="https://t.me/alephiumgroup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Join Telegram
            </a>
          </div>
        </div>

        {/* Popular Topics Section */}
        <section className="bg-white dark:bg-hero-dark rounded-lg p-8 lg:p-12">
          <h2 className="text-3xl font-bold mb-8 dark:text-white">
            Popular Topics
          </h2>

          <div className="space-y-6">
            {/* Topic Item */}
            <div className="border-b border-border-grey dark:border-dark-charcoal pb-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold dark:text-white">
                  General Discussion
                </h3>
                <span className="bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-white px-4 py-1 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              <p className="text-light-charcoal dark:text-lightgrey mb-3">
                General discussions about Alephium and the ecosystem
              </p>
            </div>

            {/* Topic Item */}
            <div className="border-b border-border-grey dark:border-dark-charcoal pb-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold dark:text-white">
                  Development
                </h3>
                <span className="bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-white px-4 py-1 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              <p className="text-light-charcoal dark:text-lightgrey mb-3">
                Technical discussions for developers building on Alephium
              </p>
            </div>

            {/* Topic Item */}
            <div className="border-b border-border-grey dark:border-dark-charcoal pb-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold dark:text-white">
                  Support
                </h3>
                <span className="bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-white px-4 py-1 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              <p className="text-light-charcoal dark:text-lightgrey mb-3">
                Get help with wallets, transactions, and technical issues
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ForumPage;
