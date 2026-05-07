import type { NextConfig } from "next";

// basePath is read from BASE_PATH (matches the ecod_frontpage_2026
// production convention on sangala). Falls back to
// NEXT_PUBLIC_BASE_PATH for compatibility with the leda dev convention.
// Empty/'/' ⇒ no basePath; Next.js requires the value to start with '/'.
const rawBasePath = process.env.BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const basePath = rawBasePath.length > 0 && rawBasePath !== '/' ? rawBasePath : undefined;

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg'],
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath ?? '' },
};

export default nextConfig;
