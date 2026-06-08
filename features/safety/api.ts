import { z } from 'zod';

import { supabase } from '@/lib/supabase/client';

export const reportSchema = z.object({
  target_user_id: z.string().uuid().nullable(),
  context: z.string().trim().min(1).max(100),
  reason: z.string().trim().min(1).max(100),
  detail: z.string().trim().max(2000).nullable().default(null),
});

export async function createReport(input: z.input<typeof reportSchema>, reporterId: string) {
  const payload = reportSchema.parse(input);
  const { error } = await supabase
    .from('reports')
    .insert({ ...payload, reporter_id: z.string().uuid().parse(reporterId) });
  if (error) throw error;
}

export async function blockUser(target: string) {
  const { error } = await supabase.rpc('block_user', {
    target: z.string().uuid().parse(target),
  });
  if (error) throw error;
}
