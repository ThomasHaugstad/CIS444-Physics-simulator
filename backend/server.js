// server.js – Express entry point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { authenticate } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const presetRoutes = require('./routes/presets');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow the frontend served from any localhost or 127.0.0.1 port (covers Live Server, serve, etc.)
app.use(cors({
  origin: /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Public routes – no token needed
app.use('/api/auth', authRoutes);

// Protected routes – JWT required for all preset operations
app.use('/api/presets', authenticate, presetRoutes);

// Simple health check so you can confirm the server is up
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Physics Sim API running at http://localhost:${PORT}`);
});
