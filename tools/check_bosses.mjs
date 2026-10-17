// Contrôle des combos écrits des boss (js/data.js, BOSS_STYLES). Usage : node tools/check_bosses.mjs
// Échoue (code 1) si un kit viole les règles de lisibilité du GDD (pilier 1) ; affiche la durée de chaque combo.
import { BOSSES } from '../js/data.js';

const ATK = new Set(['ball', 'volley', 'nova', 'swing', 'pulse', 'dash', 'rain', 'beam', 'summon', 'wall', 'whirl', 'geyser', 'mirror', 'tp', 'feint']);
const MIN_WIND = 0.4;           // aucune attaque ne part en moins de 0,4 s (pilier 1 : tout est annoncé)
const HOLD = [0.2, 0.5];        // retard du coup : +0,2 à +0,5 s, toujours avec pose tenue
const SIG_TIME = [3.0, 5.5];    // temps fort de phase 3 : durée de la danse (hors ouverture)
const errors = [], notes = [];
const err = m => errors.push(m);

for (const [id, B] of Object.entries(BOSSES)) {
  if (!B.combos) { err(`${id} : pas de combos`); continue; }
  if (B.combos.length !== 3) err(`${id} : ${B.combos.length} phases de combos au lieu de 3`);
  const colosse = B.style === 'Colosse';
  B.combos.forEach((cs, ph) => {
    const tag = `${id} P${ph + 1}`;
    const bands = new Set();
    let sig = 0;
    for (const c of cs) {
      const where = `${tag} « ${c.name} »`;
      if (!c.steps || !c.steps.length) { err(`${where} : aucune étape`); continue; }
      let total = 0;
      c.steps.forEach((s, i) => {
        const [a, wind, gap, hold] = s;
        if (!ATK.has(a)) err(`${where} étape ${i + 1} : attaque inconnue « ${a} »`);
        if (wind !== undefined && wind < MIN_WIND) err(`${where} étape ${i + 1} : préparation ${wind} s < ${MIN_WIND} s`);
        if (hold !== undefined && (hold < HOLD[0] || hold > HOLD[1])) err(`${where} étape ${i + 1} : retard ${hold} s hors de ${HOLD.join('–')} s`);
        if (hold !== undefined && ['dash', 'tp', 'feint', 'mirror', 'summon'].includes(a)) err(`${where} étape ${i + 1} : retard interdit sur ${a}`);
        if (i < c.steps.length - 1 && gap !== undefined && gap > 0.6) err(`${where} étape ${i + 1} : pause ${gap} s, le combo se disloque`);
        total += (wind ?? 0.6) + (hold ?? 0) + (i < c.steps.length - 1 ? (gap ?? 0.35) : 0);
      });
      if (c.steps[c.steps.length - 1][0] === 'feint') err(`${where} : un combo ne finit pas sur une feinte`);
      if (!(c.open >= 1.2)) err(`${where} : ouverture ${c.open} s < 1,2 s`);
      if (colosse && !(c.open >= 2.0)) err(`${where} : un Colosse offre au moins 2 s d'ouverture (${c.open} s)`);
      const first = c.steps[0][0];
      if (!c.every && !c.band.includes('near') && c.band !== 'any' && first === 'swing') err(`${where} : corps à corps lancé hors de la bande « near » (${c.band})`);
      if (c.every) {
        sig++;
        if (ph !== 2) notes.push(`${tag} « ${c.name} » : temps fort hors phase 3`);
        if (total < SIG_TIME[0] || total > SIG_TIME[1]) err(`${where} : danse de ${total.toFixed(2)} s hors de ${SIG_TIME.join('–')} s`);
        if (first === 'swing') err(`${where} : le temps fort doit s'ouvrir sur un déplacement, pas un corps à corps`);
      } else for (const b of (c.band === 'any' ? ['near', 'mid', 'far'] : c.band.split(' '))) bands.add(b);
      notes.push(`${tag.padEnd(14)} ${(c.every ? '★ ' : '  ') + c.name.padEnd(24)} ${c.band.padEnd(9)} ${String(c.steps.length).padStart(2)} coups  ${total.toFixed(2)} s  ouverture ${c.open} s`);
    }
    for (const b of ['near', 'mid', 'far']) if (!bands.has(b)) err(`${tag} : aucun combo pour la bande « ${b} »`);
    // l'anti-répétition ne doit jamais forcer un corps à corps loin du joueur : au moins 2 combos qui ne s'ouvrent pas sur un coup au corps en bande mid ou far
    const ranged = cs.filter(c => !c.every && (c.band === 'any' || /mid|far/.test(c.band)) && c.steps[0][0] !== 'swing').length;
    if (ranged < 2) err(`${tag} : ${ranged} combo(s) de moyenne/longue portée, il en faut au moins 2`);
    if (ph === 2 && sig !== 1) err(`${tag} : ${sig} temps fort(s), il en faut exactement 1`);
    if (ph < 2 && sig) err(`${tag} : le temps fort est réservé à la phase 3`);
    const names = cs.map(c => c.name); // l'anti-répétition suppose au moins 2 combos par bande
  });
}

console.log(notes.join('\n'));
if (errors.length) { console.error(`\n${errors.length} erreur(s) :\n- ` + errors.join('\n- ')); process.exit(1); }
console.log(`\nOK : ${Object.keys(BOSSES).length} boss, tous les kits respectent les règles.`);
