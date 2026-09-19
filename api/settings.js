// /api/settings.js
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
