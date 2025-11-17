import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const id = (req.query.id as string) ?? null;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const { data: poll, error: pollErr } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollErr) return res.status(404).json({ error: 'not found' });

    const { data: options } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', id)
      .order('created_at', { ascending: true });

    return res.json({ ...poll, options });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
