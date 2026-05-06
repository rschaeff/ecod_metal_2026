import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import PlausibleScript from '@/components/analytics/PlausibleScript';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tricyp.swmed.edu';
const SITE_TITLE = 'TriCyp — Three-state cysteine classification';
const SITE_DESCRIPTION =
  'TriCyp: deposition site for three-state cysteine classification (disulfide, metal-binding, free thiol) across ~700,000 ECOD F70 representative protein domains.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | TriCyp',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'TriCyp',
  keywords: [
    'cysteine classification',
    'disulfide',
    'metal-binding',
    'ESM2',
    'protein language model',
    'ECOD',
    'F70',
    'AlphaFold',
    'structural bioinformatics',
  ],
  authors: [{ name: 'Yuan, Durham, Cong, Schaeffer' }],
  openGraph: {
    type: 'website',
    siteName: 'TriCyp',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ThemeProvider>
        <PlausibleScript />
      </body>
    </html>
  );
}
