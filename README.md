# Physics Sim: Learning Edition

An interactive, browser-based physics simulator for students. Explore 7 physics concepts in real time, with user accounts and saved presets backed by a REST API and SQLite database.

**Live app:** ` https://cis444-physics-simulator.onrender.com/`
---

## Features

- **7 simulation modes** — Projectile Motion, Gravity Drop & Bounce, Black Hole Orbit, Free Fall Comparison, Hooke's Law Spring, Momentum Collision, Uniform Circular Motion
- **Real-time canvas rendering** with adjustable sliders for mass, velocity, gravity, angle, and more
- **Educational panels** — concept explanation, formula, and student tips for each mode
- **Live data display** — time, height, speed, direction, energy/force updated every frame
- **User accounts** — register and log in with JWT-based authentication
- **Save & load presets** — store any slider configuration to your account and reload it later
- **Rename and delete presets** — full preset management
- **Responsive layout** — adapts to desktop, tablet, and mobile

---

## Architecture

3-tier architecture:

```
Browser (HTML/CSS/JS)
        ↓  HTTP (GET/POST/PATCH/DELETE)
Express REST API  (Node.js)
        ↓  SQL queries
SQLite Database  (better-sqlite3)
```

The Express server serves both the static frontend and the `/api` routes from a single deployment, so there is no cross-origin issue in production.

---

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | Vanilla HTML / CSS / JavaScript                     |
| Backend    | Node.js + Express                                   |
| Database   | SQLite via `better-sqlite3`                         |
| Auth       | JWT (`jsonwebtoken`) + bcrypt password hashing      |
| Deployment | Render (free tier)                                  |

---

## Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/ThanhDatVu111/CIS444-Physics-simulator.git
cd CIS444-Physics-simulator
```

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env   # edit JWT_SECRET with any long random string
npm start              # runs on http://localhost:3001
```

For auto-reload during development:
```bash
npm run dev   # requires Node 18+
```

### 3. Open the frontend

The backend serves the frontend automatically. Visit:
```
http://localhost:3001
```

> In development the frontend also works by opening `index.html` directly in a browser — it auto-detects localhost and points API calls to port 3001.

---

## API Endpoints

| Method   | Path                 | Auth      | Description                        |
|----------|----------------------|-----------|------------------------------------|
| POST     | `/api/auth/register` | No        | Create a new account               |
| POST     | `/api/auth/login`    | No        | Log in and receive a JWT token     |
| GET      | `/api/presets`       | Yes (JWT) | List all presets for the logged-in user |
| POST     | `/api/presets`       | Yes (JWT) | Save a new preset                  |
| PATCH    | `/api/presets/:id`   | Yes (JWT) | Rename an existing preset          |
| DELETE   | `/api/presets/:id`   | Yes (JWT) | Delete a preset                    |
| GET      | `/api/health`        | No        | Health check — returns `{status:"ok"}` |

All protected routes require `Authorization: Bearer <token>` in the request header.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
PORT=3001
JWT_SECRET=your_long_random_secret_here
DB_PATH=./physics.db
```

Never commit your `.env` file — it is listed in `.gitignore`.

---

## Database Schema

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

## Security

- Passwords hashed with **bcrypt** (10 salt rounds) — never stored in plain text
- **JWT tokens** expire after 24 hours and are sent via `Authorization` header
- All preset routes verify the token and that the preset belongs to the requesting user before any read/write/delete
- User input is validated on both frontend and backend before hitting the database
- HTML output is escaped with a custom `escHtml()` function to prevent XSS
- Secrets (`JWT_SECRET`) are stored in environment variables, not source control
- Parameterized SQL queries via `better-sqlite3` prevent SQL injection

---

## Project Structure

```
CIS444-Physics-simulator/
├── index.html                  # Frontend — simulation UI, canvas, presets panel
├── style.css                   # Base styles (extended styles live in index.html)
├── js/                         # Frontend modules
│   ├── app.js                  # App entry point
│   ├── simulationManager.js    # Simulation loop and state management
│   ├── renderer.js             # Canvas rendering helpers
│   └── modes/
│       ├── projectile.js       # Projectile motion logic
│       ├── gravity.js          # Gravity drop and bounce logic
│       └── blackhole.js        # Black hole orbit logic
└── backend/
    ├── server.js               # Express entry point, CORS, static serving
    ├── db.js                   # SQLite connection and schema init
    ├── package.json
    ├── .env.example            # Environment variable template
    ├── middleware/
    │   └── auth.js             # JWT verification middleware
    └── routes/
        ├── auth.js             # POST /api/auth/register, /api/auth/login
        └── presets.js          # GET/POST/PATCH/DELETE /api/presets
```

---

## Simulation Modes

| Mode | Physics Concept |
|------|----------------|
| Projectile Motion | Horizontal + vertical motion under gravity |
| Gravity Drop & Bounce | Free fall with energy loss on bounce |
| Black Hole Orbit | Inverse-square gravitational attraction |
| Free Fall Comparison | Two masses falling at the same rate (equivalence principle) |
| Hooke's Law Spring | Oscillating mass on spring (F = −kx) |
| Momentum Collision | 1D elastic collision between two masses |
| Uniform Circular Motion | Constant-radius orbit with centripetal acceleration |

---

## Team

- Thanh Dat Vu
- Thomas Haugstad
- Alex Zamora Posadas
- David Baez


CIS 444 – Web Programming, Spring 2026

---

## Libraries & Credits

- [Express](https://expressjs.com/) — web framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — synchronous SQLite driver
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JWT implementation
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) — password hashing
- [dotenv](https://github.com/motdotla/dotenv) — environment variable loading
- [cors](https://github.com/expressjs/cors) — CORS middleware
- **Claude (Anthropic)** – https://claude.ai
- **ChatGPT (OpenAI)** – https://chatgpt.com
