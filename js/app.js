// ============================================================
// app.js – Application entry point
//
// Responsibilities:
//   • Declare all shared globals (canvas, ctx, WORLD, state, etc.)
//   • Expose shared helper functions (getGravityPx, pushTrail, …)
//   • Wire up DOM events and input labels
//   • Drive the animation loop
//   • Handle mode switching and the stats panel
//   • Manage the presets feature (auth + CRUD against the backend)
// ============================================================

// ------------------------------------------------------------------
// Canvas & rendering context
// ------------------------------------------------------------------

var canvas = document.getElementById('simCanvas');
var ctx    = canvas.getContext('2d');

// ------------------------------------------------------------------
// DOM references
// ------------------------------------------------------------------

const modeSelect = document.getElementById('modeSelect');
const playBtn    = document.getElementById('playBtn');
const pauseBtn   = document.getElementById('pauseBtn');
const resetBtn   = document.getElementById('resetBtn');
const stepBtn    = document.getElementById('stepBtn');

const conceptText   = document.getElementById('conceptText');
const formulaText   = document.getElementById('formulaText');
const tipText       = document.getElementById('tipText');
const canvasSubtitle = document.getElementById('canvasSubtitle');
const modeChip      = document.getElementById('modeChip');
const learningCards = document.getElementById('learningCards');

const timeStat      = document.getElementById('timeStat');
const heightStat    = document.getElementById('heightStat');
const speedStat     = document.getElementById('speedStat');
const directionStat = document.getElementById('directionStat');
const energyStat    = document.getElementById('energyStat');
const extraStat     = document.getElementById('extraStat');

// Control panel sections (toggled by mode)
const controls = {
  projectile: document.getElementById('projectileControls'),
  gravity:    document.getElementById('gravityControls'),
  blackhole:  document.getElementById('blackHoleControls'),
  freefall:   document.getElementById('freefallControls'),
  spring:     document.getElementById('springControls'),
  collision:  document.getElementById('collisionControls'),
  circular:   document.getElementById('circularControls')
};

// All slider / select inputs – used by mode files and the sim manager
var inputs = {
  velocity:     document.getElementById('velocityInput'),
  angle:        document.getElementById('angleInput'),
  gravity:      document.getElementById('gravityInput'),
  dropHeight:   document.getElementById('dropHeightInput'),
  bounce:       document.getElementById('bounceInput'),
  mass:         document.getElementById('massInput'),
  pull:         document.getElementById('pullInput'),
  orbitSpeed:   document.getElementById('orbitSpeedInput'),
  freefallHeight: document.getElementById('freefallHeightInput'),
  springK:      document.getElementById('springKInput'),
  springMass:   document.getElementById('springMassInput'),
  stretch:      document.getElementById('stretchInput'),
  mass1:        document.getElementById('mass1Input'),
  mass2:        document.getElementById('mass2Input'),
  vel1:         document.getElementById('vel1Input'),
  vel2:         document.getElementById('vel2Input'),
  radius:       document.getElementById('radiusInput'),
  angularSpeed: document.getElementById('angularSpeedInput')
};

// Live value readouts next to each slider label
const valueLabels = {
  velocity:     document.getElementById('velocityValue'),
  angle:        document.getElementById('angleValue'),
  gravity:      document.getElementById('gravityValue'),
  dropHeight:   document.getElementById('dropHeightValue'),
  bounce:       document.getElementById('bounceValue'),
  mass:         document.getElementById('massValue'),
  pull:         document.getElementById('pullValue'),
  orbitSpeed:   document.getElementById('orbitSpeedValue'),
  freefallHeight: document.getElementById('freefallHeightValue'),
  springK:      document.getElementById('springKValue'),
  springMass:   document.getElementById('springMassValue'),
  stretch:      document.getElementById('stretchValue'),
  mass1:        document.getElementById('mass1Value'),
  mass2:        document.getElementById('mass2Value'),
  vel1:         document.getElementById('vel1Value'),
  vel2:         document.getElementById('vel2Value'),
  radius:       document.getElementById('radiusValue'),
  angularSpeed: document.getElementById('angularSpeedValue')
};

