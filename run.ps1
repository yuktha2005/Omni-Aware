Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting AI Multilingual Communication Platform" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$rootDir = $PSScriptRoot
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

Write-Host "Starting Backend (FastAPI on http://127.0.0.1:8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; .\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

Write-Host "Starting Frontend (Vite on http://127.0.0.1:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host ""
Write-Host "Both servers launched in dedicated PowerShell windows!" -ForegroundColor Yellow
Write-Host "  - Frontend:        http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  - Backend API:     http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - Swagger Docs:    http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Admin Email:     admin@example.com" -ForegroundColor White
Write-Host "  - Admin Password:  TestPassword123!" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
