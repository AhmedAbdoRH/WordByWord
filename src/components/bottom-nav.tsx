
"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { Home, BookOpenCheck, ListX } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from './auth-provider';

export const BottomNav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Get search params
  const { user } = useAuth(); // Get user state

  // Don't render the nav if the user is not logged in
  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'الإدخال', icon: Home, tab: 'add' }, // Link to home page, tab 'add'
    { href: '/', label: 'المراجعة', icon: BookOpenCheck, tab: 'review' }, // Link to home page, tab 'review'
    { href: '/hard-words', label: 'الصعبة', icon: ListX },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex justify-around items-center z-50 shadow-md">
      {navItems.map((item) => {
        const currentTab = searchParams.get('tab');
        // Check if the current path matches and, if applicable, the tab matches
        const isActive = item.href === '/'
          ? pathname === '/' && (item.tab === (currentTab ?? 'add')) // Default to 'add' tab if none is present
          : pathname === item.href;

        // Construct href with query param if it's a tabbed link on the homepage
        const hrefWithTab = item.href === '/' && item.tab ? `${item.href}?tab=${item.tab}` : item.href;

        return (
          <Link key={item.label} href={hrefWithTab} passHref legacyBehavior>
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center h-full px-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? 'page' : undefined} // Add aria-current for accessibility
            >
              <item.icon className="w-5 h-5 mb-1" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
};
