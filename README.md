# CM Kerala – Chief Minister's Public Grievance Redressal Portal (Recruitment Prototype)

> **Recruitment Prototype Disclaimer:** This application was built exclusively for the **WhiteMatrix Software Solutions – AI Full Stack Engineer Machine Test Assignment**. It is **not** an official portal of the Government of Kerala or the Chief Minister's Office, nor does it imply any authorization or endorsement. All seeded users, departments, and grievances are **fictional sample data** for demonstration only.

A full-stack public grievance redressal platform connecting citizens, the Chief Minister's Office (CMO), and government department officers with an end-to-end audited lifecycle (`Submitted` → `Under Review` → `In Progress` → `Resolved` / `Reopened`) and a **Google Gemini AI Grievance Assistant** (with a clearly labelled heuristic fallback).

---

## Core Modules Implemented

1. **Public Website**
   - **Home (`/`)**: Portal introduction, quick Reference ID tracker, live database stats, workflow overview, and featured departments.
   - **About Us (`/about`)**, **How It Works (`/how-it-works`)**, **Departments (`/departments`)**, **FAQ (`/faq`)**, **Contact Us (`/contact` saved to MongoDB)**, and **Public Track Grievance (`/track`)**.
2. **Citizen Portal**
   - Registration & JWT login (`/register`, `/login`), Submit Grievance (`/citizen/submit`) with Kerala district/category selection, file upload (`.jpg`, `.png`, `.pdf`, `.doc`, etc.), and integrated **AI Grievance Assistant**.
   - Unique Reference ID (`KL-CMO-YYYY-XXXXXX`), Citizen Dashboard with Total/Pending/Resolved counts, CMO/officer updates, post-resolution **Feedback**, and **Reopen Grievance** workflow.
3. **Chief Minister's Office (CMO) Dashboard (`/cmo/dashboard`)**
   - Total, Pending, Resolved, Overdue, and ATR-Pending KPIs.
   - Multi-criteria filtering (district, category, priority, status, department, overdue, ATR pending, search).
   - Assign/forward to departments & officers, internal vs public remarks, escalation of delayed grievances, ATR review (Approve -> `Resolved` or Return), Contact Enquiries tab, and **Recharts** district-wise & department-wise charts + tables.
4. **Department Officer Dashboard (`/officer/dashboard`)**
   - Department-scoped queue, attachment download, investigation progress updates (`In Progress`), and Action-Taken Report (ATR) + file upload back to CMO.
5. **Mandatory AI Grievance Assistant (`backend/src/services/aiService.js`)**
   - Uses **Google Gemini API (`gemini-2.5-flash`)** to suggest department, category, priority (`Low`/`Medium`/`High`), generate a short CMO summary, and flag potential duplicates.
   - Clearly labels fallback mode (`heuristic-fallback-v1`) if `GEMINI_API_KEY` is unavailable. AI outputs are strictly advisory and require human review.

---

## Tech Stack

- **Frontend:** React 18, Vite 5, React Router v6, Tailwind CSS, Recharts, Lucide Icons, Axios
- **Backend:** Node.js 20, Express.js, Mongoose 8, JWT (`jsonwebtoken`), `bcryptjs`, `multer` v2, `zod`, `helmet`, `express-rate-limit`
- **Database:** MongoDB Atlas (8 collections: `User`, `Department`, `Grievance`, `GrievanceHistory`, `DepartmentAssignment`, `Attachment`, `CitizenFeedback`, `ContactEnquiry`)
- **AI:** Google Gemini REST API (`gemini-2.5-flash`) + labelled fallback
- **Testing:** Vitest + Supertest

---

## Evaluator Demo Credentials (Fictional Test Accounts)

Password for all seeded test accounts: **`DemoPass@2026`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **CMO Administrator** | `cmo@kerala-demo.gov.in` | Full dashboard, assign/forward, remarks, escalate, ATR review, analytics |
| **Citizen Demo** | `citizen@kerala-demo.in` | Submit grievance + AI assist, dashboard, feedback, reopen |
| **PWD Officer** | `pwd.officer@kerala-demo.gov.in` | Public Works Department queue, investigate, submit ATR |
| **Health Officer** | `health.officer@kerala-demo.gov.in` | Health & Family Welfare queue (includes overdue demo grievance) |
| **KSEB Officer** | `kseb.officer@kerala-demo.gov.in` | Electricity Board queue |
| **KWA Officer** | `kwa.officer@kerala-demo.gov.in` | Kerala Water Authority queue |

Sample public Reference IDs to test on `/track`: `KL-CMO-2026-100101`, `KL-CMO-2026-100102` (Overdue & Escalated), `KL-CMO-2026-100103` (Resolved), `KL-CMO-2026-100105` (Submitted), `KL-CMO-2026-100106` (Reopened).

*(You can also click any account on the `/login` page to auto-fill credentials.)*

---

## Quick Local Setup

```bash
# 1. Install dependencies for backend and frontend
npm run install:all

# 2. Configure environment files (do NOT commit .env files)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in MONGODB_URI, JWT_SECRET, and GEMINI_API_KEY in backend/.env

# 3. Run backend (auto-seeds fictional demo data if DB is empty) & frontend
npm run dev:backend
npm run dev:frontend
```

Run automated tests:
```bash
npm test
```

---

## Architecture & Documentation

- [01_Project_Overview.md](./DOCUMENTATION/01_Project_Overview.md)
- [02_System_Architecture.md](./DOCUMENTATION/02_System_Architecture.md) — Diagram: [system-architecture.svg](./DOCUMENTATION/diagrams/system-architecture.svg)
- [03_Database_Design.md](./DOCUMENTATION/03_Database_Design.md) — ER Diagram: [database-er.svg](./DOCUMENTATION/diagrams/database-er.svg)
- [04_API_Documentation.md](./DOCUMENTATION/04_API_Documentation.md)
- [05_AI_Integration.md](./DOCUMENTATION/05_AI_Integration.md)
- [06_Setup_and_Testing.md](./DOCUMENTATION/06_Setup_and_Testing.md)
- [07_User_Guide.md](./DOCUMENTATION/07_User_Guide.md)

### Tools & Services Disclosure
Developed with open-source libraries (`react`, `vite`, `tailwindcss`, `recharts`, `express`, `mongoose`, `zod`, `multer`, `jsonwebtoken`, `bcryptjs`, `vitest`, `supertest`), Google Gemini API, MongoDB Atlas, and Antigravity AI coding assistance.
