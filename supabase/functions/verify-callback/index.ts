import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const payloadSchema = z
  .object({
    user_id: z.string().uuid(),
    method: z.enum(['pass', 'telco', 'ipin']),
    is_female: z.boolean(),
    age: z.number().int().min(0).max(120),
    provider_ref: z.string().min(1).max(512),
  })
  .strict();

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (
    request.headers.get('x-verification-secret') !== Deno.env.get('VERIFICATION_WEBHOOK_SECRET')
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const verified = payload.is_female && payload.age >= 19;

    const { error } = await supabase.from('verifications').upsert({
      user_id: payload.user_id,
      is_verified: verified,
      is_female: payload.is_female,
      age: payload.age,
      method: payload.method,
      provider_ref: payload.provider_ref,
      verified_at: verified ? new Date().toISOString() : null,
    });
    if (error) throw error;

    if (verified) {
      await Promise.all([
        supabase.from('profiles').upsert({ user_id: payload.user_id, age: payload.age }),
        supabase
          .from('badges')
          .upsert(
            { user_id: payload.user_id, badge: 'female_safe' },
            { onConflict: 'user_id,badge' },
          ),
      ]);
    }

    return Response.json({ verified, blocked: !verified });
  } catch {
    return Response.json({ error: 'INVALID_VERIFICATION_PAYLOAD' }, { status: 400 });
  }
});
