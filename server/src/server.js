// src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool, closePool } from './config.js';
import { criarToken, verificarToken, verifyPassword } from './security.js';

const PORT = Number(process.env.API_PORT || 3000);

const app = express();
app.set('etag', false);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('select 1 as ok');
    res.json({ ok: rows[0]?.ok === 1, ts: new Date().toISOString() });
  } catch (err) {
    console.error('[health]', err.message);
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.get('/api/ping-db', async (req, res) => {
  try {
    const { rows } = await pool.query('select now() as now');
    res.json({ now: rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body || {};
  if (typeof login !== 'string' || typeof password !== 'string' || !login.trim() || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, login, password_hash, name, area, signature_profile, can_sign
       FROM app_users
       WHERE login = $1 AND active = TRUE
       LIMIT 1`,
      [login.trim().toUpperCase()]
    );

    const usuario = rows[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    if (!(await verifyPassword(password, usuario.password_hash))) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const token = criarToken(usuario.id);

    return res.json({
      token,
      user: {
        id: usuario.id,
        login: usuario.login,
        nome: usuario.name,
        setor: usuario.area,
        perfil: usuario.signature_profile,
        podeAssinar: usuario.can_sign,
        name: usuario.name,
        sector: usuario.area
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

const api = express.Router();

api.use(async (req, res, next) => {
  try {
    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const claims = verificarToken(token);
    if (!claims) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });

    const { rows } = await pool.query(
      `SELECT id, area, access_level, screen_permissions
       FROM app_users
       WHERE id = $1 AND active = TRUE`,
      [claims.sub]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Usuário inativo ou inexistente.' });

    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
});

function permitir(...permissions) {
  return (req, res, next) => {
    const granted = req.user.screen_permissions || [];
    if (permissions.some(permission => granted.includes(permission))) return next();
    return res.status(403).json({ error: 'Usuário sem permissão para esta operação.' });
  };
}

function areasIguais(areaA, areaB) {
  return String(areaA || '').trim().toLocaleUpperCase() === String(areaB || '').trim().toLocaleUpperCase();
}

api.get('/checklists', permitir('RESPONDER_CHECKLIST', 'CADASTRAR_CHECKLIST', 'DASHBOARD_METAS'), async (req, res) => {
  const values = [];
  const where = req.user.access_level === 'SUPERVISOR'
    ? ''
    : (values.push(req.user.area), 'WHERE UPPER(BTRIM(area)) = UPPER(BTRIM($1))');
  const { rows } = await pool.query(
    `SELECT code, revision, description, area AS sector, monthly_inspection_goal, items
     FROM checklists ${where} ORDER BY code`,
    values
  );
  res.json(rows);
});

api.put('/checklists/:code', permitir('CADASTRAR_CHECKLIST'), async (req, res) => {
  const body = req.body || {};
  const area = body.sector ?? body.setor;
  if (!req.params.code || !body.description || !body.revision || !area || !Array.isArray(body.items)) {
    return res.status(400).json({ error: 'Dados do checklist incompletos ou inválidos.' });
  }
  if (req.user.access_level !== 'SUPERVISOR' && !areasIguais(area, req.user.area)) {
    return res.status(403).json({ error: 'Sem permissão para alterar checklists de outra área.' });
  }
  const { rows } = await pool.query(
    `INSERT INTO checklists (code, revision, description, area, monthly_inspection_goal, items)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (code) DO UPDATE SET revision = EXCLUDED.revision,
       description = EXCLUDED.description, area = EXCLUDED.area,
       monthly_inspection_goal = EXCLUDED.monthly_inspection_goal,
       items = EXCLUDED.items, updated_at = NOW()
     RETURNING code, revision, description, area AS sector, monthly_inspection_goal, items`,
    [req.params.code, body.revision, body.description, area,
      Number(body.monthly_inspection_goal) || 0, JSON.stringify(body.items)]
  );
  res.json(rows[0]);
});

api.delete('/checklists/:code', permitir('CADASTRAR_CHECKLIST'), async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM checklists
     WHERE code = $1 AND ($2 = 'SUPERVISOR' OR UPPER(BTRIM(area)) = UPPER(BTRIM($3)))`,
    [req.params.code, req.user.access_level, req.user.area]
  );
  if (!rowCount) return res.status(404).json({ error: 'Checklist não encontrado.' });
  res.status(204).end();
});

api.get('/inspections', permitir('RESPONDER_CHECKLIST', 'DASHBOARD_METAS'), async (req, res) => {
  const values = [];
  const where = req.user.access_level === 'SUPERVISOR'
    ? ''
    : (values.push(req.user.area), 'WHERE UPPER(BTRIM(area)) = UPPER(BTRIM($1))');
  const { rows } = await pool.query(
    `SELECT id, checklist_code, checklist_description AS description,
            checklist_revision AS revision, executed_at,
            responsible_name AS inspector, responses AS answers
     FROM inspections ${where} ORDER BY executed_at DESC`,
    values
  );
  res.json(rows);
});

api.post('/inspections', permitir('RESPONDER_CHECKLIST'), async (req, res) => {
  const body = req.body || {};
  if (!body.id || !body.checklist_code || !body.description || !body.executed_at ||
      !body.inspector || !Array.isArray(body.answers)) {
    return res.status(400).json({ error: 'Dados da inspeção incompletos ou inválidos.' });
  }
  const checklistResult = await pool.query(
    `SELECT code, revision, description, area
     FROM checklists
     WHERE code = $1 AND ($2 = 'SUPERVISOR' OR UPPER(BTRIM(area)) = UPPER(BTRIM($3)))`,
    [body.checklist_code, req.user.access_level, req.user.area]
  );
  const checklist = checklistResult.rows[0];
  if (!checklist) return res.status(404).json({ error: 'Checklist não encontrado para esta área.' });

  const { rows } = await pool.query(
    `INSERT INTO inspections
       (id, checklist_code, checklist_description, checklist_revision, area, executed_at,
        responsible_user_id, responsible_name, responses)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, checklist_code, checklist_description AS description,
       checklist_revision AS revision, executed_at, responsible_name AS inspector,
       responses AS answers`,
    [body.id, checklist.code, checklist.description, checklist.revision, checklist.area,
      body.executed_at, req.user.id, body.inspector, JSON.stringify(body.answers)]
  );
  res.status(201).json(rows[0]);
});

api.get('/managers', permitir('GESTORES_AREA', 'RESPONDER_CHECKLIST', 'ORDENS_SERVICO'), async (req, res) => {
  const values = [];
  const where = req.user.access_level === 'SUPERVISOR'
    ? ''
    : (values.push(req.user.area), 'WHERE UPPER(BTRIM(area)) = UPPER(BTRIM($1))');
  const { rows } = await pool.query(
    `SELECT id, name, area, email, whatsapp, active
     FROM area_managers ${where} ORDER BY name`,
    values
  );
  res.json(rows);
});

api.put('/managers/:id', permitir('GESTORES_AREA'), async (req, res) => {
  const body = req.body || {};
  const name = body.name ?? body.nome;
  if (!req.params.id || !name || !body.area || !body.email || !body.whatsapp) {
    return res.status(400).json({ error: 'Dados do gestor incompletos ou inválidos.' });
  }
  if (req.user.access_level !== 'SUPERVISOR' && !areasIguais(body.area, req.user.area)) {
    return res.status(403).json({ error: 'Sem permissão para alterar gestores de outra área.' });
  }
  const { rows } = await pool.query(
    `INSERT INTO area_managers (id, name, area, email, whatsapp, active)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, area = EXCLUDED.area,
       email = EXCLUDED.email, whatsapp = EXCLUDED.whatsapp, active = EXCLUDED.active,
       updated_at = NOW()
     RETURNING id, name, area, email, whatsapp, active`,
    [req.params.id, name, body.area, body.email, body.whatsapp, body.active ?? body.ativo ?? true]
  );
  res.json(rows[0]);
});

api.delete('/managers/:id', permitir('GESTORES_AREA'), async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM area_managers
     WHERE id = $1 AND ($2 = 'SUPERVISOR' OR UPPER(BTRIM(area)) = UPPER(BTRIM($3)))`,
    [req.params.id, req.user.access_level, req.user.area]
  );
  if (!rowCount) return res.status(404).json({ error: 'Gestor não encontrado.' });
  res.status(204).end();
});

api.get('/service-orders', permitir('ORDENS_SERVICO'), async (req, res) => {
  const values = [];
  const where = req.user.access_level === 'SUPERVISOR'
    ? ''
    : (values.push(req.user.area), 'WHERE UPPER(BTRIM(orders.area)) = UPPER(BTRIM($1))');
  const { rows } = await pool.query(
    `SELECT orders.*, orders.irregularity AS irregularidade,
       EXISTS (SELECT 1 FROM service_order_photos photos
               WHERE photos.service_order_id = orders.id AND photos.photo_kind = 'antes') AS has_photo_before,
       EXISTS (SELECT 1 FROM service_order_photos photos
               WHERE photos.service_order_id = orders.id AND photos.photo_kind = 'depois') AS has_photo_after
     FROM service_orders orders ${where}
     ORDER BY orders.opened_at DESC`,
    values
  );
  res.json(rows);
});

api.post('/service-orders', permitir('ORDENS_SERVICO', 'RESPONDER_CHECKLIST'), async (req, res) => {
  const body = req.body || {};
  const required = [
    body.id, body.codigoChecklist, body.descricaoChecklist, body.item, body.pergunta,
    body.resposta, body.irregularidade, body.correcaoSolicitada, body.area,
    body.gestorId, body.solicitante, body.abertaEm, body.status
  ];
  if (required.some(value => value === undefined || value === null || value === '') ||
      !Array.isArray(body.historico) || !['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'].includes(body.status)) {
    return res.status(400).json({ error: 'Dados da ordem de serviço incompletos ou inválidos.' });
  }
  if (req.user.access_level !== 'SUPERVISOR' && !areasIguais(body.area, req.user.area)) {
    return res.status(403).json({ error: 'Sem permissão para abrir OS em outra área.' });
  }
  const managerResult = await pool.query(
    `SELECT id, name, email, whatsapp
     FROM area_managers
     WHERE id = $1 AND UPPER(BTRIM(area)) = UPPER(BTRIM($2)) AND active = TRUE`,
    [body.gestorId, body.area]
  );
  const manager = managerResult.rows[0];
  if (!manager) return res.status(400).json({ error: 'Gestor ativo da área não encontrado.' });

  const openedAt = new Date(body.abertaEm);
  if (Number.isNaN(openedAt.getTime())) {
    return res.status(400).json({ error: 'Data de abertura da OS inválida.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const year = openedAt.getUTCFullYear();
    const counter = await client.query(
      `INSERT INTO service_order_counters (year, last_number)
       VALUES ($1,
         COALESCE((
           SELECT MAX((regexp_match(number, '([0-9]+)$'))[1]::integer)
           FROM service_orders
           WHERE number LIKE $2 AND number ~ '^[A-Z]+-[0-9]{4}-[0-9]+$'
         ), 0) + 1)
       ON CONFLICT (year) DO UPDATE
         SET last_number = service_order_counters.last_number + 1
       RETURNING last_number`,
      [year, `OS-${year}-%`]
    );
    const number = `OS-${year}-${String(counter.rows[0].last_number).padStart(5, '0')}`;
    const { rows } = await client.query(
      `INSERT INTO service_orders
        (id, number, inspection_id, checklist_code, checklist_description, checklist_revision,
         item_code, question, answer, irregularity, requested_correction, area,
         manager_id, manager_name, manager_email, manager_whatsapp, requester, opened_at,
         correction_deadline, deadline_reported_by, completed_at, status,
         notification_status, history, observations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
       RETURNING *`,
      [body.id, number, body.inspecaoId || null, body.codigoChecklist,
        body.descricaoChecklist, body.revisaoChecklist || '', body.item, body.pergunta,
        body.resposta, body.irregularidade, body.correcaoSolicitada, body.area,
        manager.id, manager.name, manager.email, manager.whatsapp, body.solicitante,
        openedAt.toISOString(), body.prazoCorrecao || null, body.informadoPor || null,
        body.dataConclusao || null, body.status, body.notificacaoStatus || 'PENDENTE',
        JSON.stringify(body.historico), body.observacoes || '']
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

api.patch('/service-orders/:id', permitir('ORDENS_SERVICO'), async (req, res) => {
  const patch = req.body || {};
  const fields = [
    ['status', 'status'],
    ['notificacaoStatus', 'notification_status'],
    ['prazoCorrecao', 'correction_deadline'],
    ['informadoPor', 'deadline_reported_by'],
    ['dataConclusao', 'completed_at'],
    ['observacoes', 'observations'],
    ['historico', 'history']
  ];
  const assignments = [];
  const values = [];
  for (const [key, column] of fields) {
    if (!Object.hasOwn(patch, key)) continue;
    if (key === 'status' && !['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'].includes(patch[key])) {
      return res.status(400).json({ error: 'Status da OS inválido.' });
    }
    if (key === 'notificacaoStatus' && !['PENDENTE', 'ENVIADA', 'FALHOU'].includes(patch[key])) {
      return res.status(400).json({ error: 'Status da notificação inválido.' });
    }
    if (key === 'historico' && !Array.isArray(patch[key])) {
      return res.status(400).json({ error: 'Histórico da OS inválido.' });
    }
    values.push(key === 'historico' ? JSON.stringify(patch[key]) : patch[key]);
    assignments.push(`${column} = $${values.length}${key === 'historico' ? '::jsonb' : ''}`);
  }
  if (!assignments.length) return res.status(400).json({ error: 'Nenhuma alteração informada.' });

  values.push(req.params.id);
  let where = `id = $${values.length}`;
  if (req.user.access_level !== 'SUPERVISOR') {
    values.push(req.user.area);
    where += ` AND UPPER(BTRIM(area)) = UPPER(BTRIM($${values.length}))`;
  }
  const { rows } = await pool.query(
    `UPDATE service_orders SET ${assignments.join(', ')}, updated_at = NOW()
     WHERE ${where} RETURNING *`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
  res.json(rows[0]);
});

api.get('/dashboard', permitir('DASHBOARD_METAS'), async (req, res) => {
  const periodo = String(req.query.period || '');
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!match) return res.status(400).json({ error: 'Período inválido. Use o formato AAAA-MM.' });

  const year = Number(match[1]);
  const month = Number(match[2]);
  const rangeStart = new Date(Date.UTC(year, month - 6, 1));
  const rangeEnd = new Date(Date.UTC(year, month, 1));

  const checklistValues = [];
  let checklistScope = '';
  if (req.user.access_level !== 'SUPERVISOR') {
    checklistValues.push(req.user.area);
    checklistScope = 'WHERE UPPER(BTRIM(area)) = UPPER(BTRIM($1))';
  }
  const checklistResult = await pool.query(
    `SELECT code, description, area, monthly_inspection_goal
     FROM checklists ${checklistScope}
     ORDER BY area, description`,
    checklistValues
  );

  const inspectionValues = [rangeStart.toISOString(), rangeEnd.toISOString()];
  let inspectionScope = 'WHERE executed_at >= $1 AND executed_at < $2';
  if (req.user.access_level !== 'SUPERVISOR') {
    inspectionValues.push(req.user.area);
    inspectionScope += ' AND UPPER(BTRIM(area)) = UPPER(BTRIM($3))';
  }
  const inspectionResult = await pool.query(
    `SELECT checklist_code, executed_at, responsible_name
     FROM inspections ${inspectionScope}
     ORDER BY executed_at`,
    inspectionValues
  );

  const checklists = checklistResult.rows.map(row => ({
    codigo: row.code,
    descricao: row.description,
    area: row.area || 'Área não definida',
    prevista: Number(row.monthly_inspection_goal) > 0 ? Number(row.monthly_inspection_goal) : null,
    realizada: 0,
    cumprimento: null,
    pendente: null
  }));
  const inspections = inspectionResult.rows.map(row => ({
    codigo: row.checklist_code,
    periodo: new Date(row.executed_at).toISOString().slice(0, 7),
    responsavel: row.responsible_name?.trim() || 'Responsável não identificado'
  }));
  const inspectionsOfPeriod = inspections.filter(row => row.periodo === periodo);
  const countsByChecklist = new Map();
  for (const inspection of inspectionsOfPeriod) {
    countsByChecklist.set(inspection.codigo, (countsByChecklist.get(inspection.codigo) || 0) + 1);
  }

  for (const checklist of checklists) {
    checklist.realizada = countsByChecklist.get(checklist.codigo) || 0;
    checklist.cumprimento = checklist.prevista
      ? checklist.realizada / checklist.prevista * 100
      : null;
    checklist.pendente = checklist.prevista
      ? Math.max(0, checklist.prevista - checklist.realizada)
      : null;
  }

  const checklistsComMeta = checklists.filter(checklist => checklist.prevista !== null);
  const quantidadePrevista = checklistsComMeta.reduce((total, checklist) => total + checklist.prevista, 0);
  const realizadasComMeta = checklistsComMeta.reduce((total, checklist) => total + checklist.realizada, 0);
  const responsaveis = new Map();
  for (const inspection of inspectionsOfPeriod) {
    responsaveis.set(inspection.responsavel, (responsaveis.get(inspection.responsavel) || 0) + 1);
  }

  const codigosComMeta = new Set(checklistsComMeta.map(checklist => checklist.codigo));
  const totalMensalPrevisto = checklistsComMeta.reduce((total, checklist) => total + checklist.prevista, 0);
  const porPeriodo = Array.from({ length: 6 }, (_, index) => {
    const data = new Date(Date.UTC(year, month - 6 + index, 1));
    const chave = `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
    const realizadas = inspections.filter(row => row.periodo === chave && codigosComMeta.has(row.codigo)).length;
    return {
      periodo: chave,
      rotulo: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
        .format(data).replace('.', ''),
      prevista: totalMensalPrevisto,
      realizada: realizadas
    };
  });

  res.json({
    periodo,
    quantidadePrevista,
    quantidadeRealizada: inspectionsOfPeriod.length,
    realizadasComMeta,
    percentualCumprimento: quantidadePrevista ? realizadasComMeta / quantidadePrevista * 100 : null,
    pendencias: checklistsComMeta.reduce((total, checklist) => total + checklist.pendente, 0),
    porChecklist: checklists,
    porResponsavel: [...responsaveis].map(([nome, realizada]) => ({
      nome,
      realizada,
      percentual: inspectionsOfPeriod.length ? realizada / inspectionsOfPeriod.length * 100 : 0
    })).sort((a, b) => b.realizada - a.realizada || a.nome.localeCompare(b.nome)),
    porPeriodo,
    semMeta: checklists.filter(checklist => checklist.prevista === null)
  });
});

app.use('/api', api);

app.use((err, req, res, next) => {
  console.error('[erro]', err);
  res.status(500).json({ error: 'erro interno' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 API em http://localhost:${PORT}`);
});

async function shutdown(sig) {
  console.log(`${sig} recebido, encerrando...`);
  server.close(async () => {
    try { await closePool(); } finally { process.exit(0); }
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));