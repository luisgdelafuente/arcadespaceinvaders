// Axis-aligned collision helpers. Collision boxes throughout the game are the
// tight bounds of the visible sprite pixels (plus per-pixel masks for shields).

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// The player cannon's visible shape: a narrow turret over a wide base.
// Two boxes hug the pixels far better than one full-sprite box.
function pointInPlayer(px, py, pw, ph, x, y) {
  return rectsOverlap(x, y, 1, 1, px + 5, py, 3, 3) ||
         rectsOverlap(x, y, 1, 1, px, py + 3, 13, 5);
}

function rectHitsPlayer(px, py, x, y, w, h) {
  return rectsOverlap(x, y, w, h, px + 5, py, 3, 3) ||
         rectsOverlap(x, y, w, h, px + 1, py + 3, 11, 5);
}
