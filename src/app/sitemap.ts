import type { MetadataRoute } from 'next';
import { HGROUP_HIGHLIGHTS } from '@/lib/paperData';

// The deployed canonical URL. Override via NEXT_PUBLIC_SITE_URL once the
// hosting decision (`tricyp.swmed.edu` vs `prodata.swmed.edu/tricyp`,
// per spec "Open questions") is settled.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tricyp.swmed.edu';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: '/',              changeFrequency: 'weekly',  priority: 1.0 },
      { url: '/about',         changeFrequency: 'monthly', priority: 0.7 },
      { url: '/benchmark',     changeFrequency: 'monthly', priority: 0.7 },
      { url: '/af-geometric',  changeFrequency: 'monthly', priority: 0.6 },
      { url: '/h-group',       changeFrequency: 'weekly',  priority: 0.8 },
      { url: '/family',        changeFrequency: 'weekly',  priority: 0.8 },
      { url: '/downloads',     changeFrequency: 'daily',   priority: 0.9 },
      { url: '/paper',         changeFrequency: 'monthly', priority: 0.7 },
    ] as const
  ).map((entry) => ({
    url: `${BASE_URL}${entry.url}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  // Highlighted H-group detail pages are stable enough to surface in the
  // sitemap; the per-domain and per-family detail pages are crawler-discoverable
  // through the family browser and don't need explicit listing.
  const highlightRoutes: MetadataRoute.Sitemap = Object.values(HGROUP_HIGHLIGHTS).map((h) => ({
    url: `${BASE_URL}/h-group/${encodeURIComponent(h.hGroupId)}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...highlightRoutes];
}
