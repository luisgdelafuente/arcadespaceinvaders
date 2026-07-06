// Original pixel art, authored for this project. 'X' = lit pixel.
// Sprites are pre-rendered to small white canvases at boot; the raw rows are
// kept for pixel masks (shields, blast patterns).

const SPRITE_DATA = {
  // Top-row raider — 30 points, 8x8, two animation frames.
  squid0: [
    '...XX...',
    '..XXXX..',
    '.XXXXXX.',
    'X.XXXX.X',
    'XXXXXXXX',
    '..XXXX..',
    '.X.XX.X.',
    'X..XX..X',
  ],
  squid1: [
    '...XX...',
    '..XXXX..',
    '.XXXXXX.',
    'X.XXXX.X',
    'XXXXXXXX',
    '..XXXX..',
    'X..XX..X',
    '.X....X.',
  ],
  // Middle-row raider — 20 points, 11x8.
  crab0: [
    '.X.......X.',
    '..X.....X..',
    '.XXXXXXXXX.',
    'XX.XXXXX.XX',
    'XXXXXXXXXXX',
    '.X.XXXXX.X.',
    '.X.X...X.X.',
    '..X.X.X.X..',
  ],
  crab1: [
    '.X.......X.',
    'X.X.....X.X',
    'XXXXXXXXXXX',
    'XX.XXXXX.XX',
    'XXXXXXXXXXX',
    '..XXXXXXX..',
    '.X.X...X.X.',
    'X..X...X..X',
  ],
  // Bottom-row raider — 10 points, 12x8.
  octo0: [
    '....XXXX....',
    '.XXXXXXXXXX.',
    'XXXXXXXXXXXX',
    'XXX.XXXX.XXX',
    'XXXXXXXXXXXX',
    '..XXX..XXX..',
    '.XX..XX..XX.',
    'XX........XX',
  ],
  octo1: [
    '....XXXX....',
    '.XXXXXXXXXX.',
    'XXXXXXXXXXXX',
    'XXX.XXXX.XXX',
    'XXXXXXXXXXXX',
    '...XX..XX...',
    '..X.XXXX.X..',
    '.X..X..X..X.',
  ],
  // Player cannon, 13x8.
  player: [
    '......X......',
    '.....XXX.....',
    '.....XXX.....',
    '.XXXXXXXXXXX.',
    'XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX',
  ],
  // Bonus craft, 16x7.
  ufo: [
    '.....XXXXXX.....',
    '...XXXXXXXXXX...',
    '..XXXXXXXXXXXX..',
    '.XX.XX.XX.XX.XX.',
    'XXXXXXXXXXXXXXXX',
    '..XXX..XX..XXX..',
    '...X........X...',
  ],
  // Raider explosion, 13x7.
  aboom: [
    '.X...X.X...X.',
    '..X..X.X..X..',
    '...X.....X...',
    'XX....X....XX',
    '...X.....X...',
    '..X..X.X..X..',
    '.X...X.X...X.',
  ],
  // Player explosion debris, two frames, 13x8.
  pboom0: [
    '....X...X....',
    '.X....X....X.',
    '...X.....X...',
    'X....XXX...X.',
    '..XXXXXXXX...',
    '.XXXXXXXXXX.X',
    'XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX',
  ],
  pboom1: [
    'X...X.....X..',
    '..X....X....X',
    '.....X....X..',
    '.X..XXXX.....',
    '...XXXXXXX..X',
    'X.XXXXXXXXXX.',
    '.XXXXXXXXXXXX',
    'XXXXXXXXXXXXX',
  ],
  // Bonus craft explosion, 16x8.
  ufoboom: [
    '.X..X..XX..X..X.',
    '..X..X....X..X..',
    'X...XXXXXX...X.X',
    '..XXX.XX.XXX....',
    '.X.XXXXXXXX.X...',
    'X...XX..XX...X.X',
    '..X...XX...X....',
    '.X..X....X...X..',
  ],
  // Player shot burst (top-of-screen / shield flash), 8x8.
  shotburst: [
    'X..X...X',
    '.X.X.X..',
    '..XXX..X',
    'XXX.XXX.',
    '..XXX...',
    '.X.X.X.X',
    'X..X..X.',
    '.X...X..',
  ],
  // Enemy bomb burst, 6x8.
  bombburst: [
    'X.X..X',
    '.X.XX.',
    'X.XX.X',
    '.XXXX.',
    'X.XX.X',
    '.XX.X.',
    'X.X..X',
    '.X..X.',
  ],
  // Defensive shield, 22x16.
  shield: [
    '....XXXXXXXXXXXXXX....',
    '...XXXXXXXXXXXXXXXX...',
    '..XXXXXXXXXXXXXXXXXX..',
    '.XXXXXXXXXXXXXXXXXXXX.',
    'XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXX......XXXXXXXX',
    'XXXXXXX........XXXXXXX',
    'XXXXXX..........XXXXXX',
    'XXXXXX..........XXXXXX',
  ],
  // Enemy bombs, 3x7, four frames each.
  // Squiggly (aimed channel).
  bombS0: ['X..','.X.','..X','.X.','X..','.X.','..X'],
  bombS1: ['.X.','..X','.X.','X..','.X.','..X','.X.'],
  bombS2: ['..X','.X.','X..','.X.','..X','.X.','X..'],
  bombS3: ['.X.','X..','.X.','..X','.X.','X..','.X.'],
  // Plunger (column-table channel).
  bombP0: ['.X.','.X.','.X.','.X.','.X.','.X.','XXX'],
  bombP1: ['.X.','.X.','.X.','.X.','.X.','XXX','.X.'],
  bombP2: ['.X.','.X.','.X.','.X.','XXX','.X.','.X.'],
  bombP3: ['.X.','.X.','.X.','XXX','.X.','.X.','.X.'],
  // Rolling (random channel).
  bombR0: ['XX.','.X.','.X.','.X.','.X.','.X.','.X.'],
  bombR1: ['.X.','.XX','.X.','.X.','.X.','.X.','.X.'],
  bombR2: ['.X.','.X.','XX.','.X.','.X.','.X.','.X.'],
  bombR3: ['.X.','.X.','.X.','.XX','.X.','.X.','.X.'],
};

// Shield damage stamps, cleared around each impact point.
const SHOT_BLAST = [
  '.X.X.X..',
  'X.XXXX.X',
  '.XXXXXX.',
  'XXXXXXXX',
  '.XXXXXX.',
  'X.XXXX.X',
];
const BOMB_BLAST = [
  '.X.X.X',
  'X.XXX.',
  '.XXXX.',
  'XXXXXX',
  '.XXXX.',
  'X.X.X.',
];

// name -> { canvas, w, h, rows }
const Sprites = {};

function buildSprites() {
  for (const name in SPRITE_DATA) {
    const rows = SPRITE_DATA[name];
    const h = rows.length;
    let w = 0;
    for (const row of rows) w = Math.max(w, row.length);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    g.fillStyle = '#ffffff';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === 'X') g.fillRect(x, y, 1, 1);
      }
    }
    Sprites[name] = { canvas, w, h, rows };
  }
}

function drawSprite(g, name, x, y) {
  const s = Sprites[name];
  g.drawImage(s.canvas, x | 0, y | 0);
}
