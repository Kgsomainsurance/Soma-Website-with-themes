// /api/truck-quote.js
// Receives submissions from truck-quote.html and emails them silently
// to the team via Resend.
//
// Environment variables: RESEND_API_KEY (required), NOTIFY_TO and MAIL_FROM (optional).
// See notify.js for what NOTIFY_TO and MAIL_FROM do.

import { Resend } from 'resend';

const DEFAULT_TO = ['chris@somainsurancegroup.com', 'kevin@somainsurancegroup.com'];
const DEFAULT_FROM = 'Soma Insurance Website <onboarding@resend.dev>';

const recipients = () => {
  const list = (process.env.NOTIFY_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_TO;
};

const clean = (value, max = 300) =>
  String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email is not configured' });
  }

  const body = req.body || {};

  // Honeypot: real visitors never see or fill this field. Bots usually do.
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const data = {
    name: clean(body.name),
    business: clean(body.business),
    phone: clean(body.phone, 40),
    email: clean(body.email, 200),
    dot: clean(body.dot, 20),
    trucks: clean(body.trucks, 10),
    trailers: clean(body.trailers, 10),
    truckType: clean(body.truckType),
    cargo: clean(body.cargo),
    radius: clean(body.radius),
    states: clean(body.states),
    expiration: clean(body.expiration, 20),
    notes: String(body.notes ?? '').trim().slice(0, 2000),
  };

  const missing = ['name', 'business', 'phone', 'email', 'trucks', 'truckType', 'cargo', 'radius', 'states']
    .filter((key) => !data[key]);
  if (missing.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const dotLine = body.noDot ? 'None yet' : data.dot || 'Not provided';
  const expLine = body.noPolicy ? 'No current policy / not sure' : data.expiration || 'Not provided';

  const text = `New commercial truck insurance quote request

CONTACT
Name: ${data.name}
Business: ${data.business}
Phone: ${data.phone}
Email: ${data.email}
USDOT #: ${dotLine}

TRUCKS
Trucks: ${data.trucks}
Trailers: ${data.trailers || '0'}
Main truck type: ${data.truckType}

OPERATION
Hauls: ${data.cargo}
Radius: ${data.radius}
States: ${data.states}

CURRENT INSURANCE
Policy expires: ${expLine}

NOTES
${data.notes || 'None'}

Still to collect by phone: VINs, driver info, loss runs, coverage limits.`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.MAIL_FROM || DEFAULT_FROM,
      to: recipients(),
      replyTo: data.email,
      subject: `Truck quote request: ${data.business}`,
      text,
    });
    if (error) {
      console.error('Resend rejected the email:', error);
      return res.status(502).json({ error: 'Email provider rejected the message' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Truck quote send failed:', err);
    return res.status(500).json({ error: 'Could not send request' });
  }
}
