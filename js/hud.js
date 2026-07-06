// Score panel, wave counter, lives strip, and transient on-screen messages.

function drawTopHud(g, game) {
  drawText(g, 'SCORE', 10, 2);
  drawText(g, 'HI-SCORE', 82, 2);
  drawText(g, 'WAVE', 180, 2);
  const hi = Math.max(game.score, game.scores.top().score);
  drawText(g, padNum(game.score, 5), 10, 12);
  drawText(g, padNum(hi, 5), 88, 12);
  drawText(g, padNum(game.wave, 2), 186, 12);
}

function drawBottomHud(g, game) {
  // Baseline the cannon defends (with any bomb craters carved out).
  g.drawImage(game.groundCanvas, 0, CONFIG.GROUND_Y);
  drawText(g, String(game.lives), 8, 246);
  // Reserve cannons (lives beyond the one in play).
  for (let i = 0; i < game.lives - 1 && i < 5; i++) {
    drawSprite(g, 'player', 24 + i * 16, 245);
  }
  if (game.audio.muted) {
    drawText(g, 'MUTED', CONFIG.WIDTH - textWidth('MUTED') - 8, 246);
  } else {
    drawText(g, 'CREDIT 01', CONFIG.WIDTH - textWidth('CREDIT 01') - 8, 246);
  }
}

function drawOsd(g, game) {
  if (game.osd.t > 0) {
    drawTextCentered(g, game.osd.text, 28);
  }
}
