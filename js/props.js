// Sprites de décor (feu de camp, coffres/Poké Balls, piliers, glace) : feuilles décrites dans assets/props.json.
// Chaque entrée : { file, fw, fh, cols?, frames:[indices], fps?, vary?, scale?, ax?, ay?, oy? }  (vary : frame fixe tirée de la graine de l'objet).
//   ax/ay = point d'ancrage dans la frame (0..1, défaut 0.5 / 1 = milieu-bas), oy = décalage vertical en pixels de jeu.
// Si une clé manque ou si l'image n'est pas chargée, drawProp renvoie false et l'appelant garde son dessin procédural.
export const PROPS = { db: {}, img: {} };

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image ' + src)); i.src = src; });
}

export async function loadProps() {
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
  const frames = p.frames || [0], fps = p.fps || 8;
  const f = force >= 0 ? frames[Math.min(force, frames.length - 1)] : p.vary ? frames[Math.abs(Math.floor(seed)) % frames.length] : frames[Math.floor((t + phase) * fps) % frames.length];  // vary : une variante fixe par objet
  const cols = p.cols || Math.max(1, Math.floor(img.width / p.fw)), sx = (f % cols) * p.fw, sy = Math.floor(f / cols) * p.fh;
  const s = p.scale || 1, w = p.fw * s, h = p.fh * s, ax = p.ax ?? 0.5, ay = p.ay ?? 1;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, p.fw, p.fh, Math.round(x - w * ax), Math.round(y + (p.oy || 0) - h * ay), w, h);
  ctx.restore();
  return true;
}
