import withPWA from "next-pwa";

let userConfig = undefined;
try {
  userConfig = await import("./v0-user-next.config");
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://xvengdlpiyjatjttquqk.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZW5nZGxwaXlqYXRqdHRxdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzQ0MDYsImV4cCI6MjA1NTY1MDQwNn0.DZz4Z4tW52UOmEFN-CXoqnEm2V6HSdylyM8y_QCcpx4",
    MAIL_TM_API_URL: process.env.MAIL_TM_API_URL || "https://api.mail.tm",
  },
};

mergeConfig(nextConfig, userConfig);

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return;
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === "object" &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
