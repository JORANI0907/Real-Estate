import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SideNav } from '@/components/layout/side-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex flex-1">
        <SideNav className="hidden md:flex w-56 shrink-0 border-r" />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav className="md:hidden" />
    </div>
  );
}
