import type { NextConfig } from "next";

// basePath is wired through NEXT_PUBLIC_BASE_PATH so the same source
// can serve at the site root in dev and under /tricyp in production
// (Apache reverse-proxies /tricyp → http://localhost:3003/tricyp,
// path-preserving, so Next.js must produce /tricyp/_next/* etc.).
// Empty string ⇒ no basePath (Next.js validates that '/' is invalid;
// the env-driven value must start with '/' or be omitted).
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const basePath = rawBasePath.length > 0 && rawBasePath !== '/' ? rawBasePath : undefined;

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg'],
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
