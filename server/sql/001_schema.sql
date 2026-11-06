CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  signature_profile TEXT NOT NULL CHECK (signature_profile IN ('TITULAR', 'AUXILIAR')),
  access_level TEXT NOT NULL CHECK (access_level IN ('OPERADOR', 'SUPERVISOR')),
  can_sign BOOLEAN NOT NULL DEFAULT FALSE,
  screen_permissions TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklists (
  code TEXT PRIMARY KEY,
  revision TEXT NOT NULL,
  description TEXT NOT NULL,
  area TEXT NOT NULL,
  monthly_inspection_goal INTEGER NOT NULL DEFAULT 0 CHECK (monthly_inspection_goal >= 0),
  items JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(items) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS area_managers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  checklist_code TEXT NOT NULL,
  checklist_description TEXT NOT NULL,
  checklist_revision TEXT,
  area TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL,
  responsible_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  responsible_name TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(responses) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inspections_executed_at_idx ON inspections (executed_at);
CREATE INDEX IF NOT EXISTS inspections_checklist_code_idx ON inspections (checklist_code);
CREATE INDEX IF NOT EXISTS inspections_responsible_idx ON inspections (responsible_user_id);

CREATE TABLE IF NOT EXISTS service_orders (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  inspection_id TEXT,
  checklist_code TEXT NOT NULL,
  checklist_description TEXT NOT NULL,
  checklist_revision TEXT NOT NULL DEFAULT '',
  item_code TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  irregularity TEXT NOT NULL,
  requested_correction TEXT NOT NULL,
  area TEXT NOT NULL,
  manager_id TEXT REFERENCES area_managers(id) ON DELETE SET NULL,
  manager_name TEXT NOT NULL,
  manager_email TEXT NOT NULL,
  manager_whatsapp TEXT NOT NULL,
  requester TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  correction_deadline DATE,
  deadline_reported_by TEXT,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA')),
  notification_status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (notification_status IN ('PENDENTE', 'ENVIADA', 'FALHOU')),
  history JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(history) = 'array'),
  observations TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS service_orders_area_idx ON service_orders (area);
CREATE INDEX IF NOT EXISTS service_orders_deadline_idx ON service_orders (correction_deadline) WHERE status <> 'CONCLUIDA';
CREATE INDEX IF NOT EXISTS service_orders_checklist_idx ON service_orders (checklist_code);

CREATE TABLE IF NOT EXISTS service_order_counters (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL CHECK (last_number > 0)
);

CREATE TABLE IF NOT EXISTS service_order_photos (
  id TEXT PRIMARY KEY,
  service_order_id TEXT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  photo_kind TEXT NOT NULL CHECK (photo_kind IN ('antes', 'depois')),
  mime_type TEXT NOT NULL,
  image_data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_order_id, photo_kind)
);

CREATE TABLE IF NOT EXISTS notification_jobs (
  id BIGSERIAL PRIMARY KEY,
  service_order_id TEXT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('OS_OPENED', 'DEADLINE_SOON', 'OVERDUE')),
  dedupe_key TEXT NOT NULL UNIQUE,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_started_at TIMESTAMPTZ,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_jobs_pending_idx
  ON notification_jobs (next_attempt_at, scheduled_at) WHERE status = 'PENDING';
ALTER TABLE notification_jobs ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  route TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_events_user_created_idx ON audit_events (user_id, created_at DESC);