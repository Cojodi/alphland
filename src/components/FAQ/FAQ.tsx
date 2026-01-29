import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

const faqData: FAQItem[] = [
  {
    question: "What is the Alephium Ecosystem?",
    answer:
      "The Alephium Ecosystem is a discovery hub dedicated to dApps, tools, and services built on Alephium. It helps users explore the growing Alephium ecosystem by showcasing projects across different categories, making it easier to find and understand what's being built on the network.",
  },
  {
    question: "Why did you launch Alphland?",
    answer:
      "As the Alephium ecosystem grows, it becomes harder for users to know where to start: Which wallet should I use? Where can I trade? What DeFi or NFT projects exist on Alephium? Alphland was created to centralize this information in one place, offering a clear and curated overview of the most relevant dApps and tools, for both newcomers and more advanced users.",
  },
  {
    question: "Is Alphland free to use?",
    answer: "Yes. Alphland is completely free to use for everyone.",
  },
  {
    question: "How is the project maintained?",
    answer:
      "Alphland is maintained as part of the broader Alephium core team efforts, with the goal of improving discovery, visibility, and adoption of projects building on Alephium.",
  },
  {
    question: "How can I add my dApp to the Alephium Ecosystem?",
    answer: (
      <>
        To add a dApp, simply click on{" "}
        <strong>&ldquo;Add your dApp&rdquo;</strong> in the top-right corner of
        the page and fill in the required information. Once submitted, the
        project will be reviewed before being listed.
      </>
    ),
  },
  {
    question: "How can I update or correct information about a listed project?",
    answer: (
      <>
        If you need to update or correct information about an existing project,
        you can use the <strong>&ldquo;Add your dApp&rdquo;</strong> flow to
        submit updated details, or reach out to the Alephium team at{" "}
        <a
          href="mailto:ecosystem@alephium.org"
          className="text-orange hover:underline"
        >
          ecosystem@alephium.org
        </a>
      </>
    ),
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="hidden lg:block pt-8">
      <h3 className="font-semibold text-xl leading-none pb-4 lg:text-[22px] lg:font-bold">
        FAQ
      </h3>
      <div className="space-y-2">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-white/10 shadow-box-image-shadow rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between py-4 px-4 text-left cursor-pointer"
            >
              <span className="font-semibold text-sm text-black dark:text-white pr-2">
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-light-charcoal dark:text-clay flex-shrink-0 transition-transform duration-200 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                openIndex === index ? "max-h-96" : "max-h-0"
              }`}
            >
              <div className="px-4 pb-4 text-sm text-light-charcoal dark:text-clay leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
