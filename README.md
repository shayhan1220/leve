# Léve

Women-only relationship and community app built with Expo and Supabase.

## Setup

1. Copy `.env.example` to `.env` and set the public client keys.
2. Apply `supabase/migrations` to a Supabase project.
3. Configure Edge Function secrets:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VERIFICATION_WEBHOOK_SECRET`
   - `REVENUECAT_WEBHOOK_SECRET`
4. Run `npm start`.

Raw resident registration numbers and ID-card images must never be sent to this project.
