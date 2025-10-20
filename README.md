# Nurse Service Dummy Project (JS + Bootstrap + MySQL + Node/Express)

This is a minimal **dummy** project demonstrating Admin/Nurse/Patient flows using:
- **Frontend:** Vanilla JS + Bootstrap (static HTML)
- **Backend:** Node.js (Express) with MySQL (mysql2)
- **Database:** MySQL schema + seed

> Note: This is intentionally simple (no auth hashing, no JWT). It's made for learning and UI/API testing.

## Project Structure
```
nurse-service-dummy/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── db.sql
└── frontend/
    ├── index.html
    ├── admin.html
    ├── nurse.html
    └── patient.html
```

## 1) MySQL Setup
1. Create database and tables:
   ```sql
   SOURCE backend/db.sql;
   ```
2. Update **backend/.env** with your MySQL credentials (copy `.env.example` to `.env`).

## 2) Backend
```
cd backend
npm install
npm start
```
The server runs at `http://localhost:5000` by default.

## 3) Frontend
Simply open the HTML files in **frontend/** with a Live Server (or double-click).  
Make sure the backend is running so buttons work.

## Minimal API (no real auth)
- `POST /api/register` — body: `{ name, email, password, role }`
- `POST /api/login` — body: `{ email, password }`
- `GET  /api/appointments?userId=..&role=..` — list filtered by role
- `POST /api/appointments` — body: `{ patient_id, nurse_id, date }`
- `PATCH /api/appointments/:id` — body: partial `{ status, date, nurse_id }`
- `GET /api/users` — Admin only (query: `?role=admin&userId=...`)
- `GET /api/me?userId=...` — returns current user (dummy)

## Default Roles
- `admin`
- `nurse`
- `patient`

## Seed Users (from db.sql)
- Admin: `admin@demo.com` / `admin`
- Nurse: `nurse@demo.com` / `nurse`
- Patient: `patient@demo.com` / `patient`

---

**Security Note**: Passwords are stored in plaintext in this dummy (do not use in production).
