# Deployment Guide — AI Multilingual Mass Communication Platform

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.12+ | Backend runtime |
| Node.js | 20+ | Frontend build |
| PostgreSQL | 16+ | Primary database |
| Docker + Docker Compose | v2+ | Containerized deployment |

---

## Option 1: Local Development (Current Setup)

### Start both servers
```bat
run.bat
```
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Backend only
```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload
```

### Frontend only
```powershell
cd frontend
npm run dev
```

### Run tests
```powershell
cd backend
.venv\Scripts\python.exe -m pytest -v
```

---

## Option 2: Docker Compose (Recommended for Staging/Production)

### 1. Configure environment
```powershell
# Copy root .env.example to .env
Copy-Item .env.example .env

# Edit .env and fill in real values:
# - POSTGRES_PASSWORD
# - JWT_SECRET_KEY  (run: python -c "import secrets; print(secrets.token_urlsafe(32))")
# - GEMINI_API_KEY
# - ALLOWED_ORIGINS (your production domain)
```

### 2. Build and start all services
```bash
docker compose build
docker compose up -d
```

### 3. Verify
```bash
# Health check
curl http://localhost:8000/health

# Frontend
curl http://localhost

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

### 4. Stop
```bash
docker compose down
# To also remove data volume (destructive!):
docker compose down -v
```

---

## Option 3: Cloud VM / VPS (Ubuntu 22.04)

### 1. Install dependencies
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
```

### 2. Clone and configure
```bash
git clone <your-repo-url>
cd AI-Powered-Multilingual-...
cp .env.example .env
nano .env   # fill in production values
```

### 3. Update ALLOWED_ORIGINS in .env
```
ALLOWED_ORIGINS=https://yourdomain.com
```

### 4. Deploy with Docker Compose
```bash
docker compose build --no-cache
docker compose up -d
```

### 5. Setup SSL with certbot (optional)
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET_KEY` | ✅ | Min 32-char random secret |
| `JWT_ALGORITHM` | ✅ | Default: `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Default: `60` |
| `GEMINI_API_KEY` | ⚠️ | Required for AI features |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated frontend URLs |
| `APP_ENV` | Optional | `development` or `production` |
| `POSTGRES_PASSWORD` | Docker only | PostgreSQL root password |

---

## Default Admin Credentials

After first run, create an admin user:
```powershell
cd backend
.venv\Scripts\python.exe app/create_admin.py
```
Or via API:
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Admin","email":"admin@example.com","password":"SecurePass123!","role":"admin"}'
```

---

## Production Checklist

- [ ] `JWT_SECRET_KEY` is a strong random secret (not the dev default)
- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `GEMINI_API_KEY` is set for AI features
- [ ] `ALLOWED_ORIGINS` contains only your production domain(s)
- [ ] SSL certificate configured on your domain
- [ ] PostgreSQL data volume is backed up regularly
- [ ] Log rotation configured for backend logs
- [ ] Remove dev admin account (`admin@example.com`) if created during testing

---

## API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health:** http://localhost:8000/health

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Backend won't start | Check `DATABASE_URL` in `.env`; ensure PostgreSQL is running |
| AI features fail | Set `GEMINI_API_KEY` in `.env` |
| CORS errors in browser | Add your frontend URL to `ALLOWED_ORIGINS` |
| Import page fails | Ensure `/imports` route is in Vite proxy (already fixed) |
| Tests fail | Run `pip install -r requirements.txt` to update dependencies |
