export async function json(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  let body: any = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || res.statusText || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export const Api = {
  async lead(payload: { listing_id: string|number; name?: string; email?: string; phone_e164?: string; message?: string; company?: string; }) {
    try {
      return await json('/api/leads', { method: 'POST', body: JSON.stringify({ ...payload, source: 'web' }) });
    } catch (e) {
      return { ok: true, mock: true, ...payload };
    }
  },
  async visit(payload: any) {
    try {
      return await json('/api/visit', { method: 'POST', body: JSON.stringify(payload) });
    } catch (e) {
      return { ok: true, mock: true, ...payload };
    }
  },
  auth: {
    async login(payload: { email: string; password: string }) {
      try {
        return await json('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        return { ok: true, mock: true, user: { email: payload.email } };
      }
    },
    async register(payload: { name: string; email: string; password: string }) {
      try {
        return await json('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        return { ok: true, mock: true, user: { name: payload.name, email: payload.email } };
      }
    },
  },
  async agencyCreate(payload: { name: string; slug: string; phone?: string; website?: string }) {
    try {
      return await json('/api/agency', { method: 'POST', body: JSON.stringify(payload) });
    } catch (e) {
      return { ok: true, mock: true, ...payload };
    }
  }
};
