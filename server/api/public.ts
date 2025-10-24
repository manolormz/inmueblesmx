import { Router } from "express";

export const publicApi = Router();

// rate limit en memoria (simple)
const hits = new Map<string, number[]>();
function rateLimit(ip: string, max = 10, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length <= max;
}

publicApi.post("/visit", (req, res) => {
  if (req.body?.company) return res.status(204).end();
  const ip = req.ip || "x";
  if (!rateLimit(ip))
    return res.status(429).json({ error: "Too many requests" });
  res.json({ ok: true, ...req.body });
});

publicApi.post("/auth/login", (req, res) => {
  const ip = req.ip || "x";
  if (!rateLimit(ip))
    return res.status(429).json({ error: "Too many requests" });
  res.json({ ok: true, user: { email: req.body?.email || "" } });
});

publicApi.post("/auth/register", (req, res) => {
  const ip = req.ip || "x";
  if (!rateLimit(ip))
    return res.status(429).json({ error: "Too many requests" });
  res.json({
    ok: true,
    user: { name: req.body?.name || "", email: req.body?.email || "" },
  });
});

publicApi.post("/agency", (req, res) => {
  if (req.body?.company) return res.status(204).end();
  const ip = req.ip || "x";
  if (!rateLimit(ip))
    return res.status(429).json({ error: "Too many requests" });
  res.json({ ok: true, ...req.body });
});
