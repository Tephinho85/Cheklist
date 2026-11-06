INSERT INTO checklists (code, revision, description, area, monthly_inspection_goal, items)
VALUES (
  '000001',
  '01-04-12-2025',
  'Checklist de Segurança Evaporadores',
  'SESMT',
  4,
  '[
    {"item":"1","descricao":"Condições Gerais e Limpeza","tipoResposta":null,"opcoes":[],"obrigatorio":false,"observacaoTipo":null},
    {"item":"1.1","descricao":"Evaporador apresenta-se limpo, sem acúmulo excessivo de sujeira","tipoResposta":"Selecao","opcoes":["Conforme","Não Conforme","Não se Aplica"],"obrigatorio":true,"observacaoTipo":"Texto Livre"},
    {"item":"1.2","descricao":"Não há acúmulo de resíduos de produção no equipamento","tipoResposta":"Selecao","opcoes":["Conforme","Não Conforme","Não se Aplica"],"obrigatorio":true,"observacaoTipo":"Texto Livre"}
  ]'::JSONB
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO area_managers (id, name, area, email, whatsapp, active)
VALUES
  ('manager-test-sesmt', 'Gestor de Teste SESMT', 'SESMT', 'gestor.sesmt@example.invalid', '+5500000000000', TRUE),
  ('manager-test-maintenance', 'Gestor de Teste Manutenção', 'MANUTENCAO', 'gestor.manutencao@example.invalid', '+5500000000001', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO inspections
  (id, checklist_code, checklist_description, checklist_revision, area, executed_at, responsible_name, responses)
VALUES
  ('inspection-test-2026-10-01', '000001', 'Checklist de Segurança Evaporadores', '01-04-12-2025', 'SESMT',
   '2026-10-01T13:00:00Z', 'Responsável de Teste',
  '[{"item":"1.1","pergunta":"Evaporador apresenta-se limpo","resposta":"Conforme","observacao":null},{"item":"1.2","pergunta":"Sem resíduos de produção","resposta":"Não Conforme","observacao":"Resíduos identificados"}]'::JSONB),
  ('inspection-test-2026-10-03', '000001', 'Checklist de Segurança Evaporadores', '01-04-12-2025', 'SESMT',
   '2026-10-03T13:00:00Z', 'Responsável de Teste',
   '[{"item":"1.1","pergunta":"Evaporador apresenta-se limpo","resposta":"Não Conforme","observacao":"Acúmulo de sujeira"},{"item":"1.2","pergunta":"Sem resíduos de produção","resposta":"Conforme","observacao":null}]'::JSONB)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_orders
  (id, number, inspection_id, checklist_code, checklist_description, checklist_revision, item_code,
   question, answer, irregularity, requested_correction, area, manager_id, manager_name, manager_email,
  manager_whatsapp, requester, opened_at, correction_deadline, deadline_reported_by, completed_at, status,
   notification_status, history, observations)
VALUES
  ('os-test-open-2026-00001', 'OS-2026-00001', 'inspection-test-2026-10-03', '000001',
   'Checklist de Segurança Evaporadores', '01-04-12-2025', '1.1',
   'Evaporador apresenta-se limpo, sem acúmulo excessivo de sujeira', 'Não Conforme',
   'Acúmulo de sujeira no evaporador', 'Realizar limpeza e registrar evidência após correção.', 'SESMT',
   'manager-test-sesmt', 'Gestor de Teste SESMT', 'gestor.sesmt@example.invalid', '+5500000000000',
  'Responsável de Teste', '2026-10-03T13:10:00Z', '2026-10-10', 'Gestor de Teste SESMT', NULL, 'EM_ANDAMENTO',
   'PENDENTE',
   '[{"id":"event-test-os-1","data":"2026-10-03T13:10:00Z","autor":"Responsável de Teste","tipo":"ABERTURA","descricao":"OS de demonstração criada para validação."},{"id":"event-test-os-2","data":"2026-10-04T13:10:00Z","autor":"Gestor de Teste SESMT","tipo":"PRAZO","descricao":"Prazo de teste definido para 10/10/2026."}]'::JSONB,
   'Registro de demonstração. Nenhuma notificação externa foi enviada.'),
  ('os-test-closed-2026-00002', 'OS-2026-00002', 'inspection-test-2026-10-01', '000001',
   'Checklist de Segurança Evaporadores', '01-04-12-2025', '1.2',
   'Não há acúmulo de resíduos de produção no equipamento', 'Não Conforme',
   'Resíduos identificados no equipamento', 'Remover resíduos e limpar a área.', 'SESMT',
   'manager-test-sesmt', 'Gestor de Teste SESMT', 'gestor.sesmt@example.invalid', '+5500000000000',
   'Responsável de Teste', '2026-10-01T13:10:00Z', '2026-10-05', 'Gestor de Teste SESMT',
   '2026-10-04T15:00:00Z', 'CONCLUIDA', 'PENDENTE',
   '[{"id":"event-test-os-3","data":"2026-10-01T13:10:00Z","autor":"Responsável de Teste","tipo":"ABERTURA","descricao":"OS de demonstração criada para validação."},{"id":"event-test-os-4","data":"2026-10-04T15:00:00Z","autor":"Supervisor de Teste","tipo":"STATUS","descricao":"Correção concluída (demonstração)."}]'::JSONB,
   'Registro de demonstração concluído.')
ON CONFLICT DO NOTHING;

INSERT INTO service_order_counters (year, last_number)
VALUES (2026, 2)
ON CONFLICT (year) DO UPDATE SET last_number = GREATEST(service_order_counters.last_number, EXCLUDED.last_number);