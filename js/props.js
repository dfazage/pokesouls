// Sprites de décor (feu de camp, coffres/Poké Balls, piliers, glace) : feuilles décrites dans assets/props.json.
// Chaque entrée : { file, fw, fh, cols?, frames:[indices], fps?, vary?, scale?, ax?, ay?, oy? }  (vary : frame fixe tirée de la graine de l'objet).
//   ax/ay = point d'ancrage dans la frame (0..1, défaut 0.5 / 1 = milieu-bas), oy = décalage vertical en pixels de jeu.
//   x0/y0 = origine de la zone dans la feuille (planche partagée decor.png) ; per = images d'animation par variante (vary choisit la variante, le temps choisit l'image).
//   lo = { x0, y0 } : même zone dessinée pour la caméra basse des duels de boss (~22°) ; fondu avec la version d'exploration (40°) selon PROPS.pitch.
// Si une clé manque ou si l'image n'est pas chargée, drawProp renvoie false et l'appelant garde son dessin procédural.
export const PROPS = { db: {}, img: {}, pitch: 40 };
// Atlas de sol / décors de sol / murs pixel art (assets/floor.json, généré par tools/props_gen/build_floor.py) : db = manifeste, img = atlas, eimg = masque d'émission
export const FLOOR = { db: null, img: null, eimg: null, dimg: null, deimg: null, wimg: null, weimg: null, himg: null, heimg: null };   // pitch : inclinaison courante de la caméra en degrés (écrit par render3d)

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image ' + src)); i.src = src; });
}

async function loadFloor() {
  try {
    const db = await (await fetch('assets/floor.json')).json();
    const opt = f => f ? loadImage('assets/' + f).catch(() => null) : Promise.resolve(null);
    const [img, eimg, dimg, deimg, wimg, weimg, himg, heimg] = await Promise.all([loadImage('assets/' + db.file), opt(db.efile), opt(db.dfile), opt(db.defile), opt(db.wfile), opt(db.wefile), opt(db.hfile), opt(db.hefile)]);
    FLOOR.db = db; FLOOR.img = img; FLOOR.eimg = eimg; FLOOR.dimg = dimg; FLOOR.deimg = deimg; FLOOR.wimg = wimg; FLOOR.weimg = weimg;
    FLOOR.himg = himg && heimg ? himg : null; FLOOR.heimg = himg && heimg ? heimg : null;   // maisons 3D texturées : les deux images ou aucune (repli : ancien shader procédural)
  } catch (e) { FLOOR.db = null; FLOOR.img = FLOOR.eimg = FLOOR.dimg = FLOOR.deimg = FLOOR.wimg = FLOOR.weimg = FLOOR.himg = FLOOR.heimg = null; /* repli : sol et murs dessinés par le code */ }
}

export async function loadProps() {
  await loadFloor();
  try { PROPS.db = await (await fetch('assets/props.json')).json(); } catch (e) { PROPS.db = {}; return; }
  const files = [...new Set(Object.values(PROPS.db).map(p => p.file))];
  await Promise.all(files.map(async f => { try { PROPS.img[f] = await loadImage('assets/' + f); } catch (e) { /* image manquante : repli procédural */ } }));
}

// Premier nom de la liste qui existe et dont l'image est chargée.
export function pickProp(...keys) {
  for (const k of keys) { const p = PROPS.db[k]; if (p && PROPS.img[p.file]) return k; }
  return null;
}

// Dessine la frame courante de la clé, pieds en (x, y). t = temps en secondes, phase = décalage d'animation.
export function drawProp(ctx, key, x, y, t = 0, phase = 0, seed = 0, force = -1) {  // force >= 0 : indice dans frames[]
  const p = key && PROPS.db[key], img = p && PROPS.img[p.file]; if (!img) return false;
  const frames = p.frames || [0], fps = p.fps || 8, per = p.per || 1;
  let f;
  if (force >= 0) f = frames[Math.min(force, frames.length - 1)];
  else if (p.vary) { const nv = Math.max(1, Math.floor(frames.length / per)), v = Math.abs(Math.floor(seed)) % nv; f = frames[v * per + (per > 1 ? Math.floor((t + phase) * fps) % per : 0)]; }   // vary : une variante fixe par objet
  else f = frames[Math.floor((t + phase) * fps) % frames.length];
  const cols = p.cols || Math.max(1, Math.floor(img.width / p.fw));
  const s = p.scale || 1, w = p.fw * s, h = p.fh * s, ax = p.ax ?? 0.5, ay = p.ay ?? 1;
  const dx = Math.round(x - w * ax), dy = Math.round(y + (p.oy || 0) - h * ay);
  const cell = (o) => [(o.x0 || 0) + (f % cols) * p.fw, (o.y0 || 0) + Math.floor(f / cols) * p.fh];
  // caméra basse (duel de boss, cinématiques) : version « lo » ; entre 40° et 24° on fond les deux
  const k = p.lo ? Math.max(0, Math.min(1, (40 - PROPS.pitch) / 16)) : 0;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const a0 = ctx.globalAlpha;
  if (k < 0.98) { const [sx, sy] = cell(p); ctx.globalAlpha = a0 * (k > 0.02 ? 1 - k : 1); ctx.drawImage(img, sx, sy, p.fw, p.fh, dx, dy, w, h); }
  if (k > 0.02) { const [sx, sy] = cell(p.lo); ctx.globalAlpha = a0 * (k < 0.98 ? k : 1); ctx.drawImage(img, sx, sy, p.fw, p.fh, dx, dy, w, h); }
  ctx.restore();
  return true;
}
