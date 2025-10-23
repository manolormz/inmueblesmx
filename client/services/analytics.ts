export async function track(event: string, meta?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined' && window.top !== window.self) {
      // In sandbox/iframe: avoid initializing external analytics
      if (import.meta.env.DEV) console.log('[track-sandbox]', event, meta || {});
      return;
    }
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
