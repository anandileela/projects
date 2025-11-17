import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase.js';
import { checkRateLimit } from './_rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown';
  
  if (!checkRateLimit(ip, 10, 60000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (req.method !== 'POST') return res.status(405).end();
  
  const { pollId, optionId, voterIdentifier } = req.body ?? {};

  if (!pollId || !optionId) return res.status(400).json({ error: 'pollId and optionId required' });

  try {
    const { error } = await supabase.rpc('api_vote', {
      p_poll_id: pollId,
      p_option_id: optionId,
      p_voter_identifier: voterIdentifier ?? null,
    });

    if (error) {
      if (error.code === 'P0001' || error.message?.includes('already_voted')) {
        return res.status(409).json({ error: 'already_voted' });
      }
      throw error;
    }

    return res.status(204).end();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