// ------------------------------------------------------------------
// World coordinate system
// ------------------------------------------------------------------

var WORLD = {
  width:  canvas.width,
  height: canvas.height,
  floorY: canvas.height - 56,
  scale:  5              // pixels per metre
};

// ------------------------------------------------------------------
// Shared mutable state
// ------------------------------------------------------------------

let  currentMode   = 'projectile';
var  running       = false;
let  lastTimestamp = 0;
let  simTime       = 0;
let  trail         = [];
var  state         = {};

// ------------------------------------------------------------------
// Shared utility helpers (called by mode files and the sim manager)
// ------------------------------------------------------------------

function toRadians(deg) {
  return deg * Math.PI / 180;
}

function getGravityPx() {
  return Number(inputs.gravity.value) * WORLD.scale;
}

function resetTrail(limit = 220) {
  trail       = [];
  trail.limit = limit;
}

function pushTrail(x, y) {
  trail.push({ x, y });
  if (trail.length > trail.limit) trail.shift();
}

// ------------------------------------------------------------------
// Stats panel
// ------------------------------------------------------------------

function setStats({ height = 0, speed = 0, direction = 'At Rest', energy = '--', extra = '--' }) {
  timeStat.textContent      = `${simTime.toFixed(2)} s`;
  heightStat.textContent    = typeof height === 'number' ? `${Math.max(0, height).toFixed(2)} m` : height;
  speedStat.textContent     = typeof speed  === 'number' ? `${Math.abs(speed).toFixed(2)} m/s`  : speed;
  directionStat.textContent = direction;
  energyStat.textContent    = energy;
  extraStat.textContent     = extra;
}

