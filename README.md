# Physics Simulator – Learning Edition

An interactive physics sandbox for students with a **Save & Load Presets** backend checkpoint.

## Tech stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | Vanilla HTML / CSS / JS (single `index.html`) |
| Backend    | Node.js + Express                           |
| Database   | SQLite via `better-sqlite3`                 |
| Auth       | JWT (`jsonwebtoken`) + password hashing (`bcrypt`) |

---

## Running locally

### 1. Start the backend

```bash
cd backend

# First time only – install dependencies
npm install

# Copy the example env file and edit if needed
cp .env.example .env

# Start the server (runs on http://localhost:3001)
npm start
```

For auto-reload during development:
```bash
npm run dev   # uses Node's built-in --watch flag (Node 18+)
```

### 2. Open the frontend

Open `index.html` directly in your browser, **or** serve it with any static server:

```bash
# From the project root
npx serve .
# Then visit http://localhost:3000
```

> The backend must be running on port 3001 before you use the Presets panel.

---

## API endpoints

| Method | Path                    | Auth required | Description             |
|--------|-------------------------|---------------|-------------------------|
| POST   | `/api/auth/register`    | No            | Create a new account    |
| POST   | `/api/auth/login`       | No            | Get a JWT token         |
| GET    | `/api/presets`          | Yes (JWT)     | List your saved presets |
| POST   | `/api/presets`          | Yes (JWT)     | Save a new preset       |
| DELETE | `/api/presets/:id`      | Yes (JWT)     | Delete a preset by id   |
| GET    | `/api/health`           | No            | Confirm server is up    |

Pass the token as `Authorization: Bearer <token>` in the request header.

---

## Database schema

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE presets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  mode          TEXT    NOT NULL,
  settings_json TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

---

## Project structure

```
CIS444-Physics-simulator/
├── index.html              # Frontend – simulation + presets UI
├── style.css               # (intentionally minimal; styles live in index.html)
├── js/                     # Simulation logic (untouched)
│   ├── app.js
│   ├── simulationManager.js
│   ├── renderer.js
│   └── modes/
│       ├── blackhole.js
│       ├── gravity.js
│       └── projectile.js
└── backend/
    ├── server.js           # Express entry point
    ├── db.js               # SQLite setup
    ├── package.json
    ├── .env.example
    ├── middleware/
    │   └── auth.js         # JWT verification middleware
    └── routes/
        ├── auth.js         # /api/auth/register and /api/auth/login
        └── presets.js      # /api/presets CRUD
```
