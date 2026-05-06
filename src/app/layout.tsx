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

export const metadata: Metadata = {
  title: {
    default: 'TriCyp — Three-state cysteine classification',
    template: '%s | TriCyp',
  },
  description:
    'TriCyp: deposition site for three-state cysteine classification (disulfide, metal-binding, free thiol) across ~700,000 ECOD F70 representative protein domains.',
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
