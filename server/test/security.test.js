import test from 'node:test';
import assert from 'node:assert/strict';
import { criarToken, hashPassword, verificarToken, verifyPassword } from '../src/security.js';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-bytes-long';

test('password hashes verify only the original password', async () => {
  const hash = await hashPassword('senha-forte-para-teste');
  assert.notEqual(hash, 'senha-forte-para-teste');
  assert.equal(await verifyPassword('senha-forte-para-teste', hash), true);
  assert.equal(await verifyPassword('senha-incorreta', hash), false);
});

test('bearer token contains a signed user id and rejects tampering', () => {
  const token = criarToken('user-42');
  assert.equal(verificarToken(token)?.sub, 'user-42');
  assert.equal(verificarToken(`${token.slice(0, -1)}x`), null);
});