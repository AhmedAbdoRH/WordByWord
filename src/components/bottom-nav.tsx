
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpenCheck, ListX } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from './auth-provider';

export const BottomNav = () => {
  const pathname = usePathname();
  const { user } = useAuth(); // Get user state

  // Don't render the nav if the user is not logged in
  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'الإدخال', icon: Home },
    // For now, review is a tab on the home page. Linking to '/' is sufficient.
    // If Review becomes its own page, update href to '/review'
    { href: '/', label: 'المراجعة', icon: BookOpenCheck },
    { href: '/hard-words', label: 'الصعبة', icon: ListX },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex justify-around items-center z-50 shadow-md">
      {navItems.map((item) => {
        // Special handling for review tab link - active only if on '/'
        // If Review becomes its own page, use `pathname === item.href` like others
        const isActive = item.label === 'المراجعة' ? pathname === '/' : pathname === item.href;

        return (
          <Link key={item.label} href={item.href} passHref legacyBehavior>
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center h-full px-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
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
