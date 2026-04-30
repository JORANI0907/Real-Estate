'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gavel, Heart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/auction', icon: Gavel, label: '경매 매물' },
  { href: '/favorites', icon: Heart, label: '즐겨찾기' },
  { href: '/settings', icon: Settings, label: '설정' },
];

interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex flex-col gap-1 p-4', className)}>
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        메뉴
      </p>
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
