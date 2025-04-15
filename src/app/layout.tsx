import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

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
  return (
    <html lang="ar" dir="rtl">
      <body className={`font-cairo antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

