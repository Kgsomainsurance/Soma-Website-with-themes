// /api/notify.js
// Receives a booking submission from the site and emails it to the team via Resend.
//
// Environment variables (Vercel -> Project Settings -> Environment Variables):
//   RESEND_API_KEY  (required)  your key from resend.com
//   NOTIFY_TO       (optional)  comma-separated recipients. Default: Chris and Kevin.
//                               Until your domain is verified in Resend, set this to the
//                               email address you signed up to Resend with.
//   MAIL_FROM       (optional)  sender, e.g. Soma Insurance Website <forms@somainsurancegroup.com>
//                               Default is Resend's test sender, which only delivers to
//                               your own Resend account email.

import { Resend } from 'resend';

const DEFAULT_TO = ['chris@somainsurancegroup.com', 'kevin@somainsurancegroup.com'];
const DEFAULT_FROM = 'Soma Insurance Website <onboarding@resend.dev>';

const recipients = () => {
  const list = (process.env.NOTIFY_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_TO;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email is not configured' });
  }

  const { line, name, phone, email, method, date, time, notes, submittedAt } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ error: 'Missing required fields (name, phone)' });
  }

  const subject = `New appointment request — ${name} (${line || 'Not specified'})`;

  const text = `New booking request from the Soma Insurance website:

Coverage line: ${line || 'Not specified'}
Name: ${name}
Phone: ${phone}
Email: ${email || 'Not provided'}
Preferred contact method: ${method || 'Not specified'}
Preferred date: ${date || 'Not specified'}
Preferred time: ${time || 'Not specified'}
Notes: ${notes || 'None'}

Submitted: ${submittedAt ? new Date(submittedAt).toLocaleString() : new Date().toLocaleString()}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.MAIL_FROM || DEFAULT_FROM,
      to: recipients(),
      ...(email ? { replyTo: email } : {}),
      subject,
      text,
    });
    if (error) {
      console.error('Resend rejected the email:', error);
      return res.status(502).json({ error: 'Email provider rejected the message' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend send failed:', err);
    return res.status(500).json({ error: 'Failed to send notification email' });
  }
}
