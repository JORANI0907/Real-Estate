'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
      setDone(true);
    } catch (err: unknown) {
      toast.error((err as Error).message || '회원가입에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl border bg-background p-8 shadow-sm text-center">
          <Building2 className="mx-auto h-8 w-8 text-primary" />
          <h2 className="text-xl font-bold">이메일을 확인하세요</h2>
          <p className="text-sm text-muted-foreground">
            <strong>{email}</strong>으로 인증 링크를 보냈습니다.
            <br />
            링크를 클릭하면 로그인됩니다.
          </p>
          <Link href="/login" className="text-sm text-primary hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="text-sm text-muted-foreground">REIA 가족 계정 만들기</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">이름</label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">이메일</label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">비밀번호 (8자 이상)</label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
