import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('favorites')
    .select('property_id')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const propertyIds = data.map((f) => f.property_id);
  if (propertyIds.length === 0) return NextResponse.json({ data: [] });

  const { data: properties, error: propError } = await supabase
    .from('v_auction_list')
    .select('*')
    .in('id', propertyIds);

  if (propError) return NextResponse.json({ error: propError.message }, { status: 500 });
  return NextResponse.json({ data: properties ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { propertyId, note, folder } = await request.json();
  if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 });

  const { error } = await supabase
    .from('favorites')
    .upsert({ user_id: user.id, property_id: propertyId, note, folder });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
