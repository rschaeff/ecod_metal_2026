import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tricyp.swmed.edu';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Skip the API surface (no SEO value, drives the rate limiter for
        // no reason) and the iframe viewer harness (it's a static asset
        // that only makes sense inside an iframe).
        disallow: ['/api/', '/viewer/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
