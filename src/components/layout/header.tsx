'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
  className?: string;
}

export function Header({ user, className }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur ${className ?? ''}`}>
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          <span>REIA</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="로그아웃">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
