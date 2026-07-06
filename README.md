# VOID RAIDERS

An original browser-based 2D fixed shooter in the spirit of late-1970s
arcade machines. Built with plain HTML5 Canvas, CSS, and JavaScript — no
frameworks, no build step, no external assets. All pixel art, the pixel
font, and every sound effect (synthesized live with the Web Audio API)
were created for this project.

## Run it

Open `index.html` in any modern desktop browser. That's it.

Optionally serve it (identical behavior, plus persistent high scores in
some stricter browser configurations):

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

The project is a fully static site and deploys to Netlify as-is
(`netlify.toml` publishes the repository root).

## Controls

| Key | Action |
| --- | --- |
| ← → or A / D | Move the cannon |
| Space | Fire (one shot in the air at a time) |
| Enter | Start / confirm |
| P or Esc | Pause / resume |
| M | Mute |
| - / = | Volume down / up |
| O | Toggle the colored cabinet-overlay mode |
| F | Toggle fullscreen |
| I | Instructions (from the title screen) |
| R | Restart after game over |

## Gameplay notes

- 5 rows × 11 raiders march as a group, reverse at the edges, and descend.
  Movement is discrete and rippled — one alien steps per tick — so the
  formation speeds up naturally as it thins out, and the last survivor is
  very fast (faster still moving right, as on the original hardware).
- Rows score 10 / 20 / 30 points; the bonus craft pays a hidden variable
  amount drawn from a table indexed by your total shot count.
- Enemies fire through three channels: shots aimed at you, a cycling
  column table, and random columns.
- Four destructible shields erode pixel by pixel from both sides, and
  raiders grind straight through them.
- Three lives; a life is also lost if the formation reaches your line.
  One extra life at 1,500 points. Later waves start lower and shoot
  faster. High scores (top 5, with initials) persist in localStorage.
- Neon palette rooted in the classic cabinet colors (green cannon and
  shields, red mystery ship), with a distinct color per alien type:
  cyan squids (30), magenta crabs (20), lime octos (10). Explosions
  inherit the color of whatever died. Edit `CONFIG.COLORS` to retheme.

## Project structure

```
index.html          page shell and script loading order
css/style.css       cabinet chrome (scanline/vignette layers, scaling)
js/config.js        ALL gameplay constants — tune the game here
js/font.js          custom 5x7 pixel font + text helpers
js/sprites.js       original pixel art data, pre-rendered at boot
js/collision.js     rect helpers + pixel-tight player hit boxes
js/audio.js         Web Audio synth engine (every sound in the game)
js/input.js         keyboard state, key-edge handling, scroll prevention
js/highscores.js    persistent top-5 table (localStorage)
js/shields.js       per-pixel destructible bunkers
js/projectiles.js   player shot + animated enemy bombs
js/effects.js       explosion sprites and score popups
js/player.js        the cannon
js/enemies.js       formation logic (rippled movement, columns, invasion)
js/ufo.js           bonus craft and its hidden score table
js/attract.js       demo pilot for attract mode
js/hud.js           score panel, lives strip, OSD messages
js/game.js          state machine: boot → title → play → game over → …
js/renderer.js      integer nearest-neighbor upscale + CRT presentation
js/main.js          bootstrap and fixed 60 Hz timestep loop
```

## Tuning

Everything meaningful is a named constant in `js/config.js`: player and
projectile speeds, formation layout and start heights per wave, enemy
fire cooldowns and their per-wave scaling, bonus-craft timing and score
table, the extra-life threshold, and every state timer. Change a value,
reload the page.
