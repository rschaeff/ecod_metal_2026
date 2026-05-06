// Privacy-respecting analytics: emits a Plausible script tag when the
// NEXT_PUBLIC_PLAUSIBLE_DOMAIN env var is set, and renders nothing otherwise.
// No cookies; no personal-data collection. Set NEXT_PUBLIC_PLAUSIBLE_SRC to
// override the default community-edition CDN URL when self-hosting.

import Script from 'next/script';

export default function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.js';

  return (
    <Script
      strategy="afterInteractive"
      defer
      data-domain={domain}
      src={src}
    />
  );
}
