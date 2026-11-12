/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix SWC binary issue on Windows
  experimental: {
    forceSwcTransforms: false,
  },
  // EVOLVE-ONLY MODE: the public site is just the Evolve page for now.
  // The other pages are parked in src/app/_archive (see EVOLVE_ONLY_MODE.md to bring them back).
  async redirects() {
    return ["/", "/about", "/beautiful-today", "/contact", "/events", "/give", "/sermons"].map((source) => ({
      source,
      destination: "/evolve",
      permanent: false,
    }));
  },
};

module.exports = nextConfig;
