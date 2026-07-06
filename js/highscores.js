// Persistent top-5 high-score table (localStorage, with a safe fallback for
// environments where storage is blocked).

const HS_KEY = 'voidRaiders.highScores';

const HS_DEFAULTS = [
  { name: 'ACE', score: 900 },
  { name: 'NVA', score: 700 },
  { name: 'LGF', score: 500 },
  { name: 'RIO', score: 300 },
  { name: 'ZAP', score: 200 },
];

class HighScores {
  constructor() {
    this.table = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(HS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 5 &&
            parsed.every(e => e && typeof e.score === 'number' && typeof e.name === 'string')) {
          return parsed;
        }
      }
    } catch (e) { /* storage unavailable — use defaults */ }
    return HS_DEFAULTS.map(e => ({ ...e }));
  }

  _save() {
    try {
      localStorage.setItem(HS_KEY, JSON.stringify(this.table));
    } catch (e) { /* ignore */ }
  }

  top() { return this.table[0]; }

  qualifies(score) {
    return score > 0 && score > this.table[this.table.length - 1].score;
  }

  insert(name, score) {
    this.table.push({ name: (name || '---').slice(0, 3), score });
    this.table.sort((a, b) => b.score - a.score);
    this.table.length = 5;
    this._save();
  }
}
