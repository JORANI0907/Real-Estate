import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, Calendar, Info, BookOpen, ChevronRight } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="container mx-auto max-w-lg py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      {/* 계정 정보 */}
      <div className="rounded-xl border bg-card p-4 space-y-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">계정 정보</p>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs text-muted-foreground">이메일 계정</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t pt-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{user.created_at?.split('T')[0] ?? '-'}</p>
            <p className="text-xs text-muted-foreground">가입일</p>
          </div>
        </div>
      </div>

      {/* 서비스 안내 */}
      <Link
        href="/guide"
        className="flex items-center justify-between rounded-xl border bg-card p-4 mb-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">서비스 안내</p>
            <p className="text-xs text-muted-foreground">기능 설명 및 이용 가이드</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* 앱 정보 */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">앱 정보</p>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">버전</span>
          <span className="font-medium">Phase 1.0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">데이터</span>
          <span className="font-medium">법원경매정보</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">업데이트</span>
          <span className="font-medium">매일 오전 8시</span>
        </div>
      </div>
    </div>
  );
}
