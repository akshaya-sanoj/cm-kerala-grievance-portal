# 07. User Guide

> **Note:** All test accounts below use **fictional sample data** solely for prototype evaluation. Password for all seeded accounts: `DemoPass@2026`.

## 1. Public Website & Anonymous Tracking
1. Open the **Home** page (`/`) to inspect live portal statistics, workflow steps, and featured departments.
2. Explore **About Us**, **How It Works**, **Departments**, and **FAQ**.
3. Use **Contact Us** (`/contact`) to submit an enquiry persisted in MongoDB.
4. Use **Track Grievance** (`/track`) and enter any Reference ID (e.g., `KL-CMO-2026-100101` or `KL-CMO-2026-100103`) to view current status, assigned department, official Action-Taken Report, and public audit timeline.

## 2. Citizen Portal Guide
- **Demo Account:** `citizen@kerala-demo.in` / `DemoPass@2026` (or register a new account at `/register`).
1. Sign in via `/login` (use the 1-click **Auto-fill** button for Citizen Demo).
2. Click **Submit New Grievance** (`/citizen/submit`).
3. Select a Kerala **District**, **Category**, enter **Subject** and **Detailed Description**.
4. Click **Analyze with AI Assistant** to view advisory department, category, priority, CMO summary, and potential duplicate alerts. Click **Apply Suggested Category & Priority** if you agree, or override manually.
5. Optionally attach a supporting file (`.jpg`, `.png`, `.pdf`, `.doc`, `.docx`, `.txt`, max 5 MB) and submit.
6. Copy the generated Reference ID (e.g., `KL-CMO-2026-XXXXXX`) and inspect all submissions in **Citizen Dashboard** (`/citizen/dashboard`).
7. On any **Resolved** grievance detail page, submit a **1–5 Star Rating & Feedback** or click **Reopen Grievance** with a reason if the issue persists.

## 3. Chief Minister's Office (CMO) Administrator Guide
- **Demo Account:** `cmo@kerala-demo.gov.in` / `DemoPass@2026`
1. Sign in to access the **CMO Dashboard** (`/cmo/dashboard`).
2. Review KPI cards (**Total**, **Pending**, **Resolved**, **Overdue (SLA)**, **ATR Ready for Review**).
3. Filter grievances by district, category, priority, status, department, overdue-only, ATR-pending, or search keywords.
4. Click **Open** on any grievance record (`/cmo/grievances/:id`) to:
   - View citizen contact info, description, and download attachments.
   - Review or re-run the **AI Grievance Assistant** triage and duplicate alerts.
   - **Assign / Forward** the grievance to a government department and officer (transitions status to `Under Review`).
   - Add **Internal Administrative Remarks** (hidden from citizens) or public remarks.
   - **Escalate** delayed grievances (`isEscalated: true` + High priority).
   - **Review Department ATR & Resolution**: Approve & mark `Resolved`, or return to the department for follow-up.
5. Switch to the **District & Dept Analytics** tab for interactive Recharts bar charts and breakdown tables, or the **Enquiries** tab to review Contact Us messages.

## 4. Department Officer Guide
- **Demo Accounts:**
  - PWD Officer: `pwd.officer@kerala-demo.gov.in` / `DemoPass@2026`
  - Health Officer: `health.officer@kerala-demo.gov.in` / `DemoPass@2026`
  - KSEB Officer: `kseb.officer@kerala-demo.gov.in` / `DemoPass@2026`
  - KWA Officer: `kwa.officer@kerala-demo.gov.in` / `DemoPass@2026`
1. Sign in to view only grievances forwarded to your department (`/officer/dashboard`).
2. Click **Action** on a grievance (`/officer/grievances/:id`) to inspect complaint details and download citizen evidence.
3. Submit **Investigation Remarks** to move status to `In Progress`.
4. Once resolved on the ground, enter the **Action-Taken Report (ATR)** and optionally upload supporting proof to send it back to the CMO for closure verification.
