import { Router } from "express";
import { query } from "../db";

export const comms = Router();

// Crea un lead simple
// POST /api/leads  { listing_id, name?, email?, phone_e164?, message?, buyer_id? }
comms.post("/leads", async (req, res) => {
  const { listing_id, name, email, phone_e164, message, buyer_id } =
    req.body || {};
  if (!listing_id)
    return res.status(400).json({ error: "listing_id required" });

  const { rows } = await query(
    `INSERT INTO lead (listing_id, buyer_id, name, email, phone_e164, message, source)
     VALUES ($1,$2,$3,$4,$5,$6,'web')
     RETURNING *;`,
    [
      listing_id,
      buyer_id || null,
      name || null,
      email || null,
      phone_e164 || null,
      message || null,
    ],
  );
  res.status(201).json(rows[0]);
});

// Abre (o devuelve) una conversación única por listing+buyer+agent
// POST /api/conversations  { listing_id, buyer_id, agent_id }
comms.post("/conversations", async (req, res) => {
  const { listing_id, buyer_id, agent_id } = req.body || {};
  if (!listing_id || !buyer_id || !agent_id) {
    return res
      .status(400)
      .json({ error: "listing_id, buyer_id, agent_id required" });
  }

  // Usa el índice único uq_conversation_thread
  const { rows } = await query(
    `INSERT INTO conversation (listing_id, buyer_id, agent_id)
     VALUES ($1,$2,$3)
     ON CONFLICT ON CONSTRAINT uq_conversation_thread
     DO UPDATE SET last_message_at = conversation.last_message_at
     RETURNING *;`,
    [listing_id, buyer_id, agent_id],
  );
  res.status(201).json(rows[0]);
});

// Lista mensajes de una conversación
// GET /api/conversations/:id/messages
comms.get("/conversations/:id/messages", async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM message WHERE conversation_id = $1 ORDER BY created_at ASC;`,
    [req.params.id],
  );
  res.json(rows);
});

// Envía un mensaje
// POST /api/conversations/:id/messages  { sender_id, body, attachment_url? }
comms.post("/conversations/:id/messages", async (req, res) => {
  const { sender_id, body, attachment_url } = req.body || {};
  if (!sender_id) return res.status(400).json({ error: "sender_id required" });

  const { rows } = await query(
    `INSERT INTO message (conversation_id, sender_id, body, attachment_url)
     VALUES ($1,$2,$3,$4)
     RETURNING *;`,
    [req.params.id, sender_id, body || null, attachment_url || null],
  );

  await query(
    `UPDATE conversation SET last_message_at = now() WHERE id = $1;`,
    [req.params.id],
  );
  res.status(201).json(rows[0]);
});
