import { Router } from 'express';

export const publicApi = Router();

publicApi.post('/visit', (req, res) => {
  res.json({ ok: true, ...req.body });
});

publicApi.post('/auth/login', (req, res) => {
  res.json({ ok: true, user: { email: req.body?.email || '' } });
});

publicApi.post('/auth/register', (req, res) => {
  res.json({ ok: true, user: { name: req.body?.name || '', email: req.body?.email || '' } });
});

publicApi.post('/agency', (req, res) => {
  res.json({ ok: true, ...req.body });
});
