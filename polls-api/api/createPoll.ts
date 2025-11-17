import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase.js';
import { checkRateLimit } from './_rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown';
  
  if (!checkRateLimit(ip, 5, 60000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { question, options } = req.body ?? {};
  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'question and at least two options required' });
  }

  try {
    // Insert poll
    const { data: poll, error: pollErr } = await supabase
      .from('polls')
      .insert([{ question }])
      .select('*')
      .single();

    if (pollErr) throw pollErr;

    // Insert options
    const optionsToInsert = options.map((label: string) => ({ poll_id: poll.id, label }));
    const { data: optionsRows, error: optsErr } = await supabase
      .from('poll_options')
      .insert(optionsToInsert)
      .select('*');

    if (optsErr) throw optsErr;

    return res.status(201).json({ ...poll, options: optionsRows });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
