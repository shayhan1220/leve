import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/store';
import { configurePurchases } from '@/lib/revenuecat/client';
import type { Plan } from '@/lib/supabase/database.types';
import { supabase } from '@/lib/supabase/client';

export function usePlan() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user.id);

  useEffect(() => {
    if (!userId) return;
    configurePurchases(userId);
    const channel = supabase
      .channel(`subscription:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        () => void queryClient.invalidateQueries({ queryKey: ['current-plan'] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return useQuery({
    queryKey: ['current-plan'],
    queryFn: async (): Promise<Plan> => {
      const { data, error } = await supabase.rpc('current_plan');
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: Boolean(userId),
  });
}

export function hasPlan(plan: Plan | undefined, minimum: Plan) {
  const rank: Record<Plan, number> = { free: 0, plus: 1, premium: 2 };
  return plan ? rank[plan] >= rank[minimum] : false;
}
