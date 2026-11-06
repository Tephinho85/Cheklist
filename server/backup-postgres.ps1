$ErrorActionPreference = 'Stop'

$postgresBin = 'C:\Program Files\PostgreSQL\13\bin'
$pgDump = Join-Path $postgresBin 'pg_dump.exe'
$envFile = Join-Path $PSScriptRoot '.env'
$backupDirectory = Join-Path $PSScriptRoot 'backups'

if (-not (Test-Path $pgDump)) { throw "pg_dump não encontrado em $postgresBin." }
if (-not (Test-Path $envFile)) { throw 'server/.env não encontrado; configure a conexão da API primeiro.' }

$databaseLine = Get-Content $envFile | Where-Object { $_.StartsWith('DATABASE_URL=') } | Select-Object -First 1
if (-not $databaseLine) { throw 'DATABASE_URL não encontrada.' }
$databaseUrl = [Uri]$databaseLine.Substring('DATABASE_URL='.Length)
$credentials = $databaseUrl.UserInfo.Split(':', 2)
$env:PGPASSWORD = [Uri]::UnescapeDataString($credentials[1])
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
$fileName = 'checklist-{0}.dump' -f (Get-Date -Format 'yyyyMMdd-HHmmss')
$backupFile = Join-Path $backupDirectory $fileName

try {
  & $pgDump --host=$databaseUrl.Host --port=$databaseUrl.Port --username=([Uri]::UnescapeDataString($credentials[0])) `
    --dbname=$databaseUrl.AbsolutePath.TrimStart('/') --format=custom --no-owner --file=$backupFile
  if ($LASTEXITCODE -ne 0) { throw 'pg_dump falhou.' }
  Write-Host "Backup criado: $backupFile"
} finally {
  $env:PGPASSWORD = $null
}