function setLearningCards(items) {
  learningCards.innerHTML = items.map(item => `
    <div class="mini-card">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// Slider value labels
// ------------------------------------------------------------------

function formatValue(key, val) {
  const v = Number(val);
  const map = {
    velocity:      `${v} m/s`,
    angle:         `${v}°`,
    gravity:       `${v.toFixed(1)} m/s²`,
    dropHeight:    `${v} m`,
    bounce:        v.toFixed(2),
    mass:          `${v} kg`,
    pull:          v.toFixed(0),
    orbitSpeed:    `${v} m/s`,
    freefallHeight:`${v} m`,
    springK:       `${v} N/m`,
    springMass:    `${v} kg`,
    stretch:       `${v} px`,
    mass1:         `${v} kg`,
    mass2:         `${v} kg`,
    vel1:          `${v} m/s`,
    vel2:          `${v} m/s`,
    radius:        `${v} px`,
    angularSpeed:  `${v.toFixed(1)} rad/s`
  };
  return map[key] || String(v);
}

function syncValueLabels() {
  Object.entries(inputs).forEach(([key, input]) => {
    if (valueLabels[key]) valueLabels[key].textContent = formatValue(key, input.value);
  });
}

// ------------------------------------------------------------------
// Mode switching
// ------------------------------------------------------------------

const MODE_CONFIG = {
  projectile: {
    chip:     'Projectile Motion',
    subtitle: 'Watch horizontal and vertical motion happen together',
    concept:  'Projectile motion combines forward velocity with downward acceleration from gravity.',
    formula:  'x = v₀cos(θ)t, y = v₀sin(θ)t - 1/2gt²',
    tip:      'The x motion stays steady, but the y motion changes because gravity keeps pulling down.',
    cards: [
      { title: 'Horizontal Motion', text: 'The projectile keeps moving sideways at a steady rate in this simple model.' },
      { title: 'Vertical Motion',   text: 'Gravity slows the object on the way up, stops it at the top, then speeds it up downward.' }
    ]
  },
  gravity: {
    chip:     'Gravity Drop + Bounce',
    subtitle: 'See height, direction, and energy change during each bounce',
    concept:  'A falling object speeds up downward, then loses some energy every time it bounces back up.',
    formula:  'v = v + gt,  bounce speed = previous speed × loss factor',
    tip:      'Each bounce is lower because some energy is lost during impact with the ground.',
    cards: [
      { title: 'Upward vs Downward', text: 'Watch the direction label change as the object goes up and down.' },
      { title: 'Energy Loss',        text: 'Smaller bounce heights show that the collision is not perfectly elastic.' }
    ]
  },
  blackhole: {
    chip:     'Black Hole Orbit',
    subtitle: 'Explore gravity-like pull and curved paths',
    concept:  'A strong central pull bends the path of a moving object and can create an orbit-like motion.',
    formula:  'Force points inward and gets stronger at smaller distances',
    tip:      'Try changing the starting speed. Too slow falls inward, but a better balance curves around the center.',
    cards: [
      { title: 'Curved Motion', text: 'The inward pull keeps changing the direction of velocity, which bends the path.' },
      { title: 'Orbit Balance', text: 'A stronger sideways speed can keep the object circling instead of falling straight in.' }
    ]
  },
  freefall: {
    chip:     'Free Fall Comparison',
    subtitle: 'Compare two objects dropping from the same height',
    concept:  'In simple free fall with no air resistance, different masses fall at the same rate.',
    formula:  'y = 1/2gt²,  v = gt',
    tip:      'Even though the objects look different, they should hit the ground at the same time in this model.',
    cards: [
      { title: 'Mass Independence', text: 'Free-fall acceleration stays the same for both objects in this simplified version.' },
      { title: 'Visual Proof',      text: 'This helps students see that gravity affects both equally when air resistance is ignored.' }
    ]
  },
  spring: {
    chip:     "Hooke's Law Spring",
    subtitle: 'Stretch the spring and watch the restoring force pull it back',
    concept:  'A spring pushes or pulls back toward equilibrium. Bigger stretch means bigger restoring force.',
    formula:  'F = -kx',
    tip:      'A stiffer spring or lighter mass changes how quickly the system oscillates.',
    cards: [
      { title: 'Restoring Force', text: 'The spring always tries to pull the mass back to its equilibrium position.' },
      { title: 'Oscillation',     text: 'The system moves back and forth because velocity and restoring force keep trading roles.' }
    ]
  },
  collision: {
    chip:     'Momentum Collision',
    subtitle: 'See how mass and speed affect a 1D collision',
    concept:  'Momentum depends on both mass and velocity, so heavier or faster objects change the collision result.',
    formula:  'p = mv',
    tip:      'Try a light fast object hitting a heavy slow one and compare what happens after contact.',
    cards: [
      { title: 'Momentum', text: 'Mass and speed both matter. Bigger momentum usually causes a bigger change in the collision.' },
      { title: 'Transfer',  text: 'This mode helps show how motion can move from one object to another during impact.' }
    ]
  },
  circular: {
    chip:     'Uniform Circular Motion',
    subtitle: 'Visualize orbit-like motion at a constant radius',
    concept:  'Circular motion needs inward acceleration even when speed stays constant.',
    formula:  'aᶜ = v²/r',
    tip:      'A tighter radius or faster motion means stronger inward acceleration is needed.',
    cards: [
      { title: 'Centripetal Acceleration', text: 'The object keeps changing direction, which means it is accelerating inward the whole time.' },
      { title: 'Radius vs Speed',          text: 'If speed rises or radius shrinks, the inward acceleration needed becomes bigger.' }
    ]
  }
};

function updateModeUI() {
  currentMode = modeSelect.value;

  // Show only the relevant control section
  Object.entries(controls).forEach(([key, el]) => {
    el.classList.toggle('hidden', key !== currentMode);
  });

  const cfg = MODE_CONFIG[currentMode];
  modeChip.textContent      = cfg.chip;
  canvasSubtitle.textContent = cfg.subtitle;
  conceptText.textContent   = cfg.concept;
  formulaText.textContent   = cfg.formula;
  tipText.textContent       = cfg.tip;
  setLearningCards(cfg.cards);

  resetSimulation();
}

// ------------------------------------------------------------------
// Animation loop
// ------------------------------------------------------------------

function animate(timestamp) {
  if (!running) {
    lastTimestamp = timestamp;
    return;
  }
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.03);
  lastTimestamp = timestamp;
  stepSimulation(dt);
  requestAnimationFrame(animate);
}

// ------------------------------------------------------------------
// Button event listeners
// ------------------------------------------------------------------

playBtn.addEventListener('click', () => {
  if (!running) {
    running = true;
    requestAnimationFrame(animate);
  }
});

pauseBtn.addEventListener('click', () => { running = false; });

resetBtn.addEventListener('click', resetSimulation);

stepBtn.addEventListener('click', () => {
  running = false;
  stepSimulation(0.03);
});

modeSelect.addEventListener('change', updateModeUI);

Object.values(inputs).forEach(input => {
  input.addEventListener('input', () => {
    syncValueLabels();
    if (!running) resetSimulation();
  });
});

// ------------------------------------------------------------------
// Bootstrap
// ------------------------------------------------------------------

syncValueLabels();
updateModeUI();

// ==================================================================
// PRESETS FEATURE – communicates with the Express backend on port 3001
// ==================================================================

// In dev, hit the separate Express server; in production Express serves both.
const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001/api'
  : '/api';

let presetsToken    = localStorage.getItem('presetsToken')    || null;
let presetsUsername = localStorage.getItem('presetsUsername') || null;

// Restore session across page refreshes
if (presetsToken) showLoggedIn();

// ---- Auth --------------------------------------------------------

async function presetsAuth(action) {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const msg      = document.getElementById('authMsg');
  msg.textContent = '';

  if (!username || !password) {
    msg.textContent = 'Please fill in both fields.';
    return;
  }

  try {
    const res  = await fetch(`${API}/auth/${action}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || 'Something went wrong.';
      return;
    }

    presetsToken    = data.token;
    presetsUsername = data.username;
    localStorage.setItem('presetsToken',    presetsToken);
    localStorage.setItem('presetsUsername', presetsUsername);
    showLoggedIn();
    presetsLoadList();
  } catch {
    msg.textContent = 'Cannot reach the backend. Is the server running?';
  }
}

