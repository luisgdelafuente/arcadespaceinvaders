// The player cannon.

class Player {
  constructor() {
    this.w = Sprites.player.w;
    this.h = Sprites.player.h;
    this.x = CONFIG.PLAYER_START_X;
    this.y = CONFIG.PLAYER_Y;
  }

  reset() {
    this.x = CONFIG.PLAYER_START_X;
  }

  move(left, right) {
    if (left && !right) this.x -= CONFIG.PLAYER_SPEED;
    if (right && !left) this.x += CONFIG.PLAYER_SPEED;
    const min = CONFIG.PLAYER_MARGIN;
    const max = CONFIG.WIDTH - CONFIG.PLAYER_MARGIN - this.w;
    if (this.x < min) this.x = min;
    if (this.x > max) this.x = max;
  }

  get centerX() { return this.x + (this.w >> 1); }

  draw(g) {
    drawSprite(g, 'player', this.x, this.y);
  }
}
