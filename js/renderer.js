// ============================================================
// renderer.js – All canvas drawing logic
//
// Shared globals (declared in index.html / app.js):
//   canvas, ctx, WORLD, state, trail, simTime
//   currentMode, modeChip
// Mode-specific draw functions (declared in mode files):
//   drawProjectile, drawGravity, drawBlackHole
// ============================================================

// ------------------------------------------------------------------
// Background
// ------------------------------------------------------------------

function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.fillStyle = '#09111f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  
    // Floor line
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.floorY + 14);
    ctx.lineTo(canvas.width, WORLD.floorY + 14);
    ctx.stroke();
  }
  
  // ------------------------------------------------------------------
  // Shared primitives (also called by mode files)
  // ------------------------------------------------------------------
  
  function drawTrail(color = 'rgba(110, 231, 255, 0.65)') {
    if (trail.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
  
  function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowBlur = 22;
    ctx.shadowColor = ball.color;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // ------------------------------------------------------------------
  // Mode-specific draw functions
  // ------------------------------------------------------------------
  
  function drawFreeFall() {
    state.balls.forEach(drawBall);
  }
  
  function drawSpring() {
    const block = state.block;
  
    // Spring coils
    ctx.strokeStyle = 'rgba(229,238,252,0.95)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(state.anchorX, block.y);
    const coils = 11;
    const coilLength = (block.x - state.anchorX - block.r) / coils;
    for (let i = 0; i < coils; i++) {
      const x = state.anchorX + i * coilLength;
      const y = block.y + (i % 2 === 0 ? -22 : 22);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(block.x - block.r, block.y);
    ctx.stroke();
  
    // Anchor wall
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(state.anchorX - 18, block.y - 50, 18, 100);
  
    drawTrail('rgba(34,197,94,0.6)');
  
    // Block
    ctx.fillStyle = state.block.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = state.block.color;
    ctx.fillRect(block.x - block.r, block.y - block.r, block.r * 2, block.r * 2);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(block.x - block.r, block.y - block.r, block.r * 2, block.r * 2);
  }
  
  function drawCollision() {
    drawBall(state.a);
    drawBall(state.b);
  }
  
  function drawCircular() {
    const { center, radius, ball } = state;
  
    // Orbit path
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251,191,36,0.28)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  
    // Center pivot
    ctx.beginPath();
    ctx.arc(center.x, center.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  
    drawTrail('rgba(251,191,36,0.55)');
    drawBall(ball);
  }
  
  // ------------------------------------------------------------------
  // HUD overlay
  // ------------------------------------------------------------------
  
  function drawHUD() {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '600 17px Inter, Arial';
    ctx.fillText(modeChip.textContent, 18, 30);
    ctx.font = '14px Inter, Arial';
    ctx.fillStyle = 'rgba(229,238,252,0.72)';
    ctx.fillText('Interactive learning view', 18, 52);
  }
  
  // ------------------------------------------------------------------
  // Main draw dispatcher – called every frame by the sim loop
  // ------------------------------------------------------------------
  
  function draw() {
    drawBackground();
    if (currentMode === 'projectile') drawProjectile();
    if (currentMode === 'gravity')    drawGravity();
    if (currentMode === 'blackhole')  drawBlackHole();
    if (currentMode === 'freefall')   drawFreeFall();
    if (currentMode === 'spring')     drawSpring();
    if (currentMode === 'collision')  drawCollision();
    if (currentMode === 'circular')   drawCircular();
    drawHUD();
  }