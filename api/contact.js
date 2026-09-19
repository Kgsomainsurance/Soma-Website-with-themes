// /api/contact.js
// Handles the "Send us a message" contact modal (triggered from the
// info@somainsurancegroup.com links). Sends silently via Resend — the
// visitor never has to open their own email app.
//
// Requires the same RESEND_API_KEY environment variable as /api/notify.js.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Same inbox that gets booking notifications — change here if you'd
// rather general contact messages go somewhere else.
const TEAM_EMAILS = ['chris@somainsurancegroup.com', 'kevin@somainsurancegroup.com'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: 'Soma Insurance Website <onboarding@resend.dev>',
      to: TEAM_EMAILS,
      reply_to: email,
      subject: `Website contact form: ${name}`,
      text: `New message from the website contact form:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form send failed:', err);
    return res.status(500).json({ error: 'Could not send message' });
  }
}
