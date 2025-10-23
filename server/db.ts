import pg from "pg";
const { Pool } = pg as any;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<{ rows: T[] }> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return { rows: res.rows };
  } finally {
    client.release();
  }
}
