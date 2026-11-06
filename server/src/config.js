// src/config.js
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega o .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL ausente no .env');
}

// SSL explícito — indispensável para o pooler na 6543
function buildSslConfig() {
  const useSsl = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true';
  if (!useSsl) return false;

  const caPath = process.env.DATABASE_SSL_CA;
  if (caPath) {
    const candidates = [
      path.isAbsolute(caPath) ? caPath : path.resolve(process.cwd(), caPath),
      path.resolve(__dirname, '..', caPath),
    ];
    const abs = candidates.find((p) => fs.existsSync(p));
    if (abs) {
      console.log(`[db] SSL com CA: ${abs}`);
      return { ca: fs.readFileSync(abs, 'utf8'), rejectUnauthorized: true };
    }
    console.warn(`[db] CA não encontrado. Tentou: ${candidates.join(' | ')}`);
  }
  console.warn('[db] SSL sem verificação de CA (fallback).');
  return { rejectUnauthorized: false };
}

// Remove sslmode da URL para não conflitar com o objeto `ssl`
function sanitizeConnectionString(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch {
    return url;
  }
}

export const pool = new Pool({
  connectionString: sanitizeConnectionString(process.env.DATABASE_URL),
  ssl: buildSslConfig(),
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  console.error('[pg] erro em cliente idle:', err.message);
});

export function query(text, params) {
  return pool.query(text, params);
}

// ESTA É A FUNÇÃO QUE ESTAVA FALTANDO:
export async function closePool() {
  await pool.end();
}