
"use client";

import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { BottomNav } from '@/components/bottom-nav'; // Import BottomNav

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  variable: '--font-cairo',
});

// Removed metadata export as it's handled in src/app/metadata.ts now

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="ar" dir="rtl" className="dark"> {/* Ensure dark mode is applied */}
      <head>
        {/* Metadata is handled by Next.js via src/app/metadata.ts */}
      </head>
      <body className={`font-cairo antialiased bg-background text-foreground pb-16`}> {/* Add padding-bottom */}
        <AuthProvider>
          <main className="flex-grow"> {/* Added main tag for semantic structure */}
            {children}
          </main>
          <Toaster />
          <BottomNav /> {/* Add BottomNav here */}
        </AuthProvider>
      </body>
    </html>
  );
}
