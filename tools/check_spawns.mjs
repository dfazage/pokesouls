// Contrôle des spawns : un mob ne doit jamais apparaître dans un mur / un décor solide, ni dans une poche fermée (trop petite pour bouger).
// Usage : node tools/check_spawns.mjs [--raw]   (liste les spawns fautifs ; par défaut après le décalage appliqué par le jeu, --raw = positions brutes du générateur)
import * as M from '../js/maps.js';
const TS = M.TS, STEP = 6, HW = 5, HH = 3;
let bad = 0, tot = 0;
for (const ch of Object.keys(M.CHAPTER_MAPS)) {
  M.setChapter(ch);
  M.MAPS.forEach((def, idx) => {
    const w = M.buildWorld(idx), W = M.MW * TS, H = M.MH * TS, cols = Math.ceil(W / STEP), rows = Math.ceil(H / STEP);
    const free = (cx, cy) => M.boxFree(w, cx * STEP + STEP / 2, cy * STEP + STEP / 2, HW, HH);
    const comp = new Int32Array(cols * rows).fill(-1), sizes = [];
    const label = (sx, sy) => {   // flood fill 4-voisins sur la grille de collision
      const id = sizes.length; let n = 0; const st = [sx + sy * cols]; comp[st[0]] = id;
      while (st.length) { const p = st.pop(), x = p % cols, y = (p / cols) | 0; n++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue; const q = nx + ny * cols; if (comp[q] >= 0 || !free(nx, ny)) continue; comp[q] = id; st.push(q); } }
      sizes.push(n);
    };
    const s0 = w.start, sx = Math.floor((s0.tx + 0.5) * TS / STEP), sy = Math.floor((s0.ty + 0.5) * TS / STEP);
    if (free(sx, sy)) label(sx, sy);
    const main = comp[sx + sy * cols];
    const out = [];
    for (const s of w.spawns) {
      tot++;
      let x = (s.tx + 0.5) * TS, y = (s.ty + 0.5) * TS; if (process.argv.includes('--raw') === false) { const p = M.nearestFree(w, x, y, HW, HH); if (p) [x, y] = p; }
      const cx = Math.floor(x / STEP), cy = Math.floor(y / STEP);
      let why = null;
      if (!M.boxFree(w, x, y, HW, HH)) why = 'dans un mur / décor';
      else { if (comp[cx + cy * cols] < 0) label(cx, cy); const c = comp[cx + cy * cols]; if (c !== main) why = sizes[c] < 600 ? 'poche fermée (' + sizes[c] + ' cases)' : 'zone inaccessible depuis l’entrée'; }
      if (why) out.push(`${s.type}@${s.tx},${s.ty} ${why}`);
    }
    bad += out.length;
    console.log(`${ch} ${def.id.padEnd(3)} ${String(w.spawns.length).padStart(3)} spawns, ${out.length} coincés${out.length ? '\n   ' + out.join('\n   ') : ''}`);
  });
}
console.log(`\n${bad} spawn(s) coincé(s) sur ${tot}.`);
process.exit(bad ? 1 : 0);
