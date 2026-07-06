// Game orchestration: the state machine, wave setup, collisions, scoring.
// Logic runs at a fixed 60 ticks/s; draw() renders the current state.

const State = {
  BOOT: 'boot',
  TITLE: 'title',
  INSTRUCTIONS: 'instructions',
  ATTRACT: 'attract',
  READY: 'ready',
  PLAYING: 'playing',
  PLAYER_DEATH: 'playerDeath',
  WAVE_CLEARED: 'waveCleared',
  GAME_OVER: 'gameOver',
  HS_ENTRY: 'hsEntry',
  PAUSED: 'paused',
};

class Game {
  constructor(audio, input, scores, renderer) {
    this.audio = audio;
    this.input = input;
    this.scores = scores;
    this.renderer = renderer;

    this.tickCount = 0;
    this.state = State.BOOT;
    this.stateT = 0;
    this.resumeState = null;
    this.osd = { text: '', t: 0 };

    this.groundCanvas = document.createElement('canvas');
    this.groundCanvas.width = CONFIG.WIDTH;
    this.groundCanvas.height = 2;
    this.groundCtx = this.groundCanvas.getContext('2d');

    this.attractMode = false;
    this.ai = new AttractAI();
    this.effects = new Effects();
    this.hsEntry = { name: ['A', 'A', 'A'], slot: 0 };

    this._resetRun();
  }

  // --- Run / wave setup --------------------------------------------------

  _resetRun() {
    this.score = 0;
    this.lives = CONFIG.LIVES_START;
    this.wave = 1;
    this.shotsFired = 0;
    this.extraLifeAwarded = false;
    this.player = new Player();
    this.formation = new Formation(1);
    this.shields = buildShields();
    this.ufo = new Ufo();
    this.bombs = [];
    this.shot = null;
    this.bombTimers = [0, 0, 0];
    this.columnCursor = 0;
    this.heldFireT = 0;
    this.lastStepTick = -999;
    this._resetGround();
    this.effects.clear();
  }

  _newWave() {
    this.formation = new Formation(this.wave);
    this.shields = buildShields();
    this.ufo.abort(this);
    this.ufo = new Ufo();
    this.bombs = [];
    this.shot = null;
    this.bombTimers = this._bombCooldowns();
    this._resetGround();
    this.effects.clear();
    this.player.reset();
  }

  _resetGround() {
    this.groundCtx.clearRect(0, 0, CONFIG.WIDTH, 2);
    this.groundCtx.fillStyle = '#ffffff';
    this.groundCtx.fillRect(0, 0, CONFIG.WIDTH, 1);
  }

  startGame(attract) {
    this.attractMode = !!attract;
    this._resetRun();
    if (attract) this.lives = 1; // demo ends at first death
    this._newWave();
    this.setState(attract ? State.ATTRACT : State.READY);
  }

  // --- State machine -----------------------------------------------------

  setState(s) {
    this.state = s;
    this.stateT = 0;
    if (s === State.READY) this.audio.waveStart();
    if (s === State.GAME_OVER && !this.attractMode) this.audio.gameOver();
    if (s === State.HS_ENTRY) this.hsEntry = { name: ['A', 'A', 'A'], slot: 0 };
    if (s !== State.PLAYING) this.ufo.abort(this);
  }

  showOsd(text) {
    this.osd = { text, t: 90 };
  }

  autoPause() {
    if (this.state === State.PLAYING || this.state === State.READY) {
      this.resumeState = this.state;
      this.setState(State.PAUSED);
    }
  }

  tick() {
    this.tickCount++;
    if (this.osd.t > 0) this.osd.t--;
    this._globalKeys();

    switch (this.state) {
      case State.BOOT: this._tickBoot(); break;
      case State.TITLE: this._tickTitle(); break;
      case State.INSTRUCTIONS: this._tickInstructions(); break;
      case State.ATTRACT: this._tickAttract(); break;
      case State.READY: this._tickReady(); break;
      case State.PLAYING: this._tickPlaying(); break;
      case State.PLAYER_DEATH: this._tickPlayerDeath(); break;
      case State.WAVE_CLEARED: this._tickWaveCleared(); break;
      case State.GAME_OVER: this._tickGameOver(); break;
      case State.HS_ENTRY: this._tickHsEntry(); break;
      case State.PAUSED: this._tickPaused(); break;
    }
    this.stateT++;
  }

