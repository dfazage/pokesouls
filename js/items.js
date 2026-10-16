// Icônes d'objets (sprites 30x30, PokéAPI/sprites, assets/items/) : sac, bannière et toast de ramassage, bulle qui sort de la Poké Ball.
import * as D from './data.js';
const BASE = 'assets/items/';
const FIXED = { candy: 'rare-candy', berrypack: 'oran-berry', berry: 'oran-berry', maxberry: 'sitrus-berry', etherpack: 'ether', ether: 'ether', maxether: 'max-ether', revive: 'revive',
  hpup: 'hp-up', protein: 'protein', iron: 'iron', calcium: 'calcium', carbos: 'carbos', zinc: 'zinc' };
const TYPE_EN = { Feu: 'fire', Eau: 'water', Plante: 'grass', Normal: 'normal', Psy: 'psychic', 'Électrik': 'electric', Sol: 'ground', Glace: 'ice' };

// Fichier d'icône d'un objet (clé du jeu : candy, revive, hpup…, ou id de CT) ; null si inconnu.
export function itemIconFile(key) {
  const f = FIXED[key] || (D.TMS[key] ? 'tm-' + (TYPE_EN[D.TMS[key].type] || 'normal') : null);
  return f ? BASE + f + '.png' : null;
}
export function iconImg(key, cls = 'itemico') { const s = itemIconFile(key); return s ? `<img class="${cls}" src="${s}" alt="">` : ''; }

// Images préchargées pour le canvas (bulle d'objet) ; les manquantes restent absentes sans erreur.
const CACHE = {};
export function itemImage(key) { return CACHE[itemIconFile(key)] || null; }
export async function loadItemIcons() {
  const files = new Set([...Object.keys(FIXED), ...Object.keys(D.TMS)].map(itemIconFile).filter(Boolean));
  await Promise.all([...files].map(f => new Promise(res => { const i = new Image(); i.onload = () => { CACHE[f] = i; res(); }; i.onerror = res; i.src = f; })));
}
