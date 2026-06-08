import { useQuery } from '@tanstack/react-query';

import type { Plan } from '@/lib/supabase/database.types';
import { supabase } from '@/lib/supabase/client';

export function usePlan() {
  return useQuery({
    queryKey: ['current-plan'],
    queryFn: async (): Promise<Plan> => {
      const { data, error } = await supabase.rpc('current_plan');
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export function hasPlan(plan: Plan | undefined, minimum: Plan) {
  const rank: Record<Plan, number> = { free: 0, plus: 1, premium: 2 };
  return plan ? rank[plan] >= rank[minimum] : false;
}
