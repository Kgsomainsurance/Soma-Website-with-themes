// /api/notify.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, coverageType, message } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: 'Soma Insurance Website <onboarding@resend.dev>',
      to: ['chris@somainsurancegroup.com', 'kevin@somainsurancegroup.com'],
      subject: `New booking request from ${name}`,
      text: `New consultation request:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nCoverage type: ${coverageType || 'Not specified'}\nMessage: ${message || 'None'}`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend send failed:', err);
    return res.status(500).json({ error: 'Could not send notification email' });
  }
}
