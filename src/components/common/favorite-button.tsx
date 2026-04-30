'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  propertyId: string;
  initialState?: boolean;
  className?: string;
}

export function FavoriteButton({ propertyId, initialState = false, className }: FavoriteButtonProps) {
  const [isFav, setIsFav] = useState(initialState);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const prev = isFav;
    setIsFav(!isFav);
    setLoading(true);

    try {
      if (!prev) {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId }),
        });
        if (!res.ok) throw new Error('추가 실패');
        toast.success('즐겨찾기에 추가했습니다');
      } else {
        const res = await fetch(`/api/favorites/${propertyId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('삭제 실패');
        toast.success('즐겨찾기에서 제거했습니다');
      }
    } catch {
      setIsFav(prev);
      toast.error('처리에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={loading}
      className={cn('h-8 w-8', className)}
      aria-label={isFav ? '즐겨찾기 제거' : '즐겨찾기 추가'}
    >
      <Heart
        className={cn('h-4 w-4 transition-colors', isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground')}
      />
    </Button>
  );
}
