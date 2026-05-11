import { Layout } from "../components/Layout/Layout";
import Link from "next/link";

export default function NotFound() {
  return (
    <Layout title="Page Not Found – Alephium Ecosystem">
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-7xl font-bold font-barlow text-alph-red mb-4">404</p>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2 font-barlow">
          Page not found
        </h1>
        <p className="text-sm text-light-charcoal dark:text-lightgrey mb-8 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3">
          <Link href="/">
            <a className="px-5 py-2 text-sm font-medium bg-alph-red text-white rounded-lg hover:opacity-90 transition-opacity">
              Go Home
            </a>
          </Link>
          <Link href="/explore">
            <a className="px-5 py-2 text-sm font-medium border border-border-grey dark:border-dark-charcoal text-black dark:text-white rounded-lg hover:bg-smoked-white dark:hover:bg-light-black transition-colors">
              Explore dApps
            </a>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
