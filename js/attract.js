// Attract-mode pilot: a simple demo player that chases targets, dodges
// incoming bombs, and fires with deliberately imperfect timing.

class AttractAI {
  constructor() {
    this.cooldown = 0;
    this.wander = 0;
  }

  decide(game) {
    const p = game.player;
    const px = p.centerX;
    let left = false, right = false, fire = false;

    // Dodge the nearest threatening bomb first.
    let danger = null;
    for (const b of game.bombs) {
      if (b.y > 140 && Math.abs(b.x + 1 - px) < 11) {
        if (!danger || b.y > danger.y) danger = b;
      }
    }
    if (danger) {
      if (danger.x + 1 >= px) left = true; else right = true;
    } else {
      let target = game.formation.nearestColumnX(px);
      if (game.ufo.active) target = game.ufo.x + (game.ufo.w >> 1);
      if (target != null) {
        target += this.wander;
        if (target < px - 1) left = true;
        else if (target > px + 1) right = true;
        else if (!game.shot && this.cooldown <= 0) {
          fire = true;
          this.cooldown = 18 + ((Math.random() * 26) | 0);
          this.wander = ((Math.random() * 7) | 0) - 3;
        }
      }
    }
    if (this.cooldown > 0) this.cooldown--;
    return { left, right, fire };
  }
}
