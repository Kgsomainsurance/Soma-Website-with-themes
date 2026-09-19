// /api/chat.js
const SYSTEM_PROMPT = `You are the AI insurance advisor for Soma Insurance Group, an independent agency with a team of dedicated agents (contact: 346-441-8001, info@somainsurancegroup.com). Soma offers four lines: Auto, Home, Commercial, and Life insurance.

Your job:
1. Answer general insurance questions clearly and briefly (2-5 sentences, plain language, no jargon dumps).
2. Naturally, conversationally qualify the visitor by learning: which line(s) of coverage they're interested in, their basic situation (e.g. what they're insuring, who depends on them, current coverage if any), and any timeline/urgency. Don't interrogate — weave one qualifying question in at a time, only when it fits.
3. Never invent specific prices, exact premiums, or guarantee coverage — say final numbers come from an agent after a quick consultation.
4. Once you have a reasonable sense of what they need (after a few exchanges), warmly suggest booking a consultation with an agent using the booking form on this page, but don't force it every message.
5. Keep responses short — this is a chat widget, not an essay. No markdown headers or bullet-heavy formatting; write like a knowledgeable, friendly person texting.
6. If asked something outside insurance, gently redirect to how you can help with their coverage.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI advisor is not configured yet.' });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing conversation messages' });
  }

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error('Anthropic API error:', data);
      return res.status(502).json({ error: 'AI advisor had trouble responding.' });
    }

    const text = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Chat handler failed:', err);
    return res.status(500).json({ error: 'AI advisor had trouble responding.' });
  }
}
