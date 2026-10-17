// Feuilles de momiji qui tombent à l'écran, portées par le vent (Tour Carillon), comme les feuilles d'automne de HG/SS.
// Calque 2D au-dessus de la scène et sous le HUD ; indépendant du moteur de rendu (HD-2D ou 2D de secours).
const MAPLE = ['....#....', '#...#...#', '##.###.##', '.#######.', '#########', '.#######.', '..#####..', '....#....', '....#....'];
const COLS = ['#b3121f', '#c91e2a', '#d1262b', '#e2502a', '#e2502a', '#ec8a2e', '#e9b43a'];   // surtout carmin, un peu d'orangé et d'or
const shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');

function bake(col, px, blur) {   // une feuille en pixel art, nette ou floutée (premier plan)
  const c = document.createElement('canvas'), pad = blur ? 3 : 0; c.width = c.height = 9 * px + pad * 2;
  const g = c.getContext('2d'); if (blur) g.filter = `blur(${blur}px)`;
  const dark = shade(col, 0.68);
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (MAPLE[y][x] === '#') { g.fillStyle = x === 4 && y > 1 ? dark : col; g.fillRect(pad + x * px, pad + y * px, px, px); }
  return c;
}

export function createLeaves(stage) {
  const cv = document.createElement('canvas'); cv.id = 'leaves'; cv.height = 720; cv.width = 1280;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  stage.insertBefore(cv, document.getElementById('hud'));
  const g = cv.getContext('2d'), sharp = COLS.map(c => bake(c, 2, 0)), soft = COLS.map(c => bake(c, 3, 1.4));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = (a, b) => a + Math.random() * (b - a);
  let W = 1280, H = 720, t = 0, k = 0, P = [];
  const mk = (scatter) => ({ x: scatter ? R(-60, W) : R(-0.5 * W, W), y: scatter ? R(-20, H) : R(-40, -12), z: R(0.7, 1.5), c: (Math.random() * COLS.length) | 0, a: R(0, 6.28), ra: R(-1.4, 1.4), fl: R(0, 6.28), fs: R(1.6, 3.2), ph: R(0, 6.28), near: Math.random() < 0.18 });
  const gust = tt => 26 + 38 * Math.sin(tt * 0.31) + 22 * Math.sin(tt * 0.83 + 1.7) + 14 * Math.sin(tt * 2.1) * Math.max(0, Math.sin(tt * 0.17));
  return {
    update(dt, active) {
      const w = stage.clientWidth || 1280; if (w !== W) { W = w; cv.width = W; }
      k += ((active && !reduce ? 1 : 0) - k) * Math.min(1, dt * 1.2);
      if (k < 0.02) { if (P.length) { P = []; g.clearRect(0, 0, W, H); } return; }
      const n = Math.round(W / 42); while (P.length < n) P.push(mk(true));
      t += dt; const wind = gust(t);
      g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = false;
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
