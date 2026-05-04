import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('crawler_config')
    .select('auto_crawl_enabled, make_auto_scenario_id')
    .eq('id', 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { enabled } = await request.json() as { enabled: boolean };

  const { error } = await supabase
    .from('crawler_config')
    .update({ auto_crawl_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, auto_crawl_enabled: enabled });
}
