// routes/presets.js – CRUD for saved simulation presets
// All routes here require a valid JWT (applied in server.js via authenticate middleware)
const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/presets
// Returns all presets belonging to the logged-in user
router.get('/', (req, res) => {
  const presets = db.prepare(
    'SELECT id, name, mode, settings_json, created_at FROM presets WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);

  // Parse the stored JSON string back into an object before sending
  const parsed = presets.map(p => ({
    ...p,
    settings: JSON.parse(p.settings_json)
  }));

  res.json(parsed);
});

// POST /api/presets
// Body: { name, mode, settings }  (settings is a plain JS object)
router.post('/', (req, res) => {
  const { name, mode, settings } = req.body;

  if (!name || !mode || !settings) {
    return res.status(400).json({ error: 'name, mode, and settings are required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO presets (user_id, name, mode, settings_json) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, name, mode, JSON.stringify(settings));

    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      mode,
      settings
    });
  } catch (err) {
    console.error('Save preset error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/presets/:id
// Only allows deletion of presets that belong to the logged-in user
router.delete('/:id', (req, res) => {
  const presetId = Number(req.params.id);

  const preset = db.prepare(
    'SELECT id FROM presets WHERE id = ? AND user_id = ?'
  ).get(presetId, req.user.id);

  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }

  db.prepare('DELETE FROM presets WHERE id = ?').run(presetId);
  res.json({ message: 'Deleted' });
});

module.exports = router;
