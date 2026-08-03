import { Env } from '../types';

// Ticket Counter helper using KV (or fallback memory)
let localCounters: Record<string, number> = {};

export async function getNextTicketNumber(type: 'gallery' | 'modeling', env: Env): Promise<string> {
  const key = `counter_${type}`;
  let count = 1;

  if (env.TICKET_KV) {
    const val = await env.TICKET_KV.get(key);
    if (val) {
      count = parseInt(val, 10) + 1;
    }
    await env.TICKET_KV.put(key, count.toString());
  } else {
    if (localCounters[key]) {
      count = localCounters[key] + 1;
    }
    localCounters[key] = count;
  }

  return count.toString().padStart(3, '0');
}
