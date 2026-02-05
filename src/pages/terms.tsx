import Layout from "../components/Layout";
import styled from "styled-components";

const StyledSection = styled.section`
  grid-template-areas:
    "list header"
    "list cards";
  grid-template-columns: minmax(300px, 340px) 1fr;
  grid-column-gap: 64px;

  .featured {
    grid-area: header;
  }

  .categories {
    grid-area: list;
  }
`;

const Home = () => {
  // todo
  return (
    <Layout>
      <div className="container p-16 lg:py-48 mx-auto max-w-screen-md">
        <h1 className="bg-black dark:bg-white text-white dark:text-black pl-4 pr-4 pt-1 pb-2 text-center text-[32px] font-bold leading-[38px] rounded-md mb-6">
          Alphland – Terms of Use
        </h1>

        <p className="text-sm text-light-charcoal dark:text-lightgrey mb-4">
          <strong>Last updated: 04/02/2026</strong>
        </p>

        <p>
          These Terms of Use (&quot;Terms&quot;) govern your access to and use
          of the website accessible at{" "}
          <a href="https://alph.land" className="text-orange hover:underline">
            https://alph.land
          </a>{" "}
          (the &quot;Site&quot;), operated by <strong>PANDA SOFTWARE SA</strong>
          , a company limited by shares established under the laws of
          Switzerland and domiciled in Neuchâtel, Switzerland
          (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;).
        </p>

        <p className="mt-4">
          Alphland is a community-driven product co-built by Alephium and its
          community, designed to provide informational access to decentralized
          applications and tools within the Alephium ecosystem.
        </p>

        <p className="mt-4">
          By accessing or using the Site, you agree to be bound by these Terms.
          If you do not agree, you must immediately cease all use of the Site.
        </p>

        <p className="mt-4">
          We reserve the right to modify these Terms at any time at our sole
          discretion. Changes will be effective upon publication on the Site.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">
          1. Availability of the Site
        </h3>
        <p>
          The Site is provided on an <strong>&quot;as is&quot;</strong> and{" "}
          <strong>&quot;as available&quot;</strong> basis.
        </p>
        <p className="mt-4">
          Access to the Site may be temporarily suspended or restricted due to
          maintenance, updates, technical issues, or factors beyond our control.
          We do not guarantee uninterrupted or error-free access and disclaim
          any liability for losses arising from the unavailability or
          malfunction of the Site, to the maximum extent permitted by law.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">
          2. Nature of the Service
        </h3>
        <p>
          Alphland is an <strong>informational and discovery platform</strong>.
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            The Site aggregates, lists, or links to decentralized applications
            (&quot;dApps&quot;), tools, and resources.
          </li>
          <li>
            The Company does{" "}
            <strong>not operate, control, maintain, or audit</strong> the listed
            dApps.
          </li>
          <li>
            The Company does <strong>not facilitate transactions</strong>, does
            not provide custody services, and does not have access to
            users&apos; funds, private keys, or wallets.
          </li>
        </ul>
        <p className="mt-4">
          Any interaction with third-party applications or blockchain protocols
          is performed{" "}
          <strong>entirely at your own risk and responsibility</strong>.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">
          3. No Financial, Legal or Investment Advice
        </h3>
        <p>
          All content made available on the Site is provided{" "}
          <strong>for informational purposes only</strong>.
        </p>
        <p className="mt-4">
          Nothing on the Site constitutes or should be construed as:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>financial advice,</li>
          <li>investment advice,</li>
          <li>legal advice,</li>
          <li>
            or a recommendation to buy, sell, trade, or hold crypto assets.
          </li>
        </ul>
        <p className="mt-4">
          Crypto assets are volatile and involve a high degree of risk. You are
          solely responsible for assessing the risks and seeking independent
          professional advice where appropriate.
        </p>
        <p className="mt-4">
          The Company shall not be liable for any loss of data, assets, or
          profits resulting from your use of or reliance on information
          available on the Site.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">
          4. Third-Party Services and dApps
        </h3>
        <p>
          The Site may provide links or access to third-party services,
          protocols, or applications (&quot;Third-Party Services&quot;).
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>These services are provided by independent third parties.</li>
          <li>
            Your use of Third-Party Services is governed solely by their own
            terms and conditions.
          </li>
          <li>
            The Company does not endorse, guarantee, or assume responsibility
            for any Third-Party Services.
          </li>
        </ul>
        <p className="mt-4">
          We shall not be liable for any damages arising out of or in connection
          with your use of Third-Party Services.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">
          5. Intellectual Property Rights
        </h3>
        <p>
          All intellectual property rights related to the Site, including but
          not limited to text, layout, logos, trademarks, and design elements,
          are owned by or licensed to the Company, unless otherwise stated.
        </p>
        <p className="mt-4">
          You may not reproduce, distribute, modify, or exploit any part of the
          Site without prior written consent, except as permitted by applicable
          law.
        </p>
        <p className="mt-4">
          Community contributions remain the property of their respective
          authors where applicable.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">
          6. Limitation of Liability
        </h3>
        <p>To the maximum extent permitted by applicable law:</p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            The Company shall only be liable for direct damages caused by intent
            or gross negligence.
          </li>
          <li>
            Any liability for indirect, incidental, or consequential damages,
            including loss of profit, loss of data, or loss of digital assets,
            is expressly excluded.
          </li>
        </ul>
        <p className="mt-4">The Company assumes no responsibility for:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>blockchain network operations,</li>
          <li>smart contracts,</li>
          <li>dApps,</li>
          <li>or user interactions with decentralized protocols.</li>
        </ul>

        <h3 className="text-[24px] font-bold mt-[24px]">
          7. Eligibility and Compliance
        </h3>
        <p>By using the Site, you represent that:</p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>you have the legal capacity to accept these Terms;</li>
          <li>
            your use of the Site is compliant with the laws of your
            jurisdiction;
          </li>
          <li>
            you are not subject to applicable sanctions or restrictions under
            Swiss, EU, US, or UN regulations.
          </li>
        </ul>
        <p className="mt-4">
          We reserve the right to restrict access to the Site based on legal or
          regulatory requirements.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">8. Personal Data</h3>
        <p>The Site does not require users to create an account.</p>
        <p className="mt-4">
          No personal data is knowingly collected, processed, or stored by the
          Company through the Site. Any analytics, if implemented, are
          anonymized and non-intrusive.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">
          9. Community-Driven Nature
        </h3>
        <p>Alphland has been co-built with the Alephium community.</p>
        <p className="mt-4">
          While we value community contributions and feedback, the Company
          retains final decision-making authority regarding the operation,
          evolution, and moderation of the Site.
        </p>

        <h3 className="text-[24px] font-bold mt-[24px]">
          10. Governing Law and Jurisdiction
        </h3>
        <p>
          These Terms shall be governed by and construed in accordance with the{" "}
          <strong>substantive laws of Switzerland</strong>, excluding
          conflict-of-law rules.
        </p>
        <p className="mt-4">
          Any dispute arising out of or in connection with these Terms shall be
          subject to the{" "}
          <strong>
            exclusive jurisdiction of the competent courts of Zurich,
            Switzerland
          </strong>
          .
        </p>
      </div>
    </Layout>
  );
};

export default Home;
