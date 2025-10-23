export async function track(event: string, meta?: Record<string, any>) {
  try {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[track]', event, meta || {});
      return;
    }
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, meta, at: Date.now() })
    });
  } catch {}
}
