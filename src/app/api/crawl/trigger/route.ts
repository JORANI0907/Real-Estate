import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: config } = await supabase
    .from('crawler_config')
    .select('make_manual_webhook_url')
    .eq('id', 1)
    .single();

  const webhookUrl = config?.make_manual_webhook_url;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Make 웹훅 URL이 설정되지 않았습니다. 크롤링 설정에서 Make 웹훅 URL을 입력해주세요.' },
      { status: 400 }
    );
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'manual',
      triggeredBy: user.email,
      triggeredAt: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Make 웹훅 호출 실패 (${res.status})` }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
