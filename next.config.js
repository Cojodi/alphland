/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: "https://api.alph.land",
  },
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule) => rule.test && rule.test.test(".svg")
    );
    fileLoaderRule.exclude = /\.icon\.svg$/;
    config.module.rules.push({
      test: /\.icon\.svg$/,
      loader: require.resolve("@svgr/webpack"),
    });
    config.resolve.fallback = {
      // if you miss it, all the other options in fallback, specified
      // by next.js will be dropped.
      ...config.resolve.fallback,

      fs: false, // the solution
    };
    return config;
  },
  images: {
    domains: ["pbs.twimg.com", "mintsquare.sfo3.cdn.digitaloceanspaces.com"], // to load images
  },
  experimental: {
    scrollRestoration: true,
    images: { allowFutureImage: true },
  },
  async rewrites() {
    return [
      {
        source: "/x/js/script.js",
        destination: "https://plausible.io/js/script.js",
      },
      {
        source: "/x/api/event",
        destination: "https://plausible.io/api/event",
      },
    ];
  },
};

module.exports = nextConfig;