  _globalKeys() {
    const inp = this.input;
    if (inp.pressed('KeyM')) {
      this.showOsd(this.audio.toggleMute() ? 'SOUND OFF' : 'SOUND ON');
    }
    if (inp.pressed('Minus')) {
      this.showOsd('VOLUME ' + Math.round(this.audio.setVolume(this.audio.volume - 0.1) * 100) + '%');
    }
    if (inp.pressed('Equal')) {
      this.showOsd('VOLUME ' + Math.round(this.audio.setVolume(this.audio.volume + 0.1) * 100) + '%');
    }
    if (inp.pressed('KeyO')) {
      this.renderer.overlay = !this.renderer.overlay;
      this.showOsd(this.renderer.overlay ? 'OVERLAY ON' : 'OVERLAY OFF');
    }
  }

  // --- Boot / menus ------------------------------------------------------

  _tickBoot() {
    if (this.stateT >= CONFIG.BOOT_TICKS || this.input.pressed('Enter')) {
      this.setState(State.TITLE);
    }
  }

  _tickTitle() {
    if (this.input.pressed('Enter')) { this.startGame(false); return; }
    if (this.input.pressed('KeyI')) { this.setState(State.INSTRUCTIONS); return; }
    if (this.stateT >= CONFIG.TITLE_MAIN_TICKS + CONFIG.TITLE_SCORES_TICKS) {
      this.startGame(true); // attract demo
    }
  }

  _tickInstructions() {
    if (this.input.pressed('Enter')) { this.startGame(false); return; }
    if (this.input.pressed('Escape') || this.input.pressed('KeyB') || this.input.pressed('KeyI')) {
      this.setState(State.TITLE);
    }
  }

  _tickAttract() {
    if (this.input.pressed('Enter')) { this.startGame(false); return; }
    if (this.input.pressed('Escape')) { this.setState(State.TITLE); return; }
    if (this.stateT >= CONFIG.ATTRACT_MAX_TICKS) { this.setState(State.TITLE); return; }
    this._playCore(this.ai.decide(this));
  }

  _tickReady() {
    const dur = this.respawning ? CONFIG.RESPAWN_TICKS : CONFIG.READY_TICKS;
    if (this.stateT >= dur) {
      this.respawning = false;
      this.setState(this.attractMode ? State.ATTRACT : State.PLAYING);
    }
  }

  // --- Core play ---------------------------------------------------------

  _tickPlaying() {
    if (this.input.pressed('KeyP') || this.input.pressed('Escape')) {
      this.resumeState = State.PLAYING;
      this.setState(State.PAUSED);
      return;
    }
    const inp = this.input;
    const ctrl = {
      left: inp.down('ArrowLeft') || inp.down('KeyA'),
      right: inp.down('ArrowRight') || inp.down('KeyD'),
      fire: inp.pressed('Space'),
      fireHeld: inp.down('Space'),
    };
    this._playCore(ctrl);
  }

  // Shared by live play and the attract demo.
  _playCore(ctrl) {
    this.player.move(ctrl.left, ctrl.right);

    // Fire: one shot at a time; a held button re-fires after a short delay.
    let wantFire = ctrl.fire;
    if (!wantFire && ctrl.fireHeld) {
      if (++this.heldFireT >= CONFIG.HELD_FIRE_DELAY) wantFire = true;
    } else if (!ctrl.fireHeld) {
      this.heldFireT = 0;
    }
    if (wantFire && !this.shot) {
      this.shot = new PlayerShot(this.player.centerX, CONFIG.PLAYER_Y - 4);
      this.shotsFired++;
      this.heldFireT = 0;
      this.audio.playerFire();
    }

    this.formation.update(this);
    this.formation.carveShields(this.shields);
    if (this.formation.invasion) {
      this._loseLife(true);
      return;
    }

    this._updateBombs();
    if (this.state !== State.PLAYING && this.state !== State.ATTRACT) return;

    this.ufo.update(this);
    if (this.shot) this._updateShot();
    this.effects.update();

    if (this.formation.liveCount === 0) {
      this.setState(State.WAVE_CLEARED);
    }
  }

