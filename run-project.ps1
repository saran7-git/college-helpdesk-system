$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
$backendDir = Join-Path $scriptDir "backend"
$frontendDir = Join-Path $scriptDir "frontend"

Write-Host "Script dir: $PSScriptRoot"
Write-Host "Backend: $backendDir"
Write-Host "Frontend: $frontendDir"

# Kill processes on ports 5000 and 5173 safely
$ports = @("5000", "5173")
foreach ($port in $ports) {
  $output = netstat -ano 2>$null | Select-String ":$port "
  if ($output) {
    $processId = ($output.Line -split "\s+")[-1]
    if ($processId -match '^\d+$') {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
      Write-Host "Killed PID $processId on port $port"
    }
  }
}
Start-Sleep -Seconds 2

# Install deps if needed
foreach ($dir in @($backendDir, $frontendDir)) {
  if (Test-Path $dir -PathType Container) {
    Push-Location $dir
    if (!(Test-Path "node_modules")) {
      Write-Host "Installing dependencies..."
      npm ci
    } else {
      Write-Host "node_modules found."
    }
    Pop-Location
  } else {
    Write-Warning "Directory missing: $dir. Ensure backend/ and frontend/ are in College_Helpdesk_System-main/"
  }
}

Write-Host "`nStarting dev servers in new terminals (visible)..."

# Start backend
if (Test-Path $backendDir) {
  Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "cd '$backendDir'; npm run dev" -NoNewWindow
} 

Start-Sleep -Seconds 1

# Start frontend
if (Test-Path $frontendDir) {
  Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "cd '$frontendDir'; npm run dev" -NoNewWindow
}

Write-Host "`n✅ Ready! New PowerShell terminals opened."
Write-Host "API Backend: http://localhost:5000"
Write-Host "React Frontend: http://localhost:5173"
Write-Host "`n💡 Tip: First run installs packages (wait 1-2 min)."
Write-Host "Close terminal windows to stop servers."

