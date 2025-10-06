# InstallPlanner

InstallPlanner is a monorepo containing a FastAPI backend and a Next.js frontend for planning installer schedules. The project ships with Docker Compose for local development and a sample Caddy reverse proxy configuration.

## Getting started

### Prerequisites
- Docker and Docker Compose

### Environment variables
Copy `.env.example` to `.env` (or export the variables manually):

```
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### Run locally with Docker Compose

```bash
cd ops
docker compose up --build
```

- API available at http://localhost:8000
- Web app available at http://localhost:3000

### Direct backend development

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Direct frontend development

```bash
cd web
npm install
npm run dev
```

## API summary
- `GET /installers` – list installers
- `GET /jobs` – list jobs with optional `q` query
- `POST /overrides` – persist overrides
- `POST /schedule` – generate a weekly schedule
- `POST /import/xlsx` – import data from Excel
- `GET /export/xlsx` – export data to Excel
- `GET /export/ics` – export schedule as ICS
- `POST /teams/publish` – push summary to Teams webhook

## Frontend features
- Dashboard with KPIs and navigation
- Jobs grid powered by AG Grid with quick filtering and override drawer
- Weekly schedule view with FullCalendar and Teams publishing shortcut

## Caddy reverse proxy
A sample `Caddyfile` is available in `ops/caddy/Caddyfile`. Configure TLS certificates for production use.

## Roadmap
- Replace in-memory storage with a persistent database
- Enhance scheduling algorithm and conflict resolution
- Add authentication and role-based access control
