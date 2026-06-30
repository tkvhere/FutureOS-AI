$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$venvPath = Join-Path $root '.venv'
$venvPython = Join-Path $venvPath 'Scripts\python.exe'

function Wait-HttpReady {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 5 | Out-Null
      return $true
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  return $false
}

if (-not (Test-Path $venvPython)) {
  Write-Host 'Creating project virtual environment (.venv)...'
  python -m venv $venvPath
}

$coreReady = $false
$mongoDriverReady = $false
try {
  & $venvPython -c "import fastapi, uvicorn, pydantic, jose, passlib" | Out-Null
  $coreReady = $true
} catch {
  $coreReady = $false
}

try {
  & $venvPython -c "import pymongo" | Out-Null
  $mongoDriverReady = $true
} catch {
  $mongoDriverReady = $false
}

if (-not $coreReady) {
  Write-Host 'Installing backend dependencies...'
  & $venvPython -m pip install -r (Join-Path $backend 'requirements.txt') | Out-Null
} elseif (-not $mongoDriverReady) {
  Write-Host 'Installing MongoDB driver...'
  & $venvPython -m pip install pymongo==4.10.1 | Out-Null
} else {
  Write-Host 'Backend dependencies already satisfied. Skipping install.'
}

if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
  Write-Host 'Installing frontend dependencies...'
  Push-Location $frontend
  npm install | Out-Null
  Pop-Location
}

# Make sure the frontend points at the local backend unless a custom value is already set.
$frontendEnvPath = Join-Path $frontend '.env.local'
if (-not (Test-Path $frontendEnvPath)) {
  Set-Content -Path $frontendEnvPath -Value 'VITE_API_URL=http://localhost:8000' -Encoding ASCII
}

Get-Job -Name LifeOutcomeBackend,LifeOutcomeFrontend -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue

$backendPort = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($backendPort -and $backendPort.OwningProcess -gt 4) {
  Stop-Process -Id $backendPort.OwningProcess -Force
}

$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($frontendPort -and $frontendPort.OwningProcess -gt 4) {
  Stop-Process -Id $frontendPort.OwningProcess -Force
}

$backendJob = Start-Job -Name LifeOutcomeBackend -ScriptBlock {
  param($rootPath)
  Set-Location $rootPath
  & ".\.venv\Scripts\python.exe" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
} -ArgumentList $root

$frontendJob = Start-Job -Name LifeOutcomeFrontend -ScriptBlock {
  param($frontendPath)
  Set-Location $frontendPath
  $env:VITE_API_URL = 'http://localhost:8000'
  npm run dev -- --host
} -ArgumentList $frontend

if (-not (Wait-HttpReady -Url 'http://localhost:8000/health' -TimeoutSeconds 60)) {
  Write-Host 'Backend failed to start on http://localhost:8000/health' -ForegroundColor Red
  Receive-Job -Name LifeOutcomeBackend -Keep -ErrorAction SilentlyContinue
  throw 'Backend startup failed.'
}

if (-not (Wait-HttpReady -Url 'http://localhost:5173' -TimeoutSeconds 60)) {
  Write-Host 'Frontend failed to start on http://localhost:5173' -ForegroundColor Red
  Receive-Job -Name LifeOutcomeFrontend -Keep -ErrorAction SilentlyContinue
  throw 'Frontend startup failed.'
}

Write-Host 'Backend and frontend jobs started.'
Write-Host "Backend Job Id: $($backendJob.Id)"
Write-Host "Frontend Job Id: $($frontendJob.Id)"
Write-Host 'Backend: http://localhost:8000/health'
Write-Host 'Frontend: http://localhost:5173/'
