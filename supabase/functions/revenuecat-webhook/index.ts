import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const eventSchema = z.object({
  event: z.object({
    type: z.enum([
      'INITIAL_PURCHASE',
      'RENEWAL',
      'CANCELLATION',
      'EXPIRATION',
      'BILLING_ISSUE',
      'UNCANCELLATION',
      'PRODUCT_CHANGE',
    ]),
    app_user_id: z.string().uuid(),
    entitlement_ids: z.array(z.string()).default([]),
    store: z.string().optional(),
    purchased_at_ms: z.number().optional(),
    expiration_at_ms: z.number().nullable().optional(),
  }),
});

function mapPlan(entitlements: string[]) {
  if (entitlements.includes('premium')) return 'premium';
  if (entitlements.includes('plus')) return 'plus';
  return 'free';
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (
    request.headers.get('authorization') !== `Bearer ${Deno.env.get('REVENUECAT_WEBHOOK_SECRET')}`
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { event } = eventSchema.parse(await request.json());
    const expired = event.type === 'EXPIRATION';
    const status =
      event.type === 'BILLING_ISSUE'
        ? 'grace'
        : expired
          ? 'expired'
          : event.type === 'CANCELLATION'
            ? 'canceled'
            : 'active';
    const plan = expired ? 'free' : mapPlan(event.entitlement_ids);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: event.app_user_id,
      plan,
      status,
      rc_customer_id: event.app_user_id,
      store: event.store ?? null,
      started_at: event.purchased_at_ms ? new Date(event.purchased_at_ms).toISOString() : null,
      expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: 'INVALID_REVENUECAT_EVENT' }, { status: 400 });
  }
});