  onFormationStep() {
    // Movement pulse follows the formation's pace, floored so the sound
    // stays rhythmic (not a buzz) at extreme speed.
    if (this.tickCount - this.lastStepTick >= CONFIG.STEP_SOUND_MIN_GAP) {
      this.audio.stepPulse();
      this.lastStepTick = this.tickCount;
    }
  }

  // --- Enemy fire --------------------------------------------------------

  _bombCooldowns() {
    return CONFIG.BOMB_COOLDOWNS.map(base => this._bombCooldown(base));
  }

  _bombCooldown(base) {
    const factor = Math.max(
      CONFIG.BOMB_MIN_FACTOR, 1 - (this.wave - 1) * CONFIG.BOMB_WAVE_FACTOR);
    return Math.round((base + Math.random() * CONFIG.BOMB_COOLDOWN_JITTER) * factor);
  }

  _bombSpeed() {
    return Math.min(CONFIG.BOMB_SPEED_MAX,
      CONFIG.BOMB_SPEED_BASE + (this.wave - 1) * CONFIG.BOMB_SPEED_PER_WAVE);
  }

  _updateBombs() {
    // Three firing channels: 0 aimed, 1 column table, 2 random column.
    for (let type = 0; type < 3; type++) {
      if (--this.bombTimers[type] > 0) continue;
      this.bombTimers[type] = this._bombCooldown(CONFIG.BOMB_COOLDOWNS[type]);
      if (this.bombs.length >= CONFIG.MAX_BOMBS) continue;
      const shooter = this._pickShooter(type);
      if (shooter) {
        this.bombs.push(new Bomb(
          shooter.x + (shooter.w >> 1) - 1, shooter.y + shooter.h,
          type, this._bombSpeed()));
        this.audio.bombDrop();
      }
    }

    for (const b of this.bombs) {
      b.update();
      this._collideBomb(b);
      if (this.state === State.PLAYER_DEATH) break;
    }
    this.bombs = this.bombs.filter(b => !b.dead);
  }

  _pickShooter(type) {
    const cols = this.formation.liveColumns();
    if (!cols.length) return null;
    let col;
    if (type === 0) {
      // Aimed: nearest live column to the player.
      let best = cols[0], bestD = Infinity;
      for (const c of cols) {
        const a = this.formation.bottomAlienOfColumn(c);
        const d = Math.abs(a.x + (a.w >> 1) - this.player.centerX);
        if (d < bestD) { bestD = d; best = c; }
      }
      col = best;
    } else if (type === 1) {
      // Column table: cycle a fixed firing order, skipping dead columns.
      const table = CONFIG.BOMB_COLUMN_TABLE;
      for (let i = 0; i < table.length; i++) {
        const c = table[(this.columnCursor + i) % table.length];
        if (cols.includes(c)) {
          col = c;
          this.columnCursor = (this.columnCursor + i + 1) % table.length;
          break;
        }
      }
      if (col === undefined) col = cols[0];
    } else {
      col = cols[(Math.random() * cols.length) | 0];
    }
    return this.formation.bottomAlienOfColumn(col);
  }

  _collideBomb(b) {
    // Player hit — pixel-tight double box.
    if (rectHitsPlayer(this.player.x, this.player.y, b.x, b.y | 0, b.w, b.h)) {
      b.dead = true;
      this._loseLife(false);
      return;
    }
    // Shields.
    for (const s of this.shields) {
      const hit = s.probeRect(b.x, b.y | 0, b.w, b.h, 1);
      if (hit) {
        b.dead = true;
        s.carvePattern(hit.x, hit.y + 2, BOMB_BLAST);
        this.effects.addSprite('bombburst', b.x - 1, s.y + hit.y - 4, 10);
        return;
      }
    }
    // Ground: burst and a small crater bitten out of the baseline.
    if (b.y + b.h >= CONFIG.GROUND_Y) {
      b.dead = true;
      this.effects.addSprite('bombburst', b.x - 1, CONFIG.GROUND_Y - 8, 12);
      this.groundCtx.clearRect(b.x, 0, 3, 2);
    }
  }

