// Esquive : un style par morphologie (décision du 17 octobre 2026, maquettes « Roulade », « Fouissement », « Pas lourd », « Fondu », « Battement »).
// Règle commune : même fenêtre d'invincibilité et même coût d'endurance pour tous. Seuls changent l'animation, la distance,
// le départ (vulnérable, avant l'invincibilité) et la récupération (vulnérable, après). Parade, relais et combos ne bougent pas.
//
//   départ ──► invincible (DODGE_INV) ──► récupération
//   le chrono du relais démarre à la fin de la phase invincible.

export const DODGE_INV = 0.28;   // durée d'invincibilité, identique pour tous les styles (valeur déjà en jeu)

// start / rec : durées du départ et de la récupération (s). dist : multiplicateur de la distance de base (64 px, 44 sous paralysie).
export const DODGE_STYLES = {
  roll:    { start: 0.06, rec: 0.14, dist: 1 },      // petits et moyens : roulade, tour complet en 4 pas de 90°
  burrow:  { start: 0.12, rec: 0.22, dist: 1 },      // Onix, serpents, Sol : plonge, file sous terre, ressort
  heavy:   { start: 0.10, rec: 0.25, dist: 0.66 },   // gros trapus : bond court, onde au sol à l'atterrissage
  blink:   { start: 0.04, rec: 0.12, dist: 1 },      // Spectre, Psy, lévitation : disparaît, réapparaît plus loin
  flutter: { start: 0.06, rec: 0.14, dist: 1 },      // volants : coup d'ailes sur le côté
};

// Surcharges par forme (id de sprite). Tout ce qui n'est pas listé roule.
const BY_FORM = {};
const set = (style, ids) => ids.forEach(id => { BY_FORM[id] = style; });
set('burrow', ['hippopotas', 'hippowdon', 'serperior']);
set('heavy', ['snorlax', 'blastoise', 'grotle', 'torterra', 'swampert', 'feraligatr', 'metagross', 'emboar']);
set('blink', ['gastly', 'haunter', 'gengar', 'abra', 'kadabra', 'alakazam', 'ralts', 'kirlia', 'gardevoir', 'litwick', 'lampent', 'chandelure', 'beldum', 'metang', 'magnemite', 'magneton', 'magnezone', 'armarouge', 'ceruledge']);
set('flutter', ['starly', 'staravia', 'staraptor', 'togetic', 'togekiss', 'charizard', 'salamence', 'beedrill', 'scyther', 'scizor']);

export const dodgeStyleOf = id => BY_FORM[id] || 'roll';

export function makeDodge(id, baseDist, dx, dy) {
  const style = dodgeStyleOf(id), s = DODGE_STYLES[style];
  return { t: 0, style, s0: s.start, inv: DODGE_INV, dur: s.start + DODGE_INV + s.rec, dist: baseDist * s.dist, dx, dy, trail: [], trailT: 0 };
}
export const dodgeInvEnd = d => d.s0 + d.inv;
export const dodgeInvuln = d => !!d && d.t >= d.s0 && d.t < d.s0 + d.inv;

const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = p => p * p * (3 - 2 * p);
// Part de la distance parcourue (0 à 1) au temps t : rien pendant le départ, tout pendant la phase invincible.
export function dodgeTravel(d, t) {
  const p = clamp01((t - d.s0) / d.inv);
  switch (d.style) {
    case 'blink': return clamp01((p - 0.29) / 0.42);        // le trajet se fait pendant que le Pokémon est invisible
    case 'burrow': return smooth(p);                         // lent à la plongée et à la sortie, rapide sous terre
    case 'heavy': return p;                                  // bond régulier
    default: return 1 - (1 - p) * (1 - p);                   // roulade et battement : départ vif, fin amortie
  }
}

