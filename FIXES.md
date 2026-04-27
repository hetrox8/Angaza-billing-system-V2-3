# Angaza Billing System — Bug Fixes & Frontend

## Bugs Fixed

### 1. 🔴 CRITICAL — `main.ts`: Middleware binding crash
**File**: `backend/src/main.ts`

**Bug**: 
```ts
// BROKEN — loses `this` context, crashes on first request
app.use(new CompanyMiddleware(app.get(CompaniesService)).use);
```

**Fix**:
```ts
// FIXED — arrow function preserves `this`
const companyMiddleware = new CompanyMiddleware(app.get(CompaniesService));
app.use((req, res, next) => companyMiddleware.use(req, res, next));
```
This was the **primary crash** — any request through Express would call `.use` with `this === undefined`,
causing `Cannot read properties of undefined` the moment middleware tried to access `this.companiesService`.

---

### 2. 🔴 CRITICAL — `company.entity.ts`: Missing auto-generation of `uuid` and `licenseKey`
**File**: `backend/src/companies/entities/company.entity.ts`

**Bug**: Both `uuid` and `licenseKey` columns are `unique: true` and non-nullable with **no default value or auto-generation**. Any `POST /companies` without those fields would throw a TypeORM/Postgres NOT NULL violation.

**Fix**: Added `@BeforeInsert()` hook that auto-generates UUID v4 for `uuid` and a formatted license key for `licenseKey`.

---

### 3. 🔴 CRITICAL — `user.entity.ts`: Missing auto-generation of `uuid`
**File**: `backend/src/auth/entities/user.entity.ts`

**Bug**: Same as above — `uuid` is required unique but never auto-generated.

**Fix**: Added `@BeforeInsert()` to auto-generate UUID v4.

---

### 4. 🟡 IMPORTANT — `Dockerfile`: Copies host `node_modules` into image
**File**: `backend/Dockerfile`

**Bug**:
```dockerfile
# BROKEN — only works if node_modules exists on host (never does in CI / fresh clone)
COPY node_modules ./node_modules
```

**Fix**: Switched to proper multi-stage build with `npm ci` inside Docker:
```dockerfile
FROM node:20-alpine AS builder
RUN npm ci
RUN npm run build

FROM node:20-alpine AS production
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
```

---

### 5. 🟡 IMPORTANT — `.env` file in wrong location
**Bug**: Root-level `.env` is never loaded. `ConfigModule.forRoot()` inside `backend/` only picks up `.env` from within the `backend/` directory.

**Fix**: Added `backend/.env` with correct values. The root `.env` is unused.

---

### 6. 🟢 MINOR — Missing `uuid` npm package
**Bug**: Entities use `import { v4 as uuidv4 } from 'uuid'` but `uuid` was not in `package.json`.

**Fix**: Added `uuid@^9.0.1` to dependencies and `@types/uuid@^9.0.8` to devDependencies.

---

### 7. 🟢 MINOR — Missing `ValidationPipe` and CORS
**Bug**: `@nestjs/class-validator` DTOs were declared but `ValidationPipe` was never registered — meaning DTO validation was silently skipped. CORS was also missing, blocking the frontend.

**Fix**: Added `app.useGlobalPipes(new ValidationPipe(...))` and `app.enableCors({...})` in `main.ts`.

---

## Frontend Added

A full React + TypeScript frontend was added at `frontend/` with:

- **Login page** — connects to `POST /auth/login`, stores JWT in localStorage
- **Dashboard** — shows live stats from `GET /companies` (company count, active, trial, user totals)
- **Companies page** — full CRUD: list, create, edit, delete via the companies REST API
- **Auth guard** — protected routes redirect to `/login` if not authenticated
- **JWT interceptor** — auto-attaches Bearer token to all API requests, auto-redirects on 401

### Tech Stack
- Vite + React 18 + TypeScript
- React Router v6
- Axios with JWT interceptor
- CSS Modules (no extra CSS-in-JS deps)
- Dark luxury design system (Syne + DM Sans fonts)

---

## How to Run

### Option A: Docker (recommended)
```bash
# From project root
docker compose up --build
```
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api
- Frontend: http://localhost:5173

### Option B: Local dev
```bash
# Terminal 1 — start Postgres
docker compose up postgres redis -d

# Terminal 2 — backend
cd backend
cp .env.example .env   # already done, backend/.env exists
npm install
npm run start:dev

# Terminal 3 — frontend
cd frontend
npm install
npm run dev
```

### First user
There's no seed script yet — register via Swagger at http://localhost:3000/api:

1. `POST /companies` — create your first company (get back the `id`)
2. `POST /auth/register` — create admin user with that `companyId`
3. `POST /auth/login` — get your JWT
4. Login at http://localhost:5173
