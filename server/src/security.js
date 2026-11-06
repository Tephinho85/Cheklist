import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, savedHex] = String(storedHash || '').split(':');
  if (!salt || !savedHex) return false;
  const saved = Buffer.from(savedHex, 'hex');
  const actual = await scrypt(password, salt, saved.length);
  return saved.length === actual.length && timingSafeEqual(saved, actual);
}

export function criarToken(userId) {
  const secret = obterSegredo();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ sub: userId, iat: now, exp: now + TOKEN_TTL_SECONDS }));
  const content = `${header}.${payload}`;
  return `${content}.${assinar(content, secret)}`;
}

export function verificarToken(token) {
  const secret = obterSegredo();
  const [header, payload, signature] = String(token || '').split('.');
  if (!header || !payload || !signature) return null;

  const content = `${header}.${payload}`;
  const expected = Buffer.from(assinar(content, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

function assinar(content, secret) {
  return createHmac('sha256', secret).update(content).digest('base64url');
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function obterSegredo() {
  const secret = process.env.JWT_SECRET || '';
  if (Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET deve ter ao menos 32 bytes.');
  return secret;
}