// Habillage du sprite pendant l'esquive. h = hauteur du sprite (px), side = 1 si le Pokémon regarde vers la droite de l'écran, -1 sinon.
// sx, sy : écrasement ; rot : rotation (rad) ; z : hauteur ; sink : enfoncement sous le sol (px, coupé au ras du sol) ;
// alpha ; pivot 'mid' (rotation autour du centre) ou 'foot' ; mound : bosse de terre à dessiner ; jx : tremblement horizontal.
export function dodgeVisual(d, h, side) {
  const t = d.t, v = { sx: 1, sy: 1, rot: 0, z: 0, sink: 0, alpha: 1, pivot: 'foot', mound: false, jx: 0 };
  const ph = t < d.s0 ? 'start' : t < d.s0 + d.inv ? 'inv' : 'rec';
  const p = ph === 'start' ? clamp01(t / Math.max(d.s0, 1e-3)) : ph === 'inv' ? clamp01((t - d.s0) / d.inv) : clamp01((t - d.s0 - d.inv) / Math.max(d.dur - d.s0 - d.inv, 1e-3));
  const ease = 1 - (1 - p) * (1 - p);
  switch (d.style) {
    case 'roll':
      if (ph === 'start') { v.sx = 1 + 0.15 * p; v.sy = 1 - 0.18 * p; }
      else if (ph === 'inv') { v.pivot = 'mid'; v.rot = side * Math.min(3, Math.floor(p * 4)) * Math.PI / 2; v.sx = v.sy = 0.86; v.z = Math.sin(Math.PI * p) * 4; }
      else { v.sx = 1.12 - 0.12 * p; v.sy = 0.84 + 0.16 * p; }
      break;
    case 'burrow':
      if (ph === 'start') { v.sx = 1 + 0.1 * p; v.sy = 1 - 0.12 * p; v.jx = p > 0.3 ? ((Math.floor(t * 33) % 2) ? 1 : -1) : 0; }
      else if (ph === 'inv') {
        if (p < 0.29) { const a = p / 0.29; v.sink = h * a * a; v.sx = 1.08; v.sy = 0.92; }
        else if (p < 0.71) { v.sink = h + 2; v.mound = true; }
        else { const a = (p - 0.71) / 0.29; v.sink = h * (1 - a) * (1 - a); v.sx = 0.92; v.sy = 1.1; }
      } else { v.sx = 1.14 - 0.14 * ease; v.sy = 0.86 + 0.14 * ease; }
      break;
    case 'heavy':
      if (ph === 'start') { v.sx = 1 + 0.12 * p; v.sy = 1 - 0.15 * p; }
      else if (ph === 'inv') { v.z = Math.sin(Math.PI * p) * 8; v.sx = 0.97; v.sy = 1.05; }
      else { v.sx = 1.2 - 0.2 * ease; v.sy = 0.78 + 0.22 * ease; }
      break;
    case 'blink':
      if (ph === 'start') { v.sx = 1 - 0.1 * p; v.sy = 1 + 0.1 * p; }
      else if (ph === 'inv') {
        if (p < 0.29) { const a = p / 0.29; v.alpha = 1 - a; v.sx = 0.9 * (1 - 0.8 * a); v.sy = 1.1 + 0.3 * a; }
        else if (p < 0.71) { v.alpha = 0; }
        else { const a = (p - 0.71) / 0.29; v.alpha = a; v.sx = 0.18 + 0.82 * a; v.sy = 1.4 - 0.4 * a; }
      } else { const w = 0.08 * (1 - p) * Math.sin(p * Math.PI * 3); v.sx = 1 + w; v.sy = 1 - w; }
      break;
    case 'flutter':
      if (ph === 'start') { v.sy = 1 - 0.08 * p; }
      else if (ph === 'inv') { v.z = Math.sin(Math.PI * p) * 4; v.sx = 1.04; v.sy = 0.96; }
      else { v.sy = 0.94 + 0.06 * p; }
      break;
  }
  v.phase = ph; v.p = p;
  return v;
}
