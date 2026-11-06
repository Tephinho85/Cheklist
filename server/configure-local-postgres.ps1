$ErrorActionPreference = 'Stop'

$postgresBin = 'C:\Program Files\PostgreSQL\13\bin'
$psql = Join-Path $postgresBin 'psql.exe'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $PSScriptRoot '.env'
$databaseName = 'checklist'

if (-not (Test-Path $psql)) {
  throw "Cliente psql não encontrado em $postgresBin."
}

$postgresSecure = Read-Host 'Senha atual do usuário postgres (entrada oculta)' -AsSecureString
$adminSecure = Read-Host 'Crie uma senha para a conta ADMIN do aplicativo (mínimo 12 caracteres, entrada oculta)' -AsSecureString
if ($adminSecure.Length -lt 12) {
  throw 'A senha ADMIN precisa ter ao menos 12 caracteres.'
}

$postgresPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresSecure)
$adminPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecure)
$random = [Security.Cryptography.RandomNumberGenerator]::Create()
$apiBytes = New-Object byte[] 48
$jwtBytes = New-Object byte[] 48
$random.GetBytes($apiBytes)
$random.GetBytes($jwtBytes)
$apiPassword = [Convert]::ToBase64String($apiBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$jwtSecret = [Convert]::ToBase64String($jwtBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')

try {
  $postgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($postgresPointer)
  $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($adminPointer)
  $env:PGPASSWORD = $postgresPassword

  & $psql -w -h 127.0.0.1 -p 5432 -U postgres -d $databaseName -v ON_ERROR_STOP=1 -c 'SELECT current_database();' | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'Não foi possível conectar à base checklist.' }

  $setupRole = @"
SELECT format('CREATE ROLE checklist_app LOGIN PASSWORD %L', '$apiPassword')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'checklist_app')\gexec
ALTER ROLE checklist_app WITH LOGIN PASSWORD '$apiPassword';
GRANT CONNECT, CREATE ON DATABASE checklist TO checklist_app;
GRANT USAGE, CREATE ON SCHEMA public TO checklist_app;
"@
  $setupRole | & $psql -w -h 127.0.0.1 -p 5432 -U postgres -d $databaseName -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar/configurar o usuário checklist_app.' }

  $escapedApiPassword = [Uri]::EscapeDataString($apiPassword)
  $escapedAdminPassword = [Uri]::EscapeDataString($adminPassword)
  $environment = @"
API_PORT=3000
DATABASE_URL=postgresql://checklist_app:$escapedApiPassword@127.0.0.1:5432/checklist
DATABASE_SSL=false
JWT_SECRET=$jwtSecret
CORS_ORIGINS=http://localhost:4300,http://localhost:8100
BOOTSTRAP_ADMIN_LOGIN=ADMIN
BOOTSTRAP_ADMIN_NAME=Administrador do Sistema
BOOTSTRAP_ADMIN_AREA=SESMT
BOOTSTRAP_ADMIN_PASSWORD=url:$escapedAdminPassword
"@
  [IO.File]::WriteAllText($envFile, $environment, [Text.Encoding]::ASCII)

  Push-Location $repositoryRoot
  try {
    & npm --prefix server run migrate
    if ($LASTEXITCODE -ne 0) { throw 'A migração PostgreSQL falhou.' }

    $environmentLines = Get-Content $envFile | Where-Object { $_ -notmatch '^BOOTSTRAP_ADMIN_PASSWORD=' }
    [IO.File]::WriteAllLines($envFile, [string[]]$environmentLines, [Text.Encoding]::ASCII)

    $env:PGPASSWORD = $apiPassword
    & $psql -w -h 127.0.0.1 -p 5432 -U checklist_app -d $databaseName -v ON_ERROR_STOP=1 -f (Join-Path $PSScriptRoot 'sql\002_test_data.sql')
    if ($LASTEXITCODE -ne 0) { throw 'A carga dos dados de teste falhou.' }
  } finally {
    Pop-Location
  }

  Write-Host 'Base checklist estruturada e dados de demonstração carregados.'
  Write-Host 'Usuário PostgreSQL da API: checklist_app (senha aleatória salva apenas em server/.env).'
  Write-Host 'Login inicial do aplicativo: ADMIN (use a senha definida no prompt oculto).'
  Write-Host 'Inicie a API com: npm run api'
} finally {
  $env:PGPASSWORD = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($postgresPointer)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($adminPointer)
  $random.Dispose()
  [Array]::Clear($apiBytes, 0, $apiBytes.Length)
  [Array]::Clear($jwtBytes, 0, $jwtBytes.Length)
}