  // --- Player shot -------------------------------------------------------

  _updateShot() {
    // Move in 2 px substeps so nothing thin is tunneled through.
    for (let step = 0; step < CONFIG.SHOT_SPEED; step += 2) {
      if (!this.shot) return;
      this.shot.y -= 2;
      this._collideShot();
    }
  }

  _collideShot() {
    const sh = this.shot;

    // Top of the playfield: fizzle with a burst.
    if (sh.y <= CONFIG.SHOT_TOP_Y) {
      this.effects.addSprite('shotburst', sh.x - 4, CONFIG.SHOT_TOP_Y - 2, 12);
      this.shot = null;
      return;
    }
    // Bonus craft.
    if (this.ufo.active &&
        rectsOverlap(sh.x, sh.y, sh.w, sh.h, this.ufo.x | 0, this.ufo.y, this.ufo.w, this.ufo.h)) {
      this._addScore(this.ufo.destroy(this));
      this.shot = null;
      return;
    }
    // Formation.
    const a = this.formation.hitTest(sh.x, sh.y, sh.w, sh.h);
    if (a) {
      this.formation.kill(a);
      this._addScore(CONFIG.ALIEN_POINTS[a.type]);
      this.effects.addSprite('aboom',
        a.x + (a.w >> 1) - 6, a.y + (a.h >> 1) - 3, CONFIG.DEATH_PAUSE_TICKS);
      this.audio.alienDie();
      this.shot = null;
      return;
    }
    // Shields (also blocks friendly fire).
    for (const s of this.shields) {
      const hit = s.probeRect(sh.x, sh.y, sh.w, sh.h, -1);
      if (hit) {
        s.carvePattern(hit.x, hit.y - 2, SHOT_BLAST);
        this.effects.addSprite('shotburst', sh.x - 4, s.y + hit.y - 4, 8);
        this.shot = null;
        return;
      }
    }
    // Enemy bombs can be shot down.
    for (const b of this.bombs) {
      if (!b.dead && rectsOverlap(sh.x, sh.y, sh.w, sh.h, b.x, b.y | 0, b.w, b.h)) {
        b.dead = true;
        this.effects.addSprite('shotburst', b.x - 3, (b.y | 0) - 1, 12);
        this.shot = null;
        return;
      }
    }
  }

  // --- Scoring / lives ---------------------------------------------------

  _addScore(points) {
    this.score += points;
    if (!this.extraLifeAwarded && this.score >= CONFIG.EXTRA_LIFE_SCORE &&
        this.lives < CONFIG.MAX_LIVES) {
      this.extraLifeAwarded = true;
      this.lives++;
      this.audio.extraLife();
      this.showOsd('EXTRA LIFE!');
    }
  }

  _loseLife(byInvasion) {
    this.invadedThisDeath = !!byInvasion;
    this.shot = null;
    this.ufo.abort(this);
    this.audio.playerDie();
    this.setState(State.PLAYER_DEATH);
  }

  _tickPlayerDeath() {
    this.effects.update();
    if (this.stateT < CONFIG.PLAYER_DEATH_TICKS) return;
    this.lives--;
    this.bombs = [];
    if (this.invadedThisDeath) this.formation.liftToStart();
    if (this.lives <= 0) {
      this.setState(State.GAME_OVER);
      return;
    }
    this.player.reset();
    this.respawning = true;
    this.setState(State.READY);
  }

  _tickWaveCleared() {
    this.effects.update();
    if (this.stateT >= CONFIG.WAVE_CLEAR_TICKS) {
      this.wave++;
      this._newWave();
      this.respawning = false;
      this.setState(State.READY);
    }
  }

  _tickGameOver() {
    this.effects.update();
    const done = this.stateT >= CONFIG.GAME_OVER_TICKS;
    const key = this.input.pressed('KeyR') || this.input.pressed('Enter');
    if (this.attractMode) {
      if (done || key) this.setState(State.TITLE);
      return;
    }
    if (this.scores.qualifies(this.score)) {
      if (done || key) this.setState(State.HS_ENTRY);
      return;
    }
    if (key) { this.startGame(false); return; }
    if (done) this.setState(State.TITLE);
  }

