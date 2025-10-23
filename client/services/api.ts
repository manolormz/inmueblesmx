export async function json(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const Api = {
  async lead(payload: { listing_id: string|number; name?: string; email?: string; phone_e164?: string; message?: string; }) {
    try {
      return await json('/api/leads', { method: 'POST', body: JSON.stringify(payload) });
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
