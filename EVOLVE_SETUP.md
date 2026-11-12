# Evolve: setup checklist

## 1. Fees (src/lib/evolve-config.ts)
Current fees (Naira, one payment covers all four days): Member 5,000 · Worker 10,000 · Satellite/Campus Pastor 20,000 · State Pastor 30,000.
Everyone (members included) is registered ONLY after their payment is confirmed.
Change them in `fees` and push to GitHub. You can also change the registration cut-off (`registrationClosesAt`).

## 2. Database
Run `supabase/migrations/20260701000001_evolve.sql` once (SQL Editor or `supabase db push`). It is the only Evolve migration.

## 3. Environment variables (Vercel / .env.local)
```
NEXT_PUBLIC_SITE_URL=https://your-site.org
SUPABASE_SERVICE_ROLE_KEY=...        # server only, never expose
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_RESTRICTED_KEY=...         # restricted key, scope: transactions = read only (verifies payments)
PAYSTACK_SECRET_KEY=sk_live_...      # server only, used to check webhook signatures
GMAIL_USER=yourchurch@gmail.com        # the Gmail that sends tickets + reminders
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   # 16-character Google App Password (not your normal password)
```
## 4. Paystack
- Create/verify your Paystack business account (use test keys first: pk_test / sk_test).
- In Paystack Dashboard > Settings > API & Webhooks, set the webhook URL to
  `https://your-site.org/api/evolve/paystack-webhook` (this rescues payments if someone closes the tab).

## 5. Emails and reminders (Gmail)
1. In the Gmail account: turn on 2-Step Verification, then create an **App Password** (Google Account > Security > 2-Step Verification > App passwords). Copy the 16 characters.
2. Put `GMAIL_USER` and `GMAIL_APP_PASSWORD` in Vercel (Settings > Environment Variables), set `NEXT_PUBLIC_SITE_URL` to your real address, then **redeploy**.
3. For reminders, set the same secrets in Supabase and deploy the function:
```
supabase secrets set GMAIL_USER=yourchurch@gmail.com GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx \
  EVOLVE_STARTS_AT=2026-11-19T08:00:00+01:00 \
  EVOLVE_VENUE="36 Abakaliki Street, beside Queens Suites, Awka, Anambra State" SITE_URL=https://your-site.org
supabase functions deploy evolve-reminders
```
4. Schedule it hourly (SQL editor, with `pg_cron` and `pg_net` enabled):
```sql
select cron.schedule('evolve-reminders', '0 * * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.functions.supabase.co/evolve-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>'));
$$);
```
Each registrant gets the 7-day, 1-day and 2-hour reminder once, by email. Gmail allows about 500 emails per day.

## 6. On the day
Staff area > **Evolve**: pick the day, scan tickets (or type the code). Unpaid tickets are refused, and a second scan on the same day shows "already checked in".
