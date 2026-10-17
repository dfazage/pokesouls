// Feuilles de momiji qui tombent à l'écran, portées par le vent (Tour Carillon), comme les feuilles d'automne de HG/SS.
// Mode 'ash' (Tour Brûlée) : suie et cendre qui tombent, braises et flammèches qui montent, portées par le même vent.
// Calque 2D au-dessus de la scène et sous le HUD ; indépendant du moteur de rendu (HD-2D ou 2D de secours).
import { windNow } from './wind.js';
const MAPLE = ['....#....', '#...#...#', '##.###.##', '.#######.', '#########', '.#######.', '..#####..', '....#....', '....#....'];
import { LEAF_COLS as COLS, ASH_COLS, EMBER_COLS } from './wind.js';   // surtout carmin, un peu d'orangé et d'or
const shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');

function bake(col, px, blur) {   // une feuille en pixel art, nette ou floutée (premier plan)
  const c = document.createElement('canvas'), pad = blur ? 3 : 0; c.width = c.height = 9 * px + pad * 2;
  const g = c.getContext('2d'); if (blur) g.filter = `blur(${blur}px)`;
  const dark = shade(col, 0.68);
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (MAPLE[y][x] === '#') { g.fillStyle = x === 4 && y > 1 ? dark : col; g.fillRect(pad + x * px, pad + y * px, px, px); }
  return c;
}


// ---- mode cendres : flocons de suie / cendre, braises avec halo, flammèches de deux images ----
const FLAKES = [['.#.', '###', '.#.'], ['##.', '###', '.##'], ['#..', '###', '.#.'], ['.##.', '####', '.##.'], ['.#', '##', '#.']];
function bakeFlake(col, px, shape) {
  const c = document.createElement('canvas'); c.width = shape[0].length * px; c.height = shape.length * px; const g = c.getContext('2d'); g.fillStyle = col;
  shape.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') g.fillRect(x * px, y * px, px, px); })); return c;
}
function bakeEmber(col, px) {   // braise : cœur clair + halo
  const r = 7 * px, c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d');
  const gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, col + 'cc'); gr.addColorStop(0.35, col + '44'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
  g.fillStyle = '#ffe9a0'; g.fillRect(r - px / 2, r - px / 2, px, px); g.fillStyle = col; g.fillRect(r - px * 1.5, r - px / 2, px, px); g.fillRect(r - px / 2, r - px * 1.5, px, px); return c;
}
const FLAME = [['..#..', '..##.', '.###.', '.###.', '#####', '#####', '.###.'], ['.#...', '.##..', '.###.', '####.', '#####', '#####', '.###.']];
function bakeFlame(frame, px) {   // flammèche : pointe jaune, cœur orangé, base rouge
  const sh = FLAME[frame], c = document.createElement('canvas'); c.width = 5 * px; c.height = 7 * px; const g = c.getContext('2d');
  sh.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') { g.fillStyle = y < 2 ? '#ffe28a' : y < 5 ? '#ff9a2e' : '#e2461c'; g.fillRect(x * px, y * px, px, px); } })); return c;
}

