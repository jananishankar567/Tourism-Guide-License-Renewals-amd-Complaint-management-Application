# Tourism Guide Portal

A web portal for tourism guide license applications and administration, with
tourist tools for finding licensed guides, verifying tour participation, and
submitting feedback or complaints after an authenticated tour.

## Main features

- Guide account registration, license application, status tracking, renewals,
  and complaint management.
- Admin and officer dashboards for reviewing applications, licenses, renewals,
  complaints, and reports.
- Tourist accounts, licensed-guide discovery, QR/code tour check-in, and GPS
  verification at registered attractions.
- Tourist feedback and complaints linked to verified tours, with admin review.
- Admin attraction management with map search and coordinate selection.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A MongoDB connection (local or hosted)

## Local setup

Open two terminals from the project root.

### 1. Configure and start the backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `backend/.env` and set at least `MONGODB_URI` and a long, random
`JWT_SECRET`. Email credentials are optional; configure `EMAIL_USER` and
`EMAIL_PASS` if email delivery is needed.

The API listens on port `5000` by default. Set `PORT` to change it.

### 2. Configure and start the frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

`VITE_API_URL` defaults to `http://localhost:5000`; set it in
`frontend/.env.local` when the API is hosted elsewhere.

## Create the first admin account

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_FULL_NAME` in the backend
environment, then run:

```powershell
cd backend
node createAdmin.js
```

Use a unique password of at least 12 characters. The script will not replace an
existing admin account.

## Validation

```powershell
cd frontend
npm run lint
npm run build
cd ..\backend
npm test
```

## Before publishing

- Keep `.env` and `.env.local` files private. Commit only the example templates.
- `backend/uploads/` contains runtime application documents and is excluded
  from Git. Do not publish applicant identity documents or uploaded evidence.
- Configure production MongoDB, JWT, email, API URL, and hosting settings
  separately; do not use development credentials in production.
- The map picker uses public OpenStreetMap/Nominatim services and requires
  internet access.
