# API e PostgreSQL

O aplicativo Ionic deve chamar esta API; ele nunca recebe credenciais do PostgreSQL. A API conecta ao banco usando `DATABASE_URL`, valida tokens e aplica as permissões armazenadas em `app_users.screen_permissions`.

## Configuração

### PostgreSQL local neste computador

Para a instalação PostgreSQL 13 padrão no Windows, execute na raiz do repositório:

```powershell
.\server\configure-local-postgres.ps1
```

O script usa a base vazia `checklist`, pede a senha administrativa e a senha inicial do app em prompts ocultos, cria o usuário de serviço `checklist_app` com senha aleatória, aplica o esquema, cria a conta `ADMIN` e carrega os dados de demonstração definidos em `sql/002_test_data.sql`. A senha inicial de bootstrap é removida do `.env` após criar a conta. O ambiente de desenvolvimento já aponta `apiBaseUrl` para `http://localhost:3000/api`.

Depois do setup, inicie/reinicie a API com `npm --prefix server start`. A conta inicial do app usa login `ADMIN` e a senha escolhida no prompt. Dados carregados são demonstração; nenhum e-mail ou WhatsApp de teste é enviado.

Se a conta `ADMIN` já existia antes das últimas permissões de tela, execute `npm --prefix server run migrate` e reinicie a API. A migração atualiza essa conta bootstrap para supervisor e garante as permissões de checklist, OS e dashboard.

### E-mail e alertas de OS

Configure `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD` e `MAIL_FROM` em `server/.env`. A fila persiste em `notification_jobs`; jobs são processados em lotes, com retentativas e deduplicação. Enquanto SMTP não estiver configurado, permanecem pendentes. O worker envia **somente e-mail**; WhatsApp não é chamado.

O worker verifica prazos próximos e vencidos a cada minuto. O período de aviso antecipado pode ser ajustado por `REMINDER_DAYS_BEFORE` (padrão 3). O processo API precisa permanecer ativo; para alta disponibilidade, mova o worker para um serviço separado ou scheduler gerenciado.

### Backup

No Windows com PostgreSQL 13 instalado no caminho padrão, gere um backup com:

```powershell
.\server\backup-postgres.ps1
```

O arquivo custom-format vai para `server/backups/` (ignorado pelo Git). Armazene uma cópia fora da máquina e teste a restauração periodicamente com `pg_restore` em uma base de teste. Em produção, configure retenção e backup automatizado no provedor PostgreSQL.

As rotas mutáveis geram eventos em `audit_events`; login tem limite de cinco tentativas a cada 15 minutos por processo.

### Provisionamento manual ou servidor hospedado

1. Crie um banco PostgreSQL e um usuário próprio para a aplicação, com permissões somente nesse banco. Exemplo executado no `psql` por um administrador do PostgreSQL:

	```sql
	CREATE ROLE app_user LOGIN PASSWORD 'defina-uma-senha-forte';
	CREATE DATABASE app_checklist OWNER app_user;
	```

2. Copie `server/.env.example` para `server/.env` e configure `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` e o bootstrap administrativo. Para Supabase, use a connection string PostgreSQL do painel (preferencialmente o pooler em ambientes serverless), habilite SSL (padrão) e configure `DATABASE_SSL_CA` com o caminho (absoluto ou relativo a `server/`) do certificado CA baixado nas configurações de conexão SSL do projeto. O certificado é validado; não desative a validação para contornar erros TLS. `DATABASE_SSL=false` só deve ser usado em PostgreSQL local sem SSL. Gere um segredo para JWT com `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
3. Instale as dependências com `npm install` dentro de `server`.
4. Execute `npm run migrate` e depois `npm start`.
5. O desenvolvimento usa `http://localhost:3000/api`. Em produção, `src/environments/environment.prod.ts` usa `/api`, esperando que o host do frontend encaminhe esse caminho para a API. Se frontend e API estiverem em hosts diferentes, configure `apiBaseUrl` com a URL HTTPS pública da API e inclua a origem do frontend em `CORS_ORIGINS`.

O `BOOTSTRAP_ADMIN_PASSWORD` é lido somente pelo processo servidor e convertido em hash scrypt. Remova a variável de ambiente depois da criação da conta. Não versione `.env` nem compartilhe a senha do banco.

Após a primeira migração, use o usuário criado em `BOOTSTRAP_ADMIN_LOGIN` para cadastrar outras contas pela tela **Gerenciar Usuários**. Senhas devem ter ao menos 12 caracteres e nunca são devolvidas pela API.

## Rotas principais

- `POST /api/auth/login`
- `GET /api/auth/me`
- `/api/users`
- `/api/checklists`
- `/api/inspections`
- `/api/managers`
- `/api/service-orders`
- `/api/dashboard?period=AAAA-MM`

Rotas de dados exigem token Bearer e permissão específica. Operadores recebem apenas dados da própria área; supervisores podem consultar todas as áreas. Fotos ficam na tabela `service_order_photos`.

O projeto não tinha PostgreSQL nem Docker disponíveis no ambiente de desenvolvimento. A API e as migrações podem ser verificadas aqui, mas a conexão real depende de um servidor PostgreSQL acessível e da configuração do arquivo `.env`.