function presetsLogout() {
  presetsToken    = null;
  presetsUsername = null;
  localStorage.removeItem('presetsToken');
  localStorage.removeItem('presetsUsername');
  document.getElementById('loggedInSection').classList.add('hidden');
  document.getElementById('authForm').classList.remove('hidden');
  document.getElementById('authUsername').value  = '';
  document.getElementById('authPassword').value  = '';
  document.getElementById('authMsg').textContent = '';
}

function showLoggedIn() {
  document.getElementById('authForm').classList.add('hidden');
  document.getElementById('loggedInSection').classList.remove('hidden');
  document.getElementById('loggedInUser').textContent = `Logged in as ${presetsUsername}`;
  presetsLoadList();
}

// ---- Save --------------------------------------------------------

async function presetsSave() {
  const name    = document.getElementById('presetNameInput').value.trim();
  const saveMsg = document.getElementById('saveMsg');
  saveMsg.style.color = 'var(--danger)';
  saveMsg.textContent = '';

  if (!name) {
    saveMsg.textContent = 'Please enter a preset name.';
    return;
  }

  // Snapshot every slider value
  const settings = {};
  Object.entries(inputs).forEach(([key, el]) => { settings[key] = el.value; });

  try {
    const res = await fetch(`${API}/presets`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${presetsToken}`
      },
      body: JSON.stringify({ name, mode: currentMode, settings })
    });

    if (res.status === 403) { presetsLogout(); return; }
    const data = await res.json();
    if (!res.ok) { saveMsg.textContent = data.error || 'Save failed.'; return; }

    saveMsg.style.color = 'var(--success)';
    saveMsg.textContent = `"${name}" saved!`;
    document.getElementById('presetNameInput').value = '';
    presetsLoadList();
    setTimeout(() => { saveMsg.textContent = ''; }, 2500);
  } catch {
    saveMsg.textContent = 'Cannot reach the backend.';
  }
}

// ---- Load list ---------------------------------------------------

async function presetsLoadList() {
  const container = document.getElementById('presetsList');
  container.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">Loading…</p>';

  try {
    const res = await fetch(`${API}/presets`, {
      headers: { 'Authorization': `Bearer ${presetsToken}` }
    });

    if (res.status === 403) { presetsLogout(); return; }
    const presets = await res.json();

    if (presets.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No presets saved yet.</p>';
      return;
    }

    container.innerHTML = presets.map(p => `
      <div class="mini-card" id="preset-card-${p.id}" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div id="preset-name-${p.id}">
          <div style="font-weight:700;font-size:0.9rem;">${escHtml(p.name)}</div>
          <div style="font-size:0.8rem;color:var(--muted);">${escHtml(p.mode)}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="primary" onclick="presetsLoad(${p.id})"
            style="width:auto;padding:6px 12px;font-size:0.8rem;border-radius:999px;">Load</button>
          <button class="ghost" onclick="presetsRename(${p.id})"
            style="width:auto;padding:6px 12px;font-size:0.8rem;border-radius:999px;">Rename</button>
          <button class="danger" onclick="presetsDelete(${p.id})"
            style="width:auto;padding:6px 12px;font-size:0.8rem;border-radius:999px;">Delete</button>
        </div>
      </div>
    `).join('');

    // Cache for load-without-refetch
    container.dataset.presets = JSON.stringify(presets);
  } catch {
    container.innerHTML = '<p style="color:var(--danger);font-size:0.85rem;">Could not load presets.</p>';
  }
}

// ---- Load a preset into the sliders ------------------------------

async function presetsLoad(id) {
  const container = document.getElementById('presetsList');
  const presets   = JSON.parse(container.dataset.presets || '[]');
  const preset    = presets.find(p => p.id === id);
  if (!preset) return;

  modeSelect.value = preset.mode;
  Object.entries(preset.settings).forEach(([key, val]) => {
    if (inputs[key]) inputs[key].value = val;
  });

  syncValueLabels();
  updateModeUI();
}

// ---- Delete ------------------------------------------------------

async function presetsDelete(id) {
  try {
    const res = await fetch(`${API}/presets/${id}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${presetsToken}` }
    });
    if (res.status === 403) { presetsLogout(); return; }
    presetsLoadList();
  } catch {
    alert('Could not delete preset. Is the server running?');
  }
}

// ---- Rename ------------------------------------------------------

function presetsRename(id) {
  const container = document.getElementById('presetsList');
  const presets   = JSON.parse(container.dataset.presets || '[]');
  const preset    = presets.find(p => p.id === id);
  if (!preset) return;

  const nameDiv = document.getElementById(`preset-name-${id}`);
  nameDiv.innerHTML = `
    <input id="rename-input-${id}" type="text" value="${escHtml(preset.name)}"
      style="background:var(--card);border:1px solid var(--accent);color:var(--fg);
             padding:4px 8px;border-radius:6px;width:130px;font-size:0.85rem;"
      onkeydown="if(event.key==='Enter')presetsRenameSubmit(${id});if(event.key==='Escape')presetsLoadList();">
    <div style="display:flex;gap:4px;margin-top:4px;">
      <button class="primary" onclick="presetsRenameSubmit(${id})"
        style="width:auto;padding:4px 10px;font-size:0.75rem;border-radius:999px;">Save</button>
      <button class="ghost" onclick="presetsLoadList()"
        style="width:auto;padding:4px 10px;font-size:0.75rem;border-radius:999px;">Cancel</button>
    </div>
  `;
  document.getElementById(`rename-input-${id}`).focus();
}

async function presetsRenameSubmit(id) {
  const input = document.getElementById(`rename-input-${id}`);
  const name  = input ? input.value.trim() : '';
  if (!name) return;

  try {
    const res = await fetch(`${API}/presets/${id}`, {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${presetsToken}`
      },
      body: JSON.stringify({ name })
    });
    if (res.status === 403) { presetsLogout(); return; }
    presetsLoadList();
  } catch {
    presetsLoadList();
  }
}

// ---- XSS helper --------------------------------------------------

function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}