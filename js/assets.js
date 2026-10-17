// Chargement des feuilles de sprites (PMDCollab SpriteCollab, CC BY-NC) et de leurs données d'animation.
export const TICK = 1 / 60; // durée d'un tick PMD, en secondes
export const A = { db: {}, img: {} };

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image ' + src)); i.src = src; });
}

export async function loadDb() { A.db = await (await fetch('assets/sprites.json')).json(); }
// Charge les images d'une liste d'espèces (une seule fois chacune).
export async function loadSpecies(slugs, onProgress, withPortrait = true) {
  const files = new Set();
  for (const s of slugs) { const sp = A.db[s]; if (!sp) continue; for (const an of Object.values(sp.anims)) files.add(an.file); if (withPortrait && sp.portrait) files.add(sp.portrait); }
  const todo = [...files].filter(f => !A.img[f]); let n = 0;
  await Promise.all(todo.map(async f => { try { A.img[f] = await loadImage('assets/' + f); } catch (e) { /* image manquante */ } onProgress && onProgress(++n / todo.length); }));
}
export async function loadPortraits(slugs) {
  const todo = slugs.map(s => A.db[s] && A.db[s].portrait).filter(f => f && !A.img[f]);
  await Promise.all(todo.map(async f => { try { A.img[f] = await loadImage('assets/' + f); } catch (e) { /* rien */ } }));
}

// ticks cumulés par frame
const cum = new WeakMap();
function cumul(an) {
  let c = cum.get(an);
  if (!c) { c = []; let t = 0; for (const d of an.dur) { t += d; c.push(t); } cum.set(an, c); }
  return c;
}
export function animTotal(an) { const c = cumul(an); return c[c.length - 1]; }
export function frameAt(an, t, loop) {
  const c = cumul(an), total = c[c.length - 1];
  if (loop) t = t % total; else if (t >= total) return c.length - 1;
  for (let i = 0; i < c.length; i++) if (t < c[i]) return i;
  return c.length - 1;
}
export function hitTick(an) { if (an.hit < 0) return -1; const c = cumul(an); return an.hit === 0 ? 0 : c[an.hit - 1]; }

// direction (rangée de la feuille) à partir d'un vecteur : 0 bas, 1 bas-droite, 2 droite, 3 haut-droite, 4 haut, 5 haut-gauche, 6 gauche, 7 bas-gauche
const ROW = [2, 1, 0, 7, 6, 5, 4, 3];
// pivot de caméra (radians) : la rangée du sprite dépend de la direction vue à l'écran, pas de la direction dans le monde
// angle de vue fixe de la carte (degrés) : 45 par défaut ; `?yaw=30` pour comparer, `?yaw=0` pour l'ancienne vue de face
export const VIEW_YAW = (() => { try { const v = parseFloat(new URLSearchParams(location.search).get('yaw')); return isFinite(v) ? v : 45; } catch (e) { return 45; } })();
let viewYaw = VIEW_YAW * Math.PI / 180, vyC = Math.cos(viewYaw), vyS = Math.sin(viewYaw);
export function setViewYaw(a) { viewYaw = a; vyC = Math.cos(a); vyS = Math.sin(a); }
export function dirFromVec(dx, dy) {
  if (viewYaw) { const sx = dx * vyC - dy * vyS, sy = dx * vyS + dy * vyC; dx = sx; dy = sy; }
  const k = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
  return ROW[k];
}
export const DIR_VEC = [[0, 1], [0.7071, 0.7071], [1, 0], [0.7071, -0.7071], [0, -1], [-0.7071, -0.7071], [-1, 0], [-0.7071, 0.7071]];

export function drawSprite(ctx, species, animName, t, loop, dir, x, y, opt = {}) {
  const sp = A.db[species]; if (!sp) return;
  const an = sp.anims[animName] || sp.anims.Idle;
  const img = A.img[an.file]; if (!img) return;
  const f = frameAt(an, t, loop);
  const s = opt.scale || 1;
  const w = an.fw, h = an.fh;
  const cx = x - sp.anchor.ox * s, cy = y - sp.anchor.oy * s - (opt.z || 0);
  ctx.save();
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  if (opt.flash) ctx.filter = 'brightness(2.2) saturate(0.3)';
  else if (opt.tint) ctx.filter = opt.tint;
  ctx.drawImage(img, f * w, dir * h, w, h, Math.round(cx - (w * s) / 2), Math.round(cy - (h * s) / 2), w * s, h * s);
  ctx.restore();
}