  _tickHsEntry() {
    const e = this.hsEntry;
    const inp = this.input;
    const ch = inp.takeChar();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
    if (ch) {
      e.name[e.slot] = ch;
      e.slot = Math.min(2, e.slot + 1);
      this.audio.uiBlip();
    }
    if (inp.pressed('ArrowUp') || inp.pressed('ArrowDown')) {
      const dir = inp.pressed('ArrowUp') ? 1 : -1;
      const i = alphabet.indexOf(e.name[e.slot]);
      e.name[e.slot] = alphabet[(i + dir + alphabet.length) % alphabet.length];
      this.audio.uiBlip();
    }
    if (inp.pressed('ArrowRight')) e.slot = Math.min(2, e.slot + 1);
    if (inp.pressed('ArrowLeft') || inp.pressed('Backspace')) e.slot = Math.max(0, e.slot - 1);
    if (inp.pressed('Enter')) {
      this.scores.insert(e.name.join(''), this.score);
      this.audio.extraLife();
      this.setState(State.TITLE);
    }
  }

  _tickPaused() {
    if (this.input.pressed('KeyP') || this.input.pressed('Escape') || this.input.pressed('Enter')) {
      this.setState(this.resumeState || State.PLAYING);
      this.stateT = 1;
    }
  }

  // --- Drawing -----------------------------------------------------------

  draw(g) {
    g.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    g.fillStyle = '#000000';
    g.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    g.fillStyle = '#ffffff';

    switch (this.state) {
      case State.BOOT: this._drawBoot(g); break;
      case State.TITLE: this._drawTitle(g); break;
      case State.INSTRUCTIONS: this._drawInstructions(g); break;
      case State.HS_ENTRY: this._drawHsEntry(g); break;
      case State.ATTRACT:
        this._drawPlayfield(g, true);
        if ((this.tickCount >> 5) & 1) drawTextCentered(g, 'PRESS ENTER TO START', 132);
        break;
      case State.READY:
        this._drawPlayfield(g, true);
        if (!this.respawning) drawTextCentered(g, 'WAVE ' + padNum(this.wave, 2), 118);
        if ((this.tickCount >> 4) & 1) drawTextCentered(g, 'READY', 132);
        break;
      case State.PLAYING:
        this._drawPlayfield(g, true);
        break;
      case State.PLAYER_DEATH:
        this._drawPlayfield(g, false);
        drawSprite(g, (this.stateT >> 3) & 1 ? 'pboom1' : 'pboom0',
          this.player.x, this.player.y);
        break;
      case State.WAVE_CLEARED:
        this._drawPlayfield(g, true);
        drawTextCentered(g, 'WAVE CLEARED', 118);
        break;
      case State.GAME_OVER: this._drawGameOver(g); break;
      case State.PAUSED:
        this._drawPlayfield(g, true);
        if ((this.tickCount >> 4) & 1) drawTextCentered(g, 'PAUSED', 124, 2);
        break;
    }
    drawOsd(g, this);
  }

  _drawPlayfield(g, withPlayer) {
    drawTopHud(g, this);
    this.ufo.draw(g);
    this.formation.draw(g);
    for (const s of this.shields) s.draw(g);
    for (const b of this.bombs) b.draw(g);
    if (this.shot) this.shot.draw(g);
    if (withPlayer) this.player.draw(g);
    this.effects.draw(g);
    drawBottomHud(g, this);
  }

  _drawBoot(g) {
    const lines = [
      'VR-1 ARCADE BIOS 1.02',
      'RAM 8K ........... OK',
      'VIDEO 224X256 .... OK',
      'SOUND 4CH ........ OK',
      'HI-SCORE MEMORY .. OK',
      '',
      'SYSTEM READY',
    ];
    const shown = Math.min(lines.length, 1 + (this.stateT / 22 | 0));
    for (let i = 0; i < shown; i++) {
      drawText(g, lines[i], 34, 60 + i * 12);
    }
  }

