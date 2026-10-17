// Contrôle de la répartition des mobs par tier (bas / moyen / haut) sur chaque carte des deux chapitres. Usage : node tools/check_mobs.mjs
import * as M from '../js/maps.js';
const errs = [];
for (const ch of Object.keys(M.CHAPTER_MAPS)) {
  M.setChapter(ch);
  M.MAPS.forEach((def, idx) => {
    if (!def.mobs) return;
    const w = M.buildWorld(idx), z = {};
    for (const s of w.spawns) {
      const k = s.room, t = z[k] ??= { bas: 0, moyen: 0, haut: 0, autre: 0 };
      if (s.up) t.haut++; else if (def.mobs.mini.includes(s.type)) t.bas++; else if (def.mobs.mid.includes(s.type)) t.moyen++; else t.autre++;
    }
    const tiers = Object.keys(z).map(Number).sort((a, b) => a - b).map(k => `${k}:${z[k].bas}/${z[k].moyen}/${z[k].haut}${z[k].autre ? '+' + z[k].autre : ''}`).join('  ');
    const tot = w.spawns.length, hi = w.spawns.filter(s => s.up).length;
    console.log(`${ch} ${def.id.padEnd(3)} lv${String(def.lv).padStart(2)} ${String(tot).padStart(3)} mobs, ${String(hi).padStart(2)} haut | zone:bas/moyen/haut  ${tiers}`);
    if (tot < 12) errs.push(`${def.id} : seulement ${tot} mobs`);
    const profil = Object.values(z).filter(t => t.haut > 0).length;
    if (!hi) errs.push(`${def.id} : aucun mob haut niveau`);
    if (profil === Object.keys(z).length) errs.push(`${def.id} : tous les secteurs sont de haut niveau`);
    if (!Object.values(z).some(t => t.bas >= 2 && !t.haut)) errs.push(`${def.id} : aucun secteur calme`);
  });
}
if (errs.length) { console.error('\n' + errs.length + ' erreur(s) :\n- ' + errs.join('\n- ')); process.exit(1); }
console.log('\nOK : chaque carte mélange des secteurs calmes et dangereux.');
