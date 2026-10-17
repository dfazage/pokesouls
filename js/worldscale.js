// Échelle du monde (rendu HD-2D seulement). Voir claude/echelle_monde_et_rythme_boss.md.
//
// Le décor (sol, props, murs) grossit de WORLD_SCALE parce que la caméra se rapproche ; les personnages
// (Pokémon, ennemis, boss) gardent leur taille à l'écran. La simulation ne change pas : une distance de jeu
// reste une distance de jeu (1 LC = 1 tuile = 24 px de monde).
//
// Réglage : ?ws=1.25 (ou 1.5) dans l'URL, borné entre 1 et 2 ; sans paramètre, DEFAULT_WS ci-dessous.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Valeur par défaut : 1 = rendu d'avant (aucun changement visible). Pour adopter le compromis décidé, passer à 1.25.
const DEFAULT_WS = 1;

function read() {
  try {
    const q = new URLSearchParams(location.search).get('ws');
    if (q !== null) { const v = parseFloat(q); if (isFinite(v)) return clamp(v, 1, 2); }
  } catch (e) { /* hors navigateur : valeur par défaut */ }
  return DEFAULT_WS;
}

export const WORLD_SCALE = read();
// facteur appliqué à la taille des personnages dans leur billboard : compense le rapprochement de la caméra
export const CHAR_K = 1 / WORLD_SCALE;
// les boss gardent leur écart de taille avec le décor : +20 % dès que le monde est agrandi
export const BOSS_K = WORLD_SCALE > 1 ? 1.2 : 1;
