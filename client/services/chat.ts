export async function ensureConversation(listingId: string, buyerId: string, agentId: string) {
  const r = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId, buyer_id: buyerId, agent_id: agentId }),
  });
  if (!r.ok) throw new Error('Failed to create/open conversation');
  return r.json() as Promise<{ id: string; listing_id: string; buyer_id: string; agent_id: string }>;
}

export async function fetchMessages(conversationId: string) {
  const r = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!r.ok) throw new Error('Failed to fetch messages');
  return r.json() as Promise<Array<{ id: string; sender_id: string; body?: string; attachment_url?: string; created_at: string }>>;
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const r = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id: senderId, body }),
  });
  if (!r.ok) throw new Error('Failed to send message');
  return r.json() as Promise<{ id: string; sender_id: string; body?: string; created_at: string }>;
}
