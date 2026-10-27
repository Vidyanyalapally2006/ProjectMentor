# ProjectMentor

An AI-powered project discovery, planning, and publishing platform for students. Get
matched to a project based on your domain, skills, and goals, follow a week-by-week
roadmap with progress tracking and PDF export, ask a context-aware chatbot when you're
stuck, and publish what you build for other students to follow.

- **Frontend:** React + Vite + Tailwind CSS → deploy to **Vercel**
- **Backend:** FastAPI + SQLAlchemy + SQLite → deploy to **Render**
- **Auth:** JWT (bcrypt password hashing)

---

## 1. Project structure

```
projectmentor/
├── frontend/            React app (Vite)
│   ├── src/
│   │   ├── components/  Navbar, Footer, ProjectCard, FilterSidebar, Roadmap,
│   │   │                Chatbot, RatingStars, ProtectedRoute, DiscoveryWizard
│   │   ├── pages/        Landing, Explore, ProjectDetail, Dashboard, Publish,
│   │   │                Profile, Login, Signup
│   │   ├── services/api.js      Axios client (reads VITE_API_URL)
│   │   ├── context/AuthContext.jsx
│   │   ├── App.jsx, main.jsx, index.css
│   ├── package.json, vite.config.js, vercel.json, tailwind.config.js
│   └── .env.example
├── backend/              FastAPI app
│   ├── app/
│   │   ├── main.py       App setup, CORS, rate limiting, startup seeding
│   │   ├── models.py     SQLAlchemy models (UUID primary keys)
│   │   ├── schemas.py    Pydantic request/response schemas
│   │   ├── database.py   SQLite engine/session
│   │   ├── auth.py       JWT + password hashing helpers
│   │   ├── config.py     Environment-driven settings
│   │   ├── seed_data.py  Generates 61 curated projects on first boot
│   │   └── routes/       auth, users, skills, projects, user_projects,
│   │                     reviews, publish, chat
│   ├── requirements.txt, Procfile, render.yaml
│   └── .env.example
└── README.md (this file)
```

---

## 2. Local development

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # defaults work out of the box (SQLite)
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`. On first boot it automatically creates the SQLite
database (`projectmentor.db`) and seeds 60+ curated projects — no manual migration
step needed.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# edit .env.local: VITE_API_URL=http://localhost:8000/api
npm run dev
```

Visit `http://localhost:5173`. Sign up, and you'll be dropped into Explore where you
can run the "Get matched" discovery quiz.

---

## 3. Deploying the backend to Render

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Web Service**, connect the repo, and set the
   **root directory to `backend`**.
3. Render will detect `render.yaml`, or set these manually:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables (Render → Environment):
   - `JWT_SECRET_KEY` — generate a long random string (Render can auto-generate this)
   - `JWT_ALGORITHM` = `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `10080`
   - `DATABASE_URL` = `sqlite:///./projectmentor.db`
   - `CORS_ORIGINS` = your Vercel URL, e.g. `https://projectmentor.vercel.app` (comma-separate multiple origins)
   - `LLM_API_KEY` — optional, see [Chatbot](#5-chatbot-configuration) below
5. Deploy. Render gives you a URL like `https://projectmentor-api.onrender.com`.

**Important — SQLite persistence:** Render's free-tier filesystem is ephemeral, so the
SQLite file resets on every redeploy/restart (it'll simply re-seed on boot, but any
user data will be lost). For real persistence:
- Attach a [Render Disk](https://render.com/docs/disks) mounted at `/data`, and set
  `DATABASE_URL=sqlite:////data/projectmentor.db`, **or**
- Swap in a managed Postgres instance (Render's own Postgres, Supabase, Neon, etc.) —
  the code already uses SQLAlchemy so this only requires changing `DATABASE_URL` and
  adding `psycopg2-binary` to `requirements.txt`.

---

## 4. Deploying the frontend to Vercel

1. In Vercel: **New Project**, import the repo, and set the **root directory to `frontend`**.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`
   (Vercel detects this automatically).
3. Add an environment variable:
   - `VITE_API_URL` = `https://projectmentor-api.onrender.com/api` (your Render URL + `/api`)
4. Deploy. `vercel.json` is already included so client-side routes (e.g.
   `/projects/:id`) don't 404 on refresh.
5. Once deployed, go back to Render and update `CORS_ORIGINS` to include your final
   Vercel URL, then redeploy the backend.

---

## 5. Chatbot configuration

The chatbot works out of the box with built-in placeholder responses (it still reads
the current project's tech stack, datasets, and papers to answer sensibly). To enable
fully dynamic answers, set on the backend:

```
LLM_API_KEY=sk-ant-...
LLM_API_URL=https://api.anthropic.com/v1/messages   # default, override if needed
```

With no key set, `/api/chat` gracefully falls back to rule-based answers — nothing
breaks either way.

---

## 6. Testing the live application

1. **Health check:** `GET https://your-backend.onrender.com/health` → `{"status": "healthy"}`
2. **Sign up** on the deployed frontend, confirm you land on Explore.
3. Run the **"Get matched"** discovery quiz (domain → sub-domain → industry → type →
   skills → timeline → goals) and confirm you get project recommendations.
4. Open a project, click **Start project**, check off a few roadmap tasks, and confirm
   the progress bar updates on your Dashboard.
5. Download the roadmap **PDF**.
6. Leave a **review** and confirm the project's rating updates.
7. **Publish** a project via the form, preview it, confirm it appears under your
   Dashboard's "Published" tab.
8. Open the **chatbot** on a project page and ask about its tech stack or datasets.

---

## 7. Recommendation algorithm

Implemented in `backend/app/routes/projects.py::score_project`:

```
score = 0.40 × domain_match
      + 0.30 × skill_match
      + 0.15 × industry_match
      + 0.10 × project_type_match
      + 0.05 × timeline_match
```

To avoid every student seeing an identical ordering, the candidate pool is scored
deterministically, then the top slice is shuffled using a seed derived from
`hash(user_id + current_timestamp)` before re-sorting by score — so ties are broken
differently per request while stronger matches still float to the top.

---

## 8. Notable implementation choices

- **SQLite + UUID primary keys** as specified — no external database required to run
  locally or on Render's free tier.
- **Rate limiting** via `slowapi` (120 requests/minute/IP by default) and a global
  exception handler so unhandled errors return a clean 500 instead of leaking stack
  traces.
- **Versioning:** published projects track a `version` counter and `version_history`
  JSON log, bumped on every edit.
- Passwords are hashed with **bcrypt** via passlib. `bcrypt` is pinned to `4.0.1` in
  `requirements.txt` — newer 5.x releases have a known incompatibility with
  `passlib==1.7.4`'s backend self-test.

---

## 9. Environment variable reference

**backend/.env**

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./projectmentor.db` | Point at a Render Disk or Postgres for persistence |
| `JWT_SECRET_KEY` | *(dev placeholder)* | Set a long random value in production |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated |
| `LLM_API_KEY` | *(empty)* | Optional, enables live chatbot |
| `LLM_API_URL` | Anthropic Messages endpoint | Override for a different provider |

**frontend/.env**

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Backend base URL including `/api`, no trailing slash |
