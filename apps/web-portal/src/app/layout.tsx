import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Investment Platform - Client Portal',
  description: 'White-labeled investment management platform for financial advisors and institutions',
  keywords: 'investment management, portfolio management, financial advisory, wealth management',
  authors: [{ name: 'Investment Platform' }],
  robots: 'noindex, nofollow', // Private client portal
};

export const viewport = 'width=device-width, initial-scale=1';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}