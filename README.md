# AI-Powered Multilingual Public Awareness and Mass Communication Platform

A full-stack platform for audience segmentation, recipient management, and multilingual public awareness campaigns.

---

## Quick Start (Run Entire Project)

### Windows (One-Click)
Run either of the following scripts from the project root:
- **Command Prompt**: `run.bat`
- **PowerShell**: `.\run.ps1`

### Or Manual Start:

#### 1. Start the Backend (FastAPI)
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload
```
- **API Root**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

#### 2. Start the Frontend (Vite + React)
```powershell
cd frontend
npm run dev
```
- **Web App**: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## Default Admin Credentials

- **Email**: `admin@example.com`
- **Password**: `TestPassword123!`

---

## Running Tests & Linters

### Backend Tests
```powershell
cd backend
.\venv\Scripts\python.exe -m pytest
```

### Frontend Build & Lint
```powershell
cd frontend
npm run lint
npm run build
```

---

## Architecture & Tech Stack

### Backend
- **Framework**: FastAPI with Uvicorn
- **Database**: PostgreSQL (SQLAlchemy ORM)
- **Auth**: JWT (OAuth2 Password Bearer) with passlib bcrypt
- **Data Processing**: Pandas, OpenPyXL

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with automatic JWT injection & error handling