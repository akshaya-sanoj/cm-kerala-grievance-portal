# 06. Setup and Testing

## 1. Prerequisites
- **Node.js:** v20+ and **npm** v10+
- **MongoDB Atlas:** Free-tier cluster URI (or local MongoDB instance)
- **Google Gemini API Key:** Free-tier key from [Google AI Studio](https://aistudio.google.com/) (optional for fallback testing; recommended for live AI mode)

## 2. Environment Configuration
Copy the example environment templates into `backend/.env` and `frontend/.env` (never commit `.env` files to Git):

### `backend/.env`
| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP port | `5000` |
| `NODE_ENV` | Runtime mode | `development` / `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/cm_kerala_grievance` |
| `JWT_SECRET` | Secret key for signing JWTs | Strong 32+ char random string |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin(s) | `http://localhost:5173` |
| `UPLOAD_DIR` | Directory for uploaded attachments | `uploads` |
| `MAX_FILE_SIZE_MB` | Upload size cap in MB | `5` |
| `GEMINI_API_KEY` | Google Gemini API key | Your AI Studio key |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `AUTO_SEED_IF_EMPTY` | Auto-seed demo data if DB is empty | `true` |
| `SERVE_FRONTEND` | Let Express serve `frontend/dist` | `false` (or `true` for single-service deploy) |

### `frontend/.env`
| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## 3. Installation & Running Locally
```bash
# 1. Install backend and frontend dependencies
npm run install:all

# 2. Configure backend/.env and frontend/.env

# 3. (Optional) Explicitly reset & seed fictional demo records
npm --prefix backend run seed:reset

# 4. Run backend (Terminal 1) and frontend (Terminal 2)
npm run dev:backend
npm run dev:frontend
```
- Frontend dev server: `http://localhost:5173`
- Backend API server: `http://localhost:5000/api/health`

## 4. Production Build & Deployment Notes
- Build frontend bundle: `npm run build` (`frontend/dist/`)
- **Split Hosting (Recommended):**
  - Deploy `backend/` on **Render** or **Railway** (`npm start`, root directory `backend`, set `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGIN=https://<your-vercel-app>.vercel.app`).
  - Deploy `frontend/` on **Vercel** (root directory `frontend`, framework Vite, `VITE_API_URL=https://<your-render-service>.onrender.com/api`; `frontend/vercel.json` handles SPA routing).
- **Single-Service Hosting:** Set `SERVE_FRONTEND=true` in Render/Railway after running `npm run build` inside `frontend/`.

## 5. Automated & Manual Test Cases

Run the automated Vitest + Supertest suite:
```bash
npm test
```

### Automated Test Coverage (`backend/tests/portal.test.js`)
| Test Case | Verifies |
| :--- | :--- |
| Domain Constants & IDs | 14 Kerala districts, 5 mandatory workflow statuses, unique `KL-CMO-YYYY-XXXXXX` ID generation |
| SLA & Overdue Calculation | Priority-based due dates (`High` +3d, `Medium` +7d, `Low` +14d) and overdue detection |
| AI Duplicate Flagging | Lexical similarity + district boost flags matching grievances in same district |
| AI Labelled Fallback | Missing `GEMINI_API_KEY` triggers `heuristic-fallback-v1` with `isFallback: true` and `fallbackReason` |
| Live Gemini JSON Parsing | Valid Gemini REST response parsed cleanly into `source: 'gemini'`, `isFallback: false` |
| Public Health & Metadata | `GET /api/health` and `GET /api/metadata` return 200 |
| RBAC & Auth Guards | Blocks unauthenticated (401) and cross-role requests (403) across Citizen, CMO, and Officer endpoints |
| Registration Role Lock | Rejects privilege escalation if request attempts `role: "cmo_admin"` |
| Department Scoping | Department Officer gets 403 when requesting a grievance assigned to another department |
| Public Tracker Privacy | `GET /api/grievances/track/:ref` queries `isInternal: false` only |
| End-to-End Workflow | Citizen submit -> CMO assign (`Under Review`) -> Officer investigate (`In Progress`) & ATR -> CMO approve (`Resolved`) -> Feedback -> Citizen reopen (`Reopened`) |
