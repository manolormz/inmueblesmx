import { Router } from 'express';
import { query } from '../db';

export const listings = Router();

// GET /api/listings/search
listings.get('/search', async (req, res) => {
  const page = Math.max(parseInt(String(req.query.page ?? '1')), 1);
  const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize ?? '24')), 1), 100);

  const params: any[] = [];
  const where: string[] = ["l.status = 'published'"];

  if (req.query.operation) { params.push(req.query.operation); where.push(`l.operation = $${params.length}`); }
  if (req.query.type) { params.push(req.query.type); where.push(`p.property_type = $${params.length}`); }
  if (req.query.minPrice) { params.push(Number(req.query.minPrice)); where.push(`l.price >= $${params.length}`); }
  if (req.query.maxPrice) { params.push(Number(req.query.maxPrice)); where.push(`l.price <= $${params.length}`); }
  if (req.query.bedrooms) { params.push(Number(req.query.bedrooms)); where.push(`p.bedrooms >= $${params.length}`); }

  if (req.query.state) { params.push(req.query.state); where.push(`p.state_slug = $${params.length}`); }
  if (req.query.municipality) { params.push(req.query.municipality); where.push(`p.municipality_slug = $${params.length}`); }
  if (req.query.neighborhood) { params.push(req.query.neighborhood); where.push(`p.neighborhood_slug = $${params.length}`); }

  if (req.query.text) {
    params.push(req.query.text);
    where.push(
      `to_tsvector('spanish', unaccent(coalesce(p.title,'')||' '||coalesce(p.description_md,''))) @@ plainto_tsquery('spanish', unaccent($${params.length}))`
    );
  }

  // bbox=west,south,east,north
  if (req.query.bbox) {
    const parts = String(req.query.bbox).split(',').map(Number);
    if (parts.length === 4 && parts.every(n => !isNaN(n))) {
      const [west, south, east, north] = parts;
      params.push(west, south, east, north);
      where.push(
        `ST_Intersects(p.geo_point, ST_MakeEnvelope($${params.length-3}, $${params.length-2}, $${params.length-1}, $${params.length}, 4326))`
      );
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const sql = `
    SELECT l.id as listing_id, l.operation, l.price, l.currency, l.status,
           p.id as property_id, p.slug as property_slug, p.title, p.property_type, p.bedrooms, p.bathrooms, p.built_area_m2,
           p.state_slug, p.municipality_slug, p.neighborhood_slug,
           COALESCE(
             (SELECT url FROM property_image pi WHERE pi.property_id = p.id AND pi.is_cover = true ORDER BY sort_order ASC LIMIT 1),
             (SELECT url FROM property_image pi WHERE pi.property_id = p.id ORDER BY sort_order ASC LIMIT 1)
           ) as cover_url
    FROM listing l
    JOIN property p ON p.id = l.property_id
    ${whereSql}
    ORDER BY l.published_at DESC NULLS LAST, l.updated_at DESC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  const countSql = `SELECT COUNT(*) FROM listing l JOIN property p ON p.id = l.property_id ${whereSql};`;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    query(sql, params),
    query<{ count: string }>(countSql, params),
  ]);

  const total = parseInt(countRows[0]?.count || '0', 10);
  res.json({ page, pageSize, total, results: rows });
});

// GET /api/listings/:slugOrId
listings.get('/:slugOrId', async (req, res) => {
  const v = req.params.slugOrId;
  const isUUID = /^[0-9a-fA-F-]{36}$/.test(v);
  const by = isUUID ? 'p.id' : 'p.slug';

  const { rows } = await query(
    `
    SELECT l.id as listing_id, l.operation, l.price, l.currency, l.status, l.published_at,
           p.*,
           COALESCE((
             SELECT json_agg(json_build_object('url', url, 'is_cover', is_cover, 'sort', sort_order))
             FROM property_image WHERE property_id = p.id
             ORDER BY is_cover DESC, sort_order ASC
           ), '[]'::json) as images
    FROM listing l JOIN property p ON p.id = l.property_id
    WHERE ${by} = $1 AND l.status IN ('published','paused','sold','rented')
    LIMIT 1;
    `,
    [v]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Listing not found' });
  res.json(rows[0]);
});
