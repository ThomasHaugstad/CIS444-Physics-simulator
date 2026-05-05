// ============================================================
// simulationManager.js – Physics update logic & state factories
//
// Shared globals (declared in index.html / app.js):
//   state, WORLD, inputs, running, simTime, trail, currentMode
// Shared helpers (declared in renderer.js):
//   drawTrail, drawBall, draw
// Shared helpers (declared in app.js):
//   getGravityPx, pushTrail, resetTrail, setStats
// Mode-specific create/update/stats functions (declared in mode files):
//   createProjectileState, updateProjectile, updateProjectileStats
//   createGravityState,    updateGravity,    updateGravityStats
//   createBlackHoleState,  updateBlackHole,  updateBlackHoleStats
// ============================================================

function createFreeFallState() {
    const h = Number(inputs.freefallHeight.value);
    state = {
      balls: [
        { x: WORLD.width / 2 - 80, y: WORLD.floorY - h * WORLD.scale, vy: 0, r: 14, mass: 10, color: '#6ee7ff' },
        { x: WORLD.width / 2 + 80, y: WORLD.floorY - h * WORLD.scale, vy: 0, r: 24, mass: 26, color: '#fbbf24' }
      ]
    };
    resetTrail(120);
  }
  
  function createSpringState() {
    const stretch = Number(inputs.stretch.value);
    state = {
      anchorX: 120,
      equilibriumX: 280,
      mass: Number(inputs.springMass.value),
      k: Number(inputs.springK.value),
      block: {
        x: 280 + stretch,
        y: WORLD.height / 2,
        vx: 0,
        r: 26,
        color: '#22c55e'
      }
    };
    resetTrail(260);
  }
  
  function createCollisionState() {
    const m1 = Number(inputs.mass1.value);
    const m2 = Number(inputs.mass2.value);
    state = {
      collided: false,
      a: { x: 150,               y: WORLD.floorY, vx:  Number(inputs.vel1.value), r: Math.max(14, m1 / 1.2), mass: m1, color: '#6ee7ff' },
      b: { x: WORLD.width - 180, y: WORLD.floorY, vx: -Number(inputs.vel2.value), r: Math.max(14, m2 / 1.2), mass: m2, color: '#f472b6' }
    };
    resetTrail(100);
  }
  
  function createCircularState() {
    state = {
      center:  { x: WORLD.width / 2, y: WORLD.height / 2 },
      radius:  Number(inputs.radius.value),
      angular: Number(inputs.angularSpeed.value),
      theta:   -Math.PI / 2,
      ball:    { r: 12, color: '#fbbf24' }
    };
    resetTrail(240);
  }
  
  // ------------------------------------------------------------------
  // Reset – rebuilds initial state for whatever mode is active
  // ------------------------------------------------------------------
  
  function resetSimulation() {
    running       = false;
    lastTimestamp = 0;
    simTime       = 0;
  
    if (currentMode === 'projectile') createProjectileState();
    if (currentMode === 'gravity')    createGravityState();
    if (currentMode === 'blackhole')  createBlackHoleState();
    if (currentMode === 'freefall')   createFreeFallState();
    if (currentMode === 'spring')     createSpringState();
    if (currentMode === 'collision')  createCollisionState();
    if (currentMode === 'circular')   createCircularState();
  
    updateStats();
    draw();
  }
  
  // ------------------------------------------------------------------
  // Update functions – inline modes
  // ------------------------------------------------------------------
  
  function updateFreeFall(dt) {
    const g = getGravityPx();
    state.balls.forEach(ball => {
      if (ball.y < WORLD.floorY) {
        ball.vy += g * dt;
        ball.y  += ball.vy * dt;
        if (ball.y > WORLD.floorY) ball.y = WORLD.floorY;
      }
    });
    const avgX = (state.balls[0].x + state.balls[1].x) / 2;
    const avgY = (state.balls[0].y + state.balls[1].y) / 2;
    pushTrail(avgX, avgY);
    if (state.balls.every(ball => ball.y >= WORLD.floorY)) running = false;
  }
  
  function updateSpring(dt) {
    const block = state.block;
    const x     = block.x - state.equilibriumX;
    const accel = -(state.k / state.mass) * x;
    block.vx += accel * dt * 12;
    block.vx *= 0.996;
    block.x  += block.vx * dt * 60;
    pushTrail(block.x, block.y);
    if (Math.abs(block.vx) < 0.02 && Math.abs(x) < 0.4 && simTime > 0.8) running = false;
  }
  
  function updateCollision(dt) {
    const a = state.a;
    const b = state.b;
    a.x += a.vx * dt;
    b.x += b.vx * dt;
  
    if (!state.collided && a.x + a.r >= b.x - b.r) {
      const totalM = a.mass + b.mass;
      const newV1  = ((a.mass - b.mass) / totalM) * a.vx + ((2 * b.mass) / totalM) * b.vx;
      const newV2  = ((2 * a.mass)      / totalM) * a.vx + ((b.mass - a.mass) / totalM) * b.vx;
      a.vx          = newV1;
      b.vx          = newV2;
      state.collided = true;
    }
  
    if (a.x < -100 || b.x > WORLD.width + 100) running = false;
  }
  
  function updateCircular(dt) {
    state.theta += state.angular * dt;
    const { center, radius } = state;
    const x = center.x + radius * Math.cos(state.theta);
    const y = center.y + radius * Math.sin(state.theta);
    state.ball.x = x;
    state.ball.y = y;
    pushTrail(x, y);
  }
  
  // ------------------------------------------------------------------
  // Stats update – dispatches to mode-specific or inline handler
  // ------------------------------------------------------------------
  
  function updateStats() {
    if (currentMode === 'projectile') { updateProjectileStats(); return; }
    if (currentMode === 'gravity')    { updateGravityStats();    return; }
    if (currentMode === 'blackhole')  { updateBlackHoleStats();  return; }
  
    if (currentMode === 'freefall') {
      const h     = (WORLD.floorY - state.balls[0].y) / WORLD.scale;
      const speed = Math.abs(state.balls[0].vy) / WORLD.scale;
      const landed = state.balls.every(ball => ball.y >= WORLD.floorY) ? 'Both Landed' : 'Falling';
      setStats({
        height:    h,
        speed,
        direction: landed,
        energy:    `g ${Number(inputs.gravity.value).toFixed(1)} m/s²`,
        extra:     'Masses fall equally'
      });
      return;
    }
  
    if (currentMode === 'spring') {
      const x     = Math.abs((state.block.x - state.equilibriumX) / WORLD.scale);
      const speed = Math.abs(state.block.vx) / 2;
      const force = (state.k * ((state.block.x - state.equilibriumX) / 100)).toFixed(1);
      setStats({
        height:    x,
        speed,
        direction: state.block.vx > 0 ? 'Right' : 'Left',
        energy:    `F ${force} N`,
        extra:     `k ${state.k} N/m`
      });
      return;
    }
  
    if (currentMode === 'collision') {
      const totalP  = (state.a.mass * state.a.vx + state.b.mass * state.b.vx) / WORLD.scale;
      const avgSpeed = (Math.abs(state.a.vx) + Math.abs(state.b.vx)) / (2 * WORLD.scale);
      setStats({
        height:    '1D',
        speed:     avgSpeed,
        direction: state.collided ? 'After Impact' : 'Approaching',
        energy:    `p ${totalP.toFixed(1)}`,
        extra:     state.collided ? 'Momentum transferred' : 'Waiting for collision'
      });
      return;
    }
  
    if (currentMode === 'circular') {
      const radius     = state.radius / WORLD.scale;
      const tangential = (state.angular * state.radius) / WORLD.scale;
      const ac         = ((tangential * tangential) / Math.max(radius, 0.1)).toFixed(2);
      setStats({
        height:    radius,
        speed:     tangential,
        direction: 'Circular',
        energy:    `aᶜ ${ac}`,
        extra:     `ω ${state.angular.toFixed(1)}`
      });
    }
  }
  
  // ------------------------------------------------------------------
  // Step dispatcher – advances physics by dt seconds
  // ------------------------------------------------------------------
  
  function stepSimulation(dt) {
    simTime += dt;
    if (currentMode === 'projectile') updateProjectile(dt);
    if (currentMode === 'gravity')    updateGravity(dt);
    if (currentMode === 'blackhole')  updateBlackHole(dt);
    if (currentMode === 'freefall')   updateFreeFall(dt);
    if (currentMode === 'spring')     updateSpring(dt);
    if (currentMode === 'collision')  updateCollision(dt);
    if (currentMode === 'circular')   updateCircular(dt);
    updateStats();
    draw();
  }