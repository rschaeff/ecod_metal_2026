import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Cysteine Classification Browser',
    template: '%s | CysBrowser',
  },
  description:
    'Browse cysteine residue classifications (disulfide, metal-binding, unclassified) across ECOD F70 representative protein domains.',
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
      </body>
    </html>
  );
}
