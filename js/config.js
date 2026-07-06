// VOID RAIDERS — gameplay constants.
// Everything tunable lives here: pacing, speeds, scoring, layout, timers.
// All time values are in ticks (the game logic runs at a fixed 60 ticks/s).

const CONFIG = {
  // Internal fixed resolution (upscaled with nearest-neighbor filtering).
  WIDTH: 224,
  HEIGHT: 256,

  // Playfield layout.
  SHOT_TOP_Y: 24,          // player shots burst when they reach this line
  GROUND_Y: 239,           // the baseline the cannon sits above
  PLAYER_Y: 216,
  SHIELD_Y: 192,
  SHIELD_XS: [32, 78, 124, 170],
  UFO_Y: 34,

  // Player (cannon).
  PLAYER_SPEED: 1,         // px per tick — deliberately slow, arcade-authentic
  PLAYER_MARGIN: 6,
  PLAYER_START_X: 10,
  LIVES_START: 3,
  MAX_LIVES: 6,
  EXTRA_LIFE_SCORE: 1500,  // one bonus cannon at this score
  SHOT_SPEED: 4,
  HELD_FIRE_DELAY: 12,     // ticks before a held fire button re-fires

  // Enemy formation.
  ALIEN_COLS: 11,
  ALIEN_ROWS: 5,
  CELL_W: 16,
  CELL_H: 16,
  FORMATION_X: 24,
  WAVE_START_Y: [70, 78, 86, 94, 102, 110], // later waves begin lower (capped)
  ALIEN_STEP_X: 2,         // horizontal step of the rippled group movement
  ALIEN_DROP_Y: 8,
  LAST_ALIEN_FAST_STEP: 3, // classic quirk: the final alien is faster rightward
  INVASION_Y: 212,         // formation reaching this line costs a life
  ALIEN_POINTS: [10, 20, 30], // bottom rows / middle rows / top row
  DEATH_PAUSE_TICKS: 14,   // formation freeze while a kill explosion shows

  // Enemy fire. Three channels: aimed, column-table, random column.
  MAX_BOMBS: 3,
  BOMB_COOLDOWNS: [85, 120, 150],
  BOMB_COOLDOWN_JITTER: 55,
  BOMB_WAVE_FACTOR: 0.07,  // cooldown shrink per wave...
  BOMB_MIN_FACTOR: 0.45,   // ...down to this floor
  BOMB_SPEED_BASE: 1.3,
  BOMB_SPEED_PER_WAVE: 0.12,
  BOMB_SPEED_MAX: 2.4,
  BOMB_COLUMN_TABLE: [0, 6, 0, 3, 10, 5, 2, 8, 1, 7, 4, 9], // plunger-style cycle

  // Bonus craft.
  UFO_SPEED: 0.75,
  UFO_INTERVAL: 1500,      // ~25 s between appearances
  UFO_MIN_ALIENS: 8,       // never appears once the formation is nearly gone
  // Award indexed by the player's total shot count (classic hidden table).
  UFO_SCORES: [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100],

  // Palette. Rooted in the classic cabinet look (green cannon and shields,
  // red mystery ship) with a neon accent color per alien type.
  COLORS: {
    squid: '#4df3ff',   // top row, 30 pts — cyan
    crab: '#ff4da6',    // middle rows, 20 pts — magenta
    octo: '#9dff4d',    // bottom rows, 10 pts — lime
    player: '#39ff6e',
    shield: '#39ff6e',
    ufo: '#ff5348',
    shot: '#eaffea',
    bombS: '#ffe14d',   // aimed squiggly — yellow
    bombP: '#ffb84d',   // column plunger — amber
    bombR: '#ff7b4d',   // random rolling — orange
    boom: '#ff9d4d',    // player explosion debris
    text: '#ffffff',
    accent: '#39ff6e',  // values, prompts, ready text
    warn: '#ff5348',    // game over, popups, muted flag
    osd: '#ffe14d',
    title1: '#4df3ff',
    title2: '#ff4da6',
  },

  // Audio pacing.
  STEP_SOUND_MIN_GAP: 6,   // floor between movement pulses at high speed

  // State timers.
  BOOT_TICKS: 170,
  TITLE_MAIN_TICKS: 540,
  TITLE_SCORES_TICKS: 300,
  ATTRACT_MAX_TICKS: 2400,
  READY_TICKS: 130,
  RESPAWN_TICKS: 70,
  PLAYER_DEATH_TICKS: 110,
  WAVE_CLEAR_TICKS: 120,
  GAME_OVER_TICKS: 320,
};
