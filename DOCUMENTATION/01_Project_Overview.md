# 01. Project Overview

> **Recruitment Prototype Notice:** This application is a technical machine-test prototype built for **WhiteMatrix Software Solutions (AI Full Stack Engineer Assessment)**. It is **not** affiliated with, endorsed by, or authorized by the Government of Kerala or the Chief Minister's Office. All sample records and credentials are fictional.

## 1. Problem Statement
Citizens across Kerala face public service issues spanning roads and infrastructure, healthcare, education, electricity, drinking water, revenue records, sanitation, and public transport. Without a structured, transparent digital intake and tracking system, complaints risk misrouting, unmonitored delays, and lack of verifiable accountability between citizens, the Chief Minister's Office (CMO), and line departments.

## 2. Objectives
- Provide a **public-facing informational portal** explaining the grievance redressal mission, workflow, participating departments, FAQ, public tracking, and contact enquiry intake.
- Enable **registered citizens** to submit grievances across all 14 Kerala districts with optional supporting evidence and receive an immediate unique Reference ID (`KL-CMO-YYYY-XXXXXX`).
- Empower the **Chief Minister's Office (CMO)** to monitor statewide volumes, filter by district/category/priority/status, detect overdue SLA items, assign departments/officers, add internal/public remarks, escalate delays, inspect district/department charts, and verify resolution reports.
- Enable **Department Officers** to access department-assigned queues, log field investigation progress, upload Action-Taken Reports (ATR), and return grievances to the CMO for closure verification.
- Integrate an **AI Grievance Assistant** powered by Google Gemini (`gemini-3.1-flash-lite`) with a clearly labelled heuristic fallback to provide advisory department/category suggestions, priority recommendations, short CMO summaries, and potential duplicate alerts while keeping humans in final control.

## 3. Scope & Core Features
| Module | Key Capabilities |
| :--- | :--- |
| **Public Website** | Home (intro, CTAs, live stats, featured departments), About Us, How It Works, Departments Directory, Contact Us (persisted to MongoDB), FAQ, and Public Reference Tracker. |
| **Citizen Portal** | JWT registration/login, Submit Grievance with AI assistant & file attachment, Reference ID generator, Citizen Dashboard (Total/Pending/Resolved counts), Timeline & Remarks view, Post-resolution Rating/Feedback, and Reopen workflow. |
| **CMO Dashboard** | Total/Pending/Resolved/Overdue/ATR-Ready KPIs, multi-criteria filtering, Recharts district & department visualizations, Assignment to Department/Officer, Internal & Public Remarks, Escalation, ATR Approval/Return, and Contact Enquiry management. |
| **Department Officer Portal** | Department-scoped queue, Supporting Attachment downloads, Investigation progress updates (`In Progress`), ATR submission with file upload back to CMO. |
| **Mandatory Workflow** | Strict 5-status lifecycle (`Submitted`, `Under Review`, `In Progress`, `Resolved`, `Reopened`) with immutable timestamped audit logs (`GrievanceHistory`). |

## 4. Tools & Third-Party Libraries Disclosed
- **Frontend:** React 18, Vite 5, React Router DOM, Tailwind CSS, Recharts, Lucide React, Axios.
- **Backend:** Node.js 20, Express 4, Mongoose 8 (MongoDB Atlas), JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `express-rate-limit`, `multer` v2, `zod`, `morgan`.
- **AI Provider:** Google Gemini REST API (`gemini-3.1-flash-lite`) with rule-assisted heuristic fallback.
- **Testing:** Vitest & Supertest.
- **Development Assistance:** Built with Antigravity AI coding assistant using open-source npm packages listed above.
