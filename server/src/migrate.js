import { pool, closePool } from './config.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { hashPassword } from './security.js';

const schemaPath = new URL('../sql/001_schema.sql', import.meta.url);

try {
  const schema = await readFile(fileURLToPath(schemaPath), 'utf8');
  await pool.query(schema);
  await criarAdministradorInicial();
  console.log('Esquema PostgreSQL aplicado com sucesso.');
} catch (error) {
  console.error('Falha na migração PostgreSQL:', error.message);
  process.exitCode = 1;
} finally {
  await closePool();
}

async function criarAdministradorInicial() {
  const { BOOTSTRAP_ADMIN_LOGIN, BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_AREA } = process.env;
  if (!BOOTSTRAP_ADMIN_LOGIN) return;
  const adminLogin = BOOTSTRAP_ADMIN_LOGIN.trim().toUpperCase();

  const exists = await pool.query('SELECT 1 FROM app_users WHERE login = $1', [adminLogin]);
  if (exists.rowCount) {
    await pool.query(
      `UPDATE app_users
       SET access_level = 'SUPERVISOR',
           screen_permissions = ARRAY(
             SELECT DISTINCT permission
             FROM unnest(screen_permissions || ARRAY[
               'RESPONDER_CHECKLIST', 'CADASTRAR_CHECKLIST', 'GERENCIAR_USUARIOS',
               'GESTORES_AREA', 'ORDENS_SERVICO', 'DASHBOARD_METAS'
             ]) AS permission
           ),
           updated_at = NOW()
       WHERE login = $1`,
      [adminLogin]
    );
    return;
  }

  const passwordSetting = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  if (!BOOTSTRAP_ADMIN_NAME || !BOOTSTRAP_ADMIN_AREA || !passwordSetting) return;
  const adminPassword = passwordSetting.startsWith('url:')
    ? decodeURIComponent(passwordSetting.slice(4))
    : passwordSetting;
  if (adminPassword.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD precisa ter ao menos 12 caracteres.');

  const passwordHash = await hashPassword(adminPassword);
  await pool.query(
    `INSERT INTO app_users
      (id, login, password_hash, name, area, signature_profile, access_level, can_sign, screen_permissions, active)
     VALUES ($1, $2, $3, $4, $5, 'TITULAR', 'SUPERVISOR', TRUE,
      ARRAY['RESPONDER_CHECKLIST', 'CADASTRAR_CHECKLIST', 'GERENCIAR_USUARIOS', 'GESTORES_AREA', 'ORDENS_SERVICO', 'DASHBOARD_METAS'], TRUE)
     ON CONFLICT (login) DO NOTHING`,
    ['user-' + randomUUID(), adminLogin, passwordHash,
      BOOTSTRAP_ADMIN_NAME.trim(), BOOTSTRAP_ADMIN_AREA.trim()]
  );
}