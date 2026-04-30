import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: property, error } = await supabase
    .from('properties')
    .select('*, legal_analysis(*)')
    .eq('id', id)
    .single();

  if (error || !property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: fav } = await supabase
    .from('favorites')
    .select('user_id')
    .eq('property_id', id)
    .eq('user_id', user.id)
    .single();

  const legalAnalysis = Array.isArray(property.legal_analysis)
    ? property.legal_analysis[0] ?? null
    : property.legal_analysis ?? null;

  return NextResponse.json({
    property: { ...property, legal_analysis: undefined },
    legalAnalysis,
    isFavorite: !!fav,
  });
}
