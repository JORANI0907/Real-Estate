'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Gavel, Heart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/guide', icon: BookOpen, label: '가이드' },
  { href: '/auction', icon: Gavel, label: '경매' },
  { href: '/favorites', icon: Heart, label: '즐겨찾기' },
  { href: '/settings', icon: Settings, label: '설정' },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 z-50 border-t bg-background', className)}>
      <div className="flex h-16 items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-current')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
