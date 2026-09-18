# Deploying the Soma Insurance site (Vercel + Resend)

This folder is a ready-to-deploy copy of the site: a static homepage
(`index.html`) plus one serverless function (`api/notify.js`) that sends the
booking notification email silently — no customer click required.

## 1. Set up Resend (free)

1. Go to resend.com and create a free account.
2. In the dashboard, go to **Domains → Add Domain** and enter your domain
   (the one you already purchased).
3. Resend will show you a few DNS records (TXT/MX/CNAME for SPF, DKIM, etc).
   Add those in your domain registrar's DNS settings. This can take a few
   minutes to a few hours to verify.
4. Once the domain shows "Verified" in Resend, go to **API Keys → Create API
   Key**. Copy the key (starts with `re_`) — you'll only see it once.

## 2. Fill in the sending address

Open `api/notify.js` and replace the placeholder:

```js
const FROM_ADDRESS = 'Soma Insurance Website <bookings@YOURDOMAIN.com>';
```

Use an address on the domain you just verified in Resend — for example
`bookings@somainsurancegroup.com`. It can't be a gmail.com/yahoo.com address.

## 3. Deploy to Vercel (free)

1. Push this folder to a GitHub repo (or use the Vercel CLI: `npx vercel`
   from inside this folder).
2. In Vercel, click **Add New → Project**, import the repo.
3. Vercel will detect `api/notify.js` automatically as a serverless
   function — no extra configuration needed.
4. Before the first deploy (or after, then redeploy), go to **Project
   Settings → Environment Variables** and add:
   - Name: `RESEND_API_KEY`
   - Value: the `re_...` key from step 1
5. Deploy.

## 4. Connect your domain

1. In Vercel, go to **Project Settings → Domains** and add the domain you
   own.
2. Vercel will show you either an A record or a CNAME to add at your domain
   registrar. Add it there.
3. Vercel auto-issues SSL once the DNS change propagates (usually minutes to
   a couple hours).

## 5. Test it

Open the live site, submit a test booking with your own phone/email in the
fields. You should NOT see the "Notify Chris & Kevin now" button — instead
you'll see "Chris & Kevin have been notified automatically," and both
inboxes should get the email within seconds. Check Resend's dashboard
**Logs** tab if an email doesn't arrive — it'll show the delivery status and
any errors (e.g., domain not verified yet).

## 6. Set up the admin page (seasonal effects)

The site now includes `/admin` — a passcode-protected page with toggles for
snowfall, fireworks, a Halloween accent theme, and an Easter accent theme.
It needs two things to work:

**A. Set your passcode**
In Vercel → **Project Settings → Environment Variables**, add:
- Name: `ADMIN_PASSCODE`
- Value: any passcode you want (e.g. `soma2026`)

**B. Connect Vercel KV (free tier)**
This is where the toggle states are stored so they persist and the live
site can read them.
1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database → KV** (Vercel's built-in Redis-based store).
3. Give it a name and connect it to this project — Vercel automatically
   adds the required `KV_*` environment variables for you, no copying keys
   by hand.
4. Redeploy the project once (Deployments → ⋯ → Redeploy) so the new
   environment variables take effect.

Once both are done, go to `yourdomain.com/admin`, enter your passcode, and
the toggles will control the live site instantly — no code edits, no
redeploying, and your logo/layout/core brand colors are untouched. Only
Halloween and Easter are mutually exclusive; snow and fireworks can run
alongside either.

## Notes

- Free tier limits: Resend's free plan covers 3,000 emails/month (100/day) —
  more than enough for a local agency's booking volume.
- The site still works if you preview it back inside a Claude artifact — it
  automatically falls back to the pre-filled mailto: link there, since
  `/api/notify` only exists on the real deployment.
