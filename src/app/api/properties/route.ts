import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const riskLevel = searchParams.get('riskLevel');
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  const failCountMin = searchParams.get('failCountMin');
  const propertyType = searchParams.get('propertyType');
  const bidDateFrom = searchParams.get('bidDateFrom');
  const bidDateTo = searchParams.get('bidDateTo');
  const searchKeyword = searchParams.get('searchKeyword');
  const sortBy = searchParams.get('sortBy') ?? 'bid_date';
  const sortOrder = searchParams.get('sortOrder') === 'asc';

  let query = supabase
    .from('v_auction_list')
    .select('*', { count: 'exact' });

  if (riskLevel) query = query.eq('risk_level', riskLevel);
  if (priceMin) query = query.gte('min_bid_amount', parseInt(priceMin));
  if (priceMax) query = query.lte('min_bid_amount', parseInt(priceMax));
  if (failCountMin) query = query.gte('fail_count', parseInt(failCountMin));
  if (propertyType) query = query.eq('property_type', propertyType);
  if (bidDateFrom) query = query.gte('bid_date', bidDateFrom);
  if (bidDateTo) query = query.lte('bid_date', bidDateTo);
  if (searchKeyword) query = query.ilike('address', `%${searchKeyword}%`);

  const sortColumn =
    sortBy === 'minBidAmount' ? 'min_bid_amount' :
    sortBy === 'failCount' ? 'fail_count' :
    sortBy === 'crawledAt' ? 'crawled_at' :
    'bid_date';

  query = query.order(sortColumn, { ascending: sortOrder });
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalPages = Math.ceil((count ?? 0) / limit);
  return NextResponse.json({ data, meta: { total: count ?? 0, page, limit, totalPages } });
}