  _drawTitle(g) {
    drawTopHud(g, this);
    if (this.stateT < CONFIG.TITLE_MAIN_TICKS) {
      drawTextCentered(g, 'VOID', 44, 3);
      drawTextCentered(g, 'RAIDERS', 72, 3);
      drawTextCentered(g, '* SCORE ADVANCE TABLE *', 116);
      const rows = [
        ['ufo', '= ? MYSTERY'],
        ['squid0', '= 30 POINTS'],
        ['crab0', '= 20 POINTS'],
        ['octo0', '= 10 POINTS'],
      ];
      for (let i = 0; i < rows.length; i++) {
        const spr = Sprites[rows[i][0]];
        drawSprite(g, rows[i][0], 74 - spr.w, 130 + i * 14 + ((8 - spr.h) >> 1));
        drawText(g, rows[i][1], 82, 130 + i * 14);
      }
      if ((this.tickCount >> 4) & 1) drawTextCentered(g, 'PRESS ENTER TO START', 196);
      drawTextCentered(g, 'PRESS I FOR INSTRUCTIONS', 210);
      drawTextCentered(g, '(C) 2026 NEW WAVE ARCADE', 226);
    } else {
      drawTextCentered(g, 'HIGH SCORES', 56, 2);
      for (let i = 0; i < this.scores.table.length; i++) {
        const e = this.scores.table[i];
        drawText(g, (i + 1) + '. ' + e.name.padEnd(3), 62, 92 + i * 16);
        drawText(g, padNum(e.score, 5), 128, 92 + i * 16);
      }
      if ((this.tickCount >> 4) & 1) drawTextCentered(g, 'PRESS ENTER TO START', 196);
    }
  }

  _drawInstructions(g) {
    drawTextCentered(g, 'INSTRUCTIONS', 32, 2);
    const lines = [
      ['MOVE', 'ARROWS OR A/D'],
      ['FIRE', 'SPACE'],
      ['PAUSE', 'P OR ESC'],
      ['MUTE', 'M'],
      ['VOLUME', '- AND ='],
      ['OVERLAY', 'O'],
      ['FULLSCREEN', 'F'],
      ['RESTART', 'R AT GAME OVER'],
    ];
    for (let i = 0; i < lines.length; i++) {
      drawText(g, lines[i][0], 26, 66 + i * 13);
      drawText(g, lines[i][1], 100, 66 + i * 13);
    }
    drawTextCentered(g, 'DEFEND THE LINE.', 180);
    drawTextCentered(g, 'ONE SHOT IN THE AIR AT A TIME.', 192);
    if ((this.tickCount >> 4) & 1) drawTextCentered(g, 'ENTER = START   ESC = BACK', 216);
  }

  _drawGameOver(g) {
    this._drawPlayfield(g, false);
    // Typed out letter by letter, arcade style.
    const msg = 'GAME OVER';
    const n = Math.min(msg.length, 1 + (this.stateT / 8 | 0));
    drawText(g, msg.slice(0, n),
      Math.floor((CONFIG.WIDTH - textWidth(msg, 2)) / 2), 96, 2);
    if (n === msg.length && !this.attractMode && (this.tickCount >> 4) & 1) {
      drawTextCentered(g, 'PRESS R TO RESTART', 130);
    }
  }

  _drawHsEntry(g) {
    drawTopHud(g, this);
    drawTextCentered(g, 'NEW HIGH SCORE!', 60, 2);
    drawTextCentered(g, padNum(this.score, 5), 90);
    drawTextCentered(g, 'ENTER YOUR INITIALS', 112);
    const e = this.hsEntry;
    const cw = FONT_ADVANCE * 3;
    const x0 = Math.floor(CONFIG.WIDTH / 2 - cw * 1.5);
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * cw;
      drawText(g, e.name[i], x, 134, 3);
      if (i === e.slot && (this.tickCount >> 3) & 1) {
        drawText(g, '_', x, 140, 3);
      }
    }
    drawTextCentered(g, 'TYPE OR USE ARROWS', 188);
    drawTextCentered(g, 'ENTER = OK', 200);
  }
}
