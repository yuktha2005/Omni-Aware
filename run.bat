@echo off
echo ===================================================
echo Starting AI Multilingual Communication Platform
echo ===================================================

echo Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

echo Starting Frontend (Vite on http://127.0.0.1:5173)...
start "Frontend - Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Servers have been launched in separate windows!
echo - Frontend: http://127.0.0.1:5173
echo - Backend API Docs: http://127.0.0.1:8000/docs
echo - Admin Login: admin@example.com / TestPassword123!
echo ===================================================