export function createLeaves(stage) {
  const cv = document.createElement('canvas'); cv.id = 'leaves'; cv.height = 720; cv.width = 1280;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  stage.insertBefore(cv, document.getElementById('hud'));
  const g = cv.getContext('2d'), sharp = COLS.map(c => bake(c, 2, 0)), soft = COLS.map(c => bake(c, 3, 1.4));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = (a, b) => a + Math.random() * (b - a);
  const ashSp = ASH_COLS.map(c => FLAKES.map((sh, i) => bakeFlake(c, i % 2 ? 3 : 4, sh))), emberSp = EMBER_COLS.map(c => bakeEmber(c, 3)), flameSp = [bakeFlame(0, 3), bakeFlame(1, 3)];
  let W = 1280, H = 720, t = 0, k = 0, P = [], S = [], PA = [], cur = false;
  // particule du mode cendres : type 0 suie (sombre, tombe), 1 cendre (claire, tombe lentement), 2 braise (monte, scintille), 3 flammèche (monte, vacille)
  const mkA = (scatter, type) => { const rise = type >= 2, life = type === 3 ? R(1.4, 2.8) : type === 2 ? R(2.6, 5.2) : 99; return { type, x: scatter ? R(-60, W) : R(-0.2 * W, W), y: scatter ? R(-20, H) : rise ? H + R(6, 40) : R(-40, -12), z: R(0.7, 1.5), c: (Math.random() * (type === 0 ? 4 : 4) + (type === 1 ? 4 : 0)) | 0, sh: (Math.random() * FLAKES.length) | 0, ec: (Math.random() * EMBER_COLS.length) | 0, a: R(0, 6.28), ra: R(-1.6, 1.6), fl: R(0, 6.28), fs: R(1.2, 3), ph: R(0, 6.28), life, l: scatter && rise ? R(0, life) : 0, near: Math.random() < 0.16 }; };
  const mk = (scatter) => ({ x: scatter ? R(-60, W) : R(-0.5 * W, W), y: scatter ? R(-20, H) : R(-40, -12), z: R(0.7, 1.5), c: (Math.random() * COLS.length) | 0, a: R(0, 6.28), ra: R(-1.4, 1.4), fl: R(0, 6.28), fs: R(1.6, 3.2), ph: R(0, 6.28), near: Math.random() < 0.18 });
  return {
    update(dt, active) {
      const w = stage.clientWidth || 1280; if (w !== W) { W = w; cv.width = W; }
      const md = active || false; if (md !== cur) { cur = md; P = []; PA = []; S = []; }
      k += ((md && !reduce ? 1 : 0) - k) * Math.min(1, dt * 1.2);
      if (k < 0.02) { if (P.length || S.length || PA.length) { P = []; S = []; PA = []; g.clearRect(0, 0, W, H); } return; }
      if (md === 'ash') { const want = [Math.round(W / 26), Math.round(W / 30), Math.round(W / 22), Math.max(5, Math.round(W / 100))]; for (let ty = 0; ty < 4; ty++) { let have = PA.filter(q => q.type === ty).length; while (have++ < want[ty]) PA.push(mkA(true, ty)); } }
      const n = md === 'ash' ? 0 : Math.round(W / 42); while (P.length < n) P.push(mk(true));
      t += dt; const wind = windNow();
      g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = false;
      { // traînées de vent : fines lignes ondulées qui filent pendant les rafales
        const str = Math.max(0, (wind - 34) / 60);
        if (Math.random() < dt * str * 5 && S.length < 14) S.push({ x: R(-0.3 * W, 0.8 * W), y: R(0, H), len: R(90, 230), sp: R(1.5, 2.4), ph: R(0, 6.28), l: 0, max: R(0.9, 1.6), amp: R(3, 9) });
        for (const q of S) {
          q.l += dt; q.x += (wind * q.sp + 160) * dt; q.y += 0.22 * (wind * q.sp + 160) * dt;
          const u = q.l / q.max, a = Math.sin(Math.min(1, u) * Math.PI) * 0.26 * k;
          g.strokeStyle = `rgba(255,238,214,${a.toFixed(3)})`; g.lineWidth = 1.2; g.beginPath();
          for (let i = 0; i <= 8; i++) { const f = i / 8, px = q.x - q.len * f, py = q.y - q.len * f * 0.22 + Math.sin(q.ph + f * 5 + t * 3) * q.amp * (0.4 + f * 0.6); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
          g.stroke();
        }
        S = S.filter(q => q.l < q.max && q.x - q.len < W + 40);
      }
      if (md === 'ash') {
        for (const p of PA) {
          p.fl += p.fs * dt; p.a += p.ra * dt; p.l += dt;
          const zz = p.near ? p.z * 1.5 : p.z; let al = k * (p.near ? 0.7 : 0.95), img;
          if (p.type <= 1) {   // suie / cendre : tombe lentement, portée par les rafales, se retourne en tombant
            p.x += (wind * 0.8 * p.z + Math.sin(p.ph + t * 1.3) * 14) * dt; p.y += ((p.type ? 9 : 15) + 14 * p.z) * (0.55 + 0.45 * Math.abs(Math.cos(p.fl))) * dt;
            if (p.y > H + 16 || p.x > W + 30) Object.assign(p, mkA(false, p.type), { x: R(-0.4 * W, W) });
            img = ashSp[p.c][p.sh]; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.scale(Math.max(0.3, Math.abs(Math.cos(p.fl * 0.8))) * zz, zz); g.globalAlpha = al * (p.type ? 0.75 : 0.9); g.drawImage(img, -img.width / 2, -img.height / 2); g.restore();
          } else {   // braise et flammèche : montent en ondulant, le vent les couche vers la droite, fondu entrant et sortant
            const u = p.l / p.life; p.x += (wind * 0.55 * p.z + Math.sin(p.ph + t * 2.1) * 22) * dt; p.y -= (p.type === 3 ? 12 + 14 * p.z : 20 + 30 * p.z) * dt;
            if (u >= 1 || p.y < -30 || p.x > W + 30) Object.assign(p, mkA(false, p.type), { x: R(-0.2 * W, W) });
            const f = Math.sin(Math.min(1, u) * Math.PI), fl = 0.65 + 0.35 * Math.sin(p.fl * 3);
            g.save(); g.translate(p.x, p.y);
            if (p.type === 2) { img = emberSp[p.ec]; g.globalCompositeOperation = 'lighter'; g.globalAlpha = al * f * fl; g.scale(zz * 0.8, zz * 0.8); g.drawImage(img, -img.width / 2, -img.height / 2); }
            else { img = flameSp[((t * 7 + p.ph) | 0) & 1]; g.globalAlpha = al * f; g.scale(zz * (p.near ? 1.3 : 1), zz * (p.near ? 1.3 : 1)); g.rotate(Math.sin(p.ph + t * 2.1) * 0.25); g.drawImage(img, -img.width / 2, -img.height / 2); g.globalCompositeOperation = 'lighter'; g.globalAlpha = al * f * 0.35; g.drawImage(emberSp[1], -emberSp[1].width / 2, -emberSp[1].height / 2 - 4); }
            g.restore();
          }
        }
      }
      for (const p of P) {
        p.fl += p.fs * dt; p.a += p.ra * dt;
        const glide = 0.5 + 0.5 * Math.abs(Math.cos(p.fl)), zz = p.near ? p.z * 1.5 : p.z;
        p.x += (wind * 0.9 * p.z + Math.sin(p.ph + t * 1.7) * 16) * dt;
        p.y += (20 + 26 * p.z) * glide * dt * (p.near ? 1.25 : 1);
        if (p.y > H + 24 || p.x > W + 40) Object.assign(p, mk(false), { x: R(-0.45 * W, W * 0.9) });
        const img = (p.near ? soft : sharp)[p.c], s = zz * (p.near ? 1.05 : 0.95);
        g.save(); g.translate(p.x, p.y); g.rotate(p.a + Math.sin(p.fl) * 0.5); g.scale(Math.max(0.18, Math.abs(Math.cos(p.fl * 0.9))) * s, s);
        g.globalAlpha = k * (p.near ? 0.8 : 0.95); g.drawImage(img, -img.width / 2, -img.height / 2); g.restore();
      }
    },
  };
}
