"use client";

import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  variable: '--font-cairo',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHardWordsPage = pathname === '/hard-words';

  return (
    <html lang="ar" dir="rtl">
      <head>
      </head>
      <body className={`font-cairo antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />

        </AuthProvider>
      </body>
    </html>
  );
}


