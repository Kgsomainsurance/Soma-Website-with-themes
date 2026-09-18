// /api/settings.js
// GET  -> returns the current toggle states (public — the main site reads this on every page load)
// POST -> updates toggle states (requires the admin passcode in the x-admin-passcode header)
//
// Requires environment variables in the Vercel project settings:
//   ADMIN_PASSCODE      = whatever passcode you choose for /admin.html
//   (KV_* variables are added automatically once you connect a Vercel KV
//    store to this project — see README.md)

import { kv } from '@vercel/kv';

const SETTINGS_KEY = 'soma:site-settings';

const DEFAULTS = {
  snow: false,
  fireworks: false,
  halloween: false,
  easter: false,
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const stored = await kv.get(SETTINGS_KEY);
      return res.status(200).json({ ...DEFAULTS, ...(stored || {}) });
    } catch (err) {
      // If KV isn't set up yet, fail quiet with defaults rather than breaking the site.
      return res.status(200).json(DEFAULTS);
    }
  }

  if (req.method === 'POST') {
    const passcode = req.headers['x-admin-passcode'];
    if (!process.env.ADMIN_PASSCODE || passcode !== process.env.ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Incorrect passcode' });
    }

    const { snow, fireworks, halloween, easter } = req.body || {};
    const next = {
      snow: !!snow,
      fireworks: !!fireworks,
      // Halloween and Easter are mutually exclusive — the last one turned on wins.
      halloween: !!halloween && !easter,
      easter: !!easter,
    };

    try {
      await kv.set(SETTINGS_KEY, next);
      return res.status(200).json(next);
    } catch (err) {
      console.error('KV write failed:', err);
      return res.status(500).json({ error: 'Could not save settings — is Vercel KV connected?' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
