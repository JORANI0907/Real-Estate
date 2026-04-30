'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/auction');
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error('이메일을 먼저 입력하세요');
      return;
    }
    setMagicLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
      });
      if (error) throw error;
      toast.success('이메일을 확인하세요! 링크가 발송되었습니다.');
    } catch (err: unknown) {
      toast.error((err as Error).message || '발송 실패');
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">REIA</h1>
          <p className="text-sm text-muted-foreground">부동산 분석 플랫폼</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">이메일</label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={magicLoading}>
          {magicLoading ? '발송 중...' : '매직링크로 로그인 (이메일)'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
