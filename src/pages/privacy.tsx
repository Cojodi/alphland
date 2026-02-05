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
          alph.land Privacy Policy
        </h1>

        <p className="text-sm text-light-charcoal dark:text-lightgrey mb-4">
          <strong>Last updated: 04/02/2026</strong>
        </p>

        <p className="my-4">
          This privacy policy (&quot;Privacy Policy&quot;) applies to{" "}
          <strong>alph.land</strong> (&quot;Alphland&quot;), operated by{" "}
          <strong>PANDA SOFTWARE SA</strong>, a company limited by shares
          established under the laws of Switzerland and domiciled in Neuchâtel,
          Switzerland (&quot;we&quot;, &quot;us&quot;, or the
          &quot;Company&quot;).
        </p>

        <p className="my-4">
          The Company acts as the data controller with respect to personal data
          processed through Alphland. We are committed to protecting and
          respecting your privacy.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">1. Introduction</h3>

        <p className="my-4">
          This Privacy Policy explains who we are, how and why we process
          personal data collected through your use of Alphland, and the rights
          you have in relation to your personal data.
        </p>

        <p className="my-4">
          Whenever we process personal data, we do so in accordance with
          applicable data protection laws, including the Swiss Federal Act on
          Data Protection (FADP) and, where applicable, the EU General Data
          Protection Regulation (GDPR).
        </p>

        <p className="my-4">
          This Privacy Policy should be read together with any other privacy
          notices we may provide from time to time and supplements our Terms of
          Use. If you do not agree with this Privacy Policy, please stop using
          Alphland.
        </p>

        <p className="my-4">
          Alphland is not intended for use by individuals under the age of 18.
          We do not knowingly collect personal data relating to minors.
        </p>

        <p className="my-4">
          We may update this Privacy Policy from time to time to reflect changes
          to our practices or legal obligations. The updated version will be
          published on the Site.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">
          2. What Information We Collect
        </h3>

        <h4 className="text-[20px] font-bold mt-[20px]">
          What is personal data?
        </h4>

        <p className="my-4">
          &quot;Personal data&quot; means any information relating to an
          identified or identifiable individual, such as contact details or
          online identifiers.
        </p>

        <h4 className="text-[20px] font-bold mt-[20px]">
          Information we may collect
        </h4>

        <p className="my-4">
          When you use Alphland, we may collect limited personal data,
          including:
        </p>

        <ul className="list-disc pl-8 my-4">
          <li className="mb-2">IP address</li>
          <li className="mb-2">
            Email address (if you contact us or voluntarily provide it)
          </li>
          <li className="mb-2">Feedback or messages you submit</li>
        </ul>

        <p className="my-4">
          We may also collect technical and usage data through cookies or
          similar technologies, such as:
        </p>

        <ul className="list-disc pl-8 my-4">
          <li className="mb-2">
            device, browser, or operating system information
          </li>
          <li className="mb-2">time zone and approximate location</li>
          <li className="mb-2">
            interactions with the Site (clicks, scrolling, navigation)
          </li>
          <li className="mb-2">pages visited and time spent on the Site</li>
          <li className="mb-2">performance and error data</li>
        </ul>

        <p className="my-4">
          This information is used for security, analytics, and improvement
          purposes.
        </p>

        <p className="my-4">
          You can manage cookies and tracking preferences through your device or
          browser settings. Disabling certain features may affect the
          functionality of Alphland.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">
          3. How and Why We Use Your Information
        </h3>

        <h4 className="text-[20px] font-bold mt-[20px]">
          Legal basis for processing
        </h4>

        <p className="my-4">
          We process personal data only where permitted by law, including:
        </p>

        <ul className="list-disc pl-8 my-4">
          <li className="mb-2">where you have given consent</li>
          <li className="mb-2">
            where processing is necessary for legitimate interests (such as
            operating and improving Alphland), provided your rights do not
            override those interests
          </li>
          <li className="mb-2">
            where required to comply with legal or regulatory obligations
          </li>
        </ul>

        <h4 className="text-[20px] font-bold mt-[20px]">Use of data</h4>

        <p className="my-4">We may use your personal data to:</p>

        <ul className="list-disc pl-8 my-4">
          <li className="mb-2">operate, secure, and maintain Alphland</li>
          <li className="mb-2">respond to inquiries or feedback</li>
          <li className="mb-2">improve user experience and performance</li>
          <li className="mb-2">comply with legal obligations</li>
        </ul>

        <p className="my-4">
          We do <strong>not</strong> use Alphland for targeted advertising or
          profiling.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">
          4. Sharing of Information
        </h3>

        <p className="my-4">We do not sell your personal data.</p>

        <p className="my-4">
          We may share limited personal data with trusted third-party service
          providers acting on our behalf, strictly for operational purposes
          (such as hosting, analytics, or email delivery). These providers are
          contractually required to protect your data and process it only
          according to our instructions.
        </p>

        <p className="my-4">Examples of service providers may include:</p>

        <ul className="list-disc pl-8 my-4">
          <li className="mb-2">infrastructure and hosting providers</li>
          <li className="mb-2">analytics providers</li>
          <li className="mb-2">email communication tools</li>
        </ul>

        <p className="my-4">
          We may also disclose personal data if required to do so by law,
          regulation, or court order, or in connection with a corporate
          transaction (such as a merger or acquisition).
        </p>

        <p className="my-4">
          Third-party services linked from Alphland operate independently and
          are governed by their own privacy policies.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">5. Data Retention</h3>
        <p className="my-4">
          We retain personal data only for as long as necessary to fulfill the
          purposes for which it was collected, including legal, regulatory, or
          reporting requirements.
        </p>
        <p className="my-4">
          In some cases, data may be anonymized and used for statistical or
          research purposes, in which case it may be retained indefinitely.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">6. Security</h3>
        <p className="my-4">
          We implement appropriate technical and organizational security
          measures to protect personal data against unauthorized access, loss,
          alteration, or disclosure.
        </p>
        <p className="my-4">
          Access to personal data is restricted to authorized personnel and
          service providers who have a legitimate need to access it and are
          subject to confidentiality obligations.
        </p>
        <p className="my-4">
          Despite our efforts, no system can be guaranteed to be fully secure.
          Use of Alphland is at your own risk.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">
          7. International Data Transfers
        </h3>
        <p className="my-4">
          Some of our service providers may be located outside Switzerland or
          the European Economic Area.
        </p>
        <p className="my-4">
          Where personal data is transferred internationally, we ensure
          appropriate safeguards are in place, such as adequacy decisions or
          standard contractual clauses, to protect your rights.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">8. Your Rights</h3>
        <p className="my-4">
          Depending on your jurisdiction, you may have the right to:
        </p>

        <ul className="list-disc pl-8 my-4">
          <li className="mb-2">access your personal data</li>
          <li className="mb-2">request correction of inaccurate data</li>
          <li className="mb-2">request deletion of your personal data</li>
          <li className="mb-2">restrict or object to certain processing</li>
          <li className="mb-2">
            withdraw consent where processing is based on consent
          </li>
          <li className="mb-2">request data portability</li>
        </ul>

        <p className="my-4">
          Please note that we cannot modify or delete data recorded on public
          blockchains, as such data is immutable and not controlled by us.
        </p>

        <p className="my-4">
          To exercise your rights, please contact us using the details below. We
          may need to verify your identity before responding.
        </p>

        <h3 className="text-[24px] font-bold mt-[32px]">9. Contact Details</h3>
        <p className="my-4">
          If you have any questions about this Privacy Policy or wish to
          exercise your rights, please contact us at:{" "}
          <a href="mailto:ecosystem@alephium.org" className="text-orange">
            ecosystem@alephium.org
          </a>
        </p>
        <p className="my-4">
          You may also have the right to lodge a complaint with the competent
          data protection authority in your jurisdiction. We encourage you to
          contact us first so we can address your concerns directly.
        </p>
      </div>
    </Layout>
  );
};

export default Home;
