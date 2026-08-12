# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack concrete factory e-commerce site ("JBI Beton") for a Kazakhstani concrete products company. Backend: Go + Gin + GORM + PostgreSQL. Frontend: React 18 + TypeScript + Vite + Tailwind CSS. Microservice: separate Go notification service.

## Running the Project

Everything runs locally — there is no Docker setup. You need a local PostgreSQL instance with a `concrete_factory` database before starting the backend.

### Prerequisites: local PostgreSQL
Create the database once (default credentials `postgres/postgres` on `localhost:5432`):
```
createdb -U postgres concrete_factory
```
or via `psql`:
```
psql -U postgres -c "CREATE DATABASE concrete_factory;"
```

### Backend
```
go run main.go
```
Connects to PostgreSQL at `localhost:5432` (override via `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`/`DB_PORT`). Runs on port 8080. On startup it runs migrations, GORM `AutoMigrate`, and seeds admin/product data.

### Frontend
```
cd frontend
npm install
npm run dev
```
Frontend dev server connects to `http://localhost:8080` by default (override with `VITE_API_URL` env var).

### Notification service
```
cd notification-service
go run main.go
```
Runs on port 8081.

## Database Migrations

Uses `golang-migrate`. The Makefile targets require the `migrate` CLI tool:
```
make migrate-up        # apply all migrations
make migrate-down      # roll back one migration
make migrate-version   # show current version
make migrate-force version=N   # force to version N
```

Migrations live in `db/migrations/`. The app also calls `runMigrations()` automatically on startup via `config.ConnectDB()`, followed by GORM `AutoMigrate` as a safety net.

## Running Tests

Tests hit a real PostgreSQL database (no mocks). They use `concrete_factory_test` by default:
```
go test ./handlers/...
```
Override the DB with:
```
TEST_DB_DSN="host=... user=... password=... dbname=... port=5432 sslmode=disable" go test ./handlers/...
```
Tests skip (not fail) when no DB connection is available, except `TestHealthCheck` and `TestRegister_BadRequest` which require no DB.

## Architecture

### Request Flow
1. `main.go` — registers all routes. Public routes have no middleware. Authenticated routes go through `AuthMiddleware` (JWT validation). Admin routes additionally go through `AdminMiddleware` (role check).
2. `middleware/auth_middleware.go` — extracts `userID` and `role` from JWT into Gin context. `JWT_SECRET` env var or falls back to hardcoded default.
3. `handlers/` — one file per resource area. Each handler reads from `config.DB` (global GORM `*gorm.DB`).
4. `config/database.go` — `ConnectDB()` runs on startup: connects to Postgres (with retry), runs SQL migrations, runs GORM AutoMigrate, seeds admin user (from `ADMIN_EMAIL_DEFAULT`/`ADMIN_PASSWORD_DEFAULT` env vars), seeds product/category data if the DB is empty.

### Microservice Communication
The main app calls the notification service over HTTP using the `resty` client (`handlers/notification_client.go`). The notification service URL is configured via `NOTIFICATION_URL` env var (default: `http://localhost:8081`). The notification service is a minimal Gin server with stub responses — it doesn't persist anything.

### Email Notifications
`handlers/email_service.go` sends HTML emails via Gmail SMTP (port 587). Triggered automatically on new inquiries and new orders. Requires `SMTP_USER`, `SMTP_PASSWORD` (Gmail App Password), and `ADMIN_EMAIL` env vars.

### Frontend Architecture
- `src/store/AuthContext.tsx` — global auth state (token + user), persisted to `localStorage`.
- `src/store/CartContext.tsx` — cart state (in-memory only, not persisted).
- `src/api/index.ts` — all API calls through a single axios instance; JWT token automatically injected from `localStorage`.
- `src/i18n/` — i18next setup with three locales: Russian (default), Kazakh, English. Locale persisted to `localStorage`. Translation files are `ru.json`, `kz.json`, `en.json`.
- `src/pages/admin/` — admin panel pages protected by `AdminRoute` component.

### Data Model Relationships
- `Product` belongs to `Category`; has many `ProductSpec` (key-value pairs, cascade delete).
- `Order` belongs to `User`; has many `OrderItem` (cascade delete); has one `Payment`.
- `Inquiry` is standalone (no user FK).
- Products support three localized name/description fields: `_ru`, `_kz`, `_en`.

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | `localhost` | Postgres host |
| `DB_USER` | `postgres` | Postgres user |
| `DB_PASSWORD` | `postgres` | Postgres password |
| `DB_NAME` | `concrete_factory` | Database name |
| `DB_PORT` | `5432` | Postgres port |
| `JWT_SECRET` | `concrete-factory-secret` | JWT signing key |
| `NOTIFICATION_URL` | `http://localhost:8081` | Notification microservice URL |
| `MIGRATIONS_PATH` | `file://db/migrations` | Path for golang-migrate |
| `ADMIN_EMAIL_DEFAULT` | — | Seeds initial admin on first start |
| `ADMIN_PASSWORD_DEFAULT` | — | Seeds initial admin on first start |
| `SMTP_USER` | — | Gmail address for outgoing email |
| `SMTP_PASSWORD` | — | Gmail App Password |
| `ADMIN_EMAIL` | — | Recipient for admin email alerts |
| `VITE_API_URL` | `http://localhost:8080` | Frontend API base URL |
