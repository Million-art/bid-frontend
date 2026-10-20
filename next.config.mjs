import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

const dir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Parent folder has a lockfile, so Next otherwise treats that as the workspace
  // root and Turbopack cannot resolve nested Sentry packages.
  outputFileTracingRoot: dir,
  turbopack: {
    root: dir,
  },
  transpilePackages: [
    "@sentry/nextjs",
    "@sentry/react",
    "@sentry/browser",
    "@sentry/core",
  ],
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
