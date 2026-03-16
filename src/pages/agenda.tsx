import Layout from "../components/Layout";

const AgendaPage = () => {
  return (
    <Layout
      title="Agenda"
      description="Upcoming events and roadmap for the Alephium ecosystem"
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32">
        {/* Hero Section */}
        <section className="text-center py-12 lg:py-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 dark:text-white">
            Agenda
          </h1>
          <p className="text-xl text-light-charcoal dark:text-lightgrey max-w-2xl mx-auto">
            Stay updated with upcoming events, milestones, and roadmap
          </p>
        </section>

        {/* Upcoming Events */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 dark:text-white">
            Upcoming Events
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Event Card */}
            <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold dark:text-white mb-2">
                    Community Call
                  </h3>
                  <p className="text-light-charcoal dark:text-lightgrey">
                    Monthly community call to discuss updates and answer
                    questions
                  </p>
                </div>
                <span className="bg-orange text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4">
                  Recurring
                </span>
              </div>
              <div className="text-sm text-light-charcoal dark:text-lightgrey">
                <p>Every first Tuesday of the month</p>
              </div>
            </div>

            {/* Event Card */}
            <div className="bg-white dark:bg-hero-dark rounded-lg p-8 shadow-box-image-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold dark:text-white mb-2">
                    Developer Workshop
                  </h3>
                  <p className="text-light-charcoal dark:text-lightgrey">
                    Learn to build dApps on Alephium with hands-on tutorials
                  </p>
                </div>
                <span className="bg-accessible-green text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4">
                  Upcoming
                </span>
              </div>
              <div className="text-sm text-light-charcoal dark:text-lightgrey">
                <p>Check Discord for announcements</p>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="bg-white dark:bg-hero-dark rounded-lg p-8 lg:p-12">
          <h2 className="text-3xl font-bold mb-8 dark:text-white">Roadmap</h2>

          <div className="space-y-8">
            {/* Roadmap Item */}
            <div className="relative pl-8 border-l-2 border-orange">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-orange rounded-full"></div>
              <div className="mb-1">
                <span className="inline-block bg-orange text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                  Current
                </span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white mb-2">
                Ecosystem Growth
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                Expanding the dApp ecosystem with new projects, partnerships,
                and community initiatives
              </p>
            </div>

            {/* Roadmap Item */}
            <div className="relative pl-8 border-l-2 border-border-grey dark:border-dark-charcoal">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-smoked-white dark:bg-dark-charcoal rounded-full"></div>
              <div className="mb-1">
                <span className="inline-block bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                  Q2 2025
                </span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white mb-2">
                Enhanced Features
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                New platform features including improved search, filtering, and
                discovery tools
              </p>
            </div>

            {/* Roadmap Item */}
            <div className="relative pl-8 border-l-2 border-border-grey dark:border-dark-charcoal">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-smoked-white dark:bg-dark-charcoal rounded-full"></div>
              <div className="mb-1">
                <span className="inline-block bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                  Future
                </span>
              </div>
              <h3 className="text-xl font-semibold dark:text-white mb-2">
                Community Governance
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                Implementing community-driven governance for platform decisions
                and curation
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AgendaPage;
