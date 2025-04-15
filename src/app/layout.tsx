"use client";

import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'VocabMaster Arabic',
  description: 'Learn Arabic Vocabulary',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHardWordsPage = pathname === '/hard-words';

  useEffect(() => {
    console.log('RootLayout useEffect triggered');
  }, []);

  return (
    <html lang="ar" dir="rtl">
      <head>
      </head>
      <body className={`font-cairo antialiased`}>
        <AuthProvider>
          {!isHardWordsPage && (
            <Link href="/hard-words" className="fixed top-4 left-4 bg-secondary text-secondary-foreground p-2 rounded-md z-50">
              عرض الكلمات الصعبة
            </Link>
          )}
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

