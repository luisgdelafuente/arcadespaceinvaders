// Projectiles: the single player shot and the enemy bombs.

// Only one player shot may exist at a time (enforced by Game).
class PlayerShot {
  constructor(x, y) {
    this.x = x;      // 1 px wide
    this.y = y;      // 4 px tall, y = top
    this.w = 1;
    this.h = 4;
  }

  draw(g) {
    g.fillRect(this.x, this.y | 0, 1, this.h);
  }
}

// Enemy bombs. type: 0 = aimed "squiggly", 1 = column-table "plunger",
// 2 = random-column "rolling". Each has a 4-frame 3x7 animation.
const BOMB_SPRITES = ['bombS', 'bombP', 'bombR'];

class Bomb {
  constructor(x, y, type, speed) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.speed = speed;
    this.w = 3;
    this.h = 7;
    this.t = 0;
    this.dead = false;
  }

  update() {
    this.t++;
    this.y += this.speed;
  }

  draw(g) {
    const frame = ((this.t >> 2) % 4);
    drawSprite(g, BOMB_SPRITES[this.type] + frame, this.x, this.y);
  }
}
