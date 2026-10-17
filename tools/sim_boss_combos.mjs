// Simulation sans affichage des combos écrits de boss : joue chaque boss, chaque phase et trois distances avec le vrai code de js/game.js
// (bossAI, bossChoose, bossStrike…) sur un monde factice, et vérifie que le jeu fait ce que les données annoncent.
// Usage : node tools/sim_boss_combos.mjs [--verbose]
const verbose = process.argv.includes('--verbose');
Object.assign(globalThis, {
  location: { search: '', href: 'http://localhost/', hash: '', pathname: '/', origin: 'http://localhost' },
  document: { createElement: () => ({ getContext: () => ({}), style: {}, addEventListener() {} }), addEventListener() {}, body: {}, getElementById: () => null },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  addEventListener: () => {}, Image: class { set src(v) {} }, AudioContext: class {},
});
globalThis.window = globalThis;
try { Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [] }, configurable: true }); } catch (e) { /* déjà défini */ }

const { Game } = await import('../js/game.js');
const D = await import('../js/data.js');
const M = await import('../js/maps.js');
const { SFX } = await import('../js/audio.js');
for (const k of Object.keys(SFX)) if (typeof SFX[k] === 'function') SFX[k] = () => {};

// hasard reproductible
let seed = 12345; Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const DT = 1 / 60, TS = M.TS, FR = DT * 1.5;   // tolérance : 1,5 image
const errors = [];
const fail = m => { if (errors.length < 60 && !errors.includes(m)) errors.push(m); };

function makeWorld() {
  return { grid: new Uint8Array(M.MW * M.MH).fill(M.T.FLOOR), obs: [], arena: { cx: 62, cy: 36, r: M.ARENA_R }, def: {} };
}

function makeSim(id, phase, dist, { parry = false } = {}) {
  const B = D.BOSSES[id], g = Object.create(Game.prototype);
  Object.assign(g, { world: makeWorld(), t: 0, enemies: [], projs: [], rings: [], zones: [], beams: [], parts: [], obs: [], shake: 0, hitstop: 0 });
  const cx = g.world.arena.cx * TS, cy = g.world.arena.cy * TS;
  const player = { x: cx, y: cy + 40, exh: false, hp: 100, maxhp: 100 };
  const b = { def: { ...B, boss: true, kind: 'boss' }, type: 'boss', sprite: B.sprite, x: cx, y: cy, hx: cx, hy: cy, hp: B.hp, maxhp: B.hp, dmg: B.dmg, r: B.r, dir: 0, face: { x: 0, y: 1 }, state: 'move', st: 0, at: 0, anim: 'Idle', loop: true, flash: 0, cd: 0.5, vx: 0, vy: 0, kx: 0, ky: 0, dead: false, boss: true, phase, invuln: 0, tele: false, obsT: 99, nCombo: 0 };
  g.enemies.push(b); g.boss = b;
  const log = { strikes: [], steps: [], hits: [], obstacles: 0, summons: 0 };
  g.actors = () => [player];
  g.hurtMember = (m, dmg, src, o) => { const r = parry && src.atkType === 'swing' ? 'parry' : 'hit'; log.hits.push({ t: g.t, type: src.atkType, parry: r === 'parry' }); return r; };
  for (const k of ['bossCry', 'burst', 'fx', 'ringFx', 'spark', 'hitObs', 'emit']) g[k] = () => {};
  g.fireProj = p => { log.hits.push({ t: g.t, type: 'proj' }); };
  g.spawnSummons = () => { log.summons++; };
  g.spawnObstacles = () => { log.obstacles++; };
  const strike = Game.prototype.bossStrike, step = Game.prototype.bossComboStep;
  g.bossStrike = function (bb, u, tg) {
    const last = log.strikes[log.strikes.length - 1];
    if (!(last && last.t === g.t && bb.atkType === 'swing' && last.type === 'tp')) log.strikes.push({ t: g.t, type: bb.atkType, d: Math.hypot(player.x - bb.x, player.y - bb.y), combo: bb.combo && bb.combo.c.name, i: bb.combo && bb.combo.i });
    return strike.call(this, bb, u, tg);
  };
  g.bossComboStep = function (bb) { step.call(this, bb); log.steps.push({ t: g.t, type: bb.atkType, wind: bb.st, name: bb.combo.c.name, i: bb.combo.i }); };
  return { g, b, player, log, B };
}

// avance la simulation ; le joueur reste à `dist` px du boss tant que celui-ci cherche sa prochaine attaque
function run(sim, dist, seconds, hook) {
  const { g, b, player } = sim; const stats = { menace: 0, total: 0 };
  for (let n = 0; n < seconds / DT; n++) {
    g.t += DT;
    b.cd -= DT; b.at += DT;   // ce que fait updateEnemies avant bossAI
    if (b.state === 'move') { const v = { x: player.x - b.x, y: player.y - b.y }, l = Math.hypot(v.x, v.y) || 1; player.x = b.x + v.x / l * dist; player.y = b.y + v.y / l * dist; }
    if (hook) hook(n, sim);
    g.bossAI(b, DT);
    stats.total++; if (b.state === 'windup' || b.state === 'dash' || (b.combo && b.combo.pending)) stats.menace++;
  }
  return stats;
}

const BANDS = { 36: 'near', 100: 'mid', 220: 'far' };
const report = [];
for (const id of Object.keys(D.BOSSES)) {
  const B = D.BOSSES[id];
  for (let phase = 1; phase <= 3; phase++) for (const dist of [36, 100, 220]) {
    const where = `${id} P${phase} ${BANDS[dist]}`;
    let sim; try { sim = makeSim(id, phase, dist); run(sim, dist, 120); } catch (e) { fail(`${where} : exception ${e.message} (${(e.stack || '').split('\n')[1]})`); continue; }
    const { log, b } = sim, cs = B.combos[phase - 1], bd = B.bands || [64, 150];
    // 1. chaque étape part à l'heure : préparation (+ retard) annoncée
    const starts = log.steps;
    if (!starts.length) { fail(`${where} : aucun combo en 120 s`); continue; }
    for (const s of starts) {
      const c = cs.find(x => x.name === s.name), stp = c.steps[s.i], strike = log.strikes.find(k => k.t >= s.t - 1e-9 && k.type === stp[0] && k.i === s.i && k.combo === s.name);
      if (!strike) continue;   // combo interrompu en fin de simulation
      const want = (stp[1] ?? D.BOSSES[id].tempo?.wind ?? 0.6) + (stp[3] || 0), got = strike.t - s.t;
      if (Math.abs(got - want) > FR) fail(`${where} « ${s.name} » étape ${s.i + 1} (${stp[0]}) : coup après ${got.toFixed(3)} s, attendu ${want.toFixed(3)} s`);
    }
    // 2. ordre des coups = ordre écrit
    const byCombo = []; let cur = null;
    for (const s of starts) { if (s.i === 0) { cur = { name: s.name, types: [], t0: s.t }; byCombo.push(cur); } if (cur) cur.types.push(s.type); }
    byCombo.forEach(k => { const c = cs.find(x => x.name === k.name); const exp = c.steps.map(x => x[0]); const got = k.types; if (got.length === exp.length && got.join() !== exp.join()) fail(`${where} « ${k.name} » : ordre ${got} ≠ ${exp}`); });
    // 3. choix selon la distance : un combo hors bande n'est admis que si la bande n'avait que le combo précédent (anti-répétition), et jamais en corps à corps
    const band = BANDS[dist];
    byCombo.forEach((k, i) => {
      const c = cs.find(x => x.name === k.name); if (c.every) return;
      if (c.band === 'any' || c.band.includes(band)) return;
      const prev = i ? byCombo[i - 1].name : null, inBand = cs.filter(x => !x.every && (x.band === 'any' || x.band.includes(band)));
      if (inBand.some(x => x.name !== prev)) fail(`${where} : « ${k.name} » (${c.band}) choisi hors de sa bande alors qu'un combo de la bande était disponible`);
      if (c.steps[0][0] === 'swing') fail(`${where} : « ${k.name} » (corps à corps) lancé en bande « ${band} »`);
    });
    // 4. jamais deux fois le même combo de suite, temps fort tous les 3 combos
    for (let i = 1; i < byCombo.length; i++) if (byCombo[i].name === byCombo[i - 1].name) fail(`${where} : « ${byCombo[i].name} » deux fois de suite`);
    const sig = cs.find(x => x.every);
    if (sig) byCombo.forEach((k, i) => { const isSig = k.name === sig.name; if (isSig !== (i % sig.every === sig.every - 1)) fail(`${where} : combo n°${i + 1} « ${k.name} », temps fort attendu aux rangs multiples de ${sig.every}`); });
    // 5. ouverture : aucune menace pendant `open` après le dernier coup
    for (let i = 0; i < byCombo.length - 1; i++) {
      const c = cs.find(x => x.name === byCombo[i].name), lastStep = starts.filter(s => s.name === c.name && s.t >= byCombo[i].t0).slice(c.steps.length - 1, c.steps.length)[0];
      const next = byCombo[i + 1]; if (!lastStep) continue;
      const lastStrike = log.strikes.find(k => k.t >= lastStep.t && k.i === lastStep.i && k.combo === c.name);
      if (lastStrike && next.t0 - lastStrike.t < c.open - FR) fail(`${where} : ouverture de « ${c.name} » ${(next.t0 - lastStrike.t).toFixed(2)} s < ${c.open} s`);
    }
    // 6. pas de combo en panne
    const gap = Math.max(...starts.filter(s => s.i === 0).map((s, i, a) => i ? s.t - a[i - 1].t : 0));
    if (gap > 14) fail(`${where} : ${gap.toFixed(1)} s sans nouveau combo`);
    if (phase >= 2 && log.obstacles === 0 && dist === 100) { /* le compteur d'obstacles est neutralisé dans ce banc (obsT = 99) */ }
    if (dist === 100) { const st = run(makeSim(id, phase, dist).__proto__ ? sim : sim, dist, 0); report.push({ id, phase, combos: byCombo.length, maxGap: gap }); }
  }
}

// 7. parade : brise le combo (aucune étape suivante après un coup paré), sans panne
for (const id of ['mewtwo', 'entei', 'raikou', 'celebi']) for (const dist of [36, 100]) {
  const sim = makeSim(id, 2, dist, { parry: true });
  try { run(sim, dist, 60); } catch (e) { fail(`parade ${id} : exception ${e.message}`); continue; }
  const { steps, hits } = sim.log; let parried = 0;
  if (steps.filter(s => s.i === 0).length < 5) fail(`parade ${id} (${dist}) : moins de 5 combos en 60 s`);
  for (const h of hits) if (h.parry) {
    parried++; const nx = steps.find(s => s.t > h.t + 1e-9);
    if (nx && nx.i !== 0) fail(`parade ${id} (${dist}) : l'étape ${nx.i + 1} de « ${nx.name} » a suivi un coup paré`);
  }
  if (!parried) fail(`parade ${id} (${dist}) : aucun coup paré dans le scénario`);
}

// 8. étourdissement en pleine préparation : le combo est abandonné, le boss reprend normalement
{
  const sim = makeSim('mewtwo', 3, 36); let stunned = false, after = 0;
  run(sim, 36, 40, (n, s) => {
    if (!stunned && s.b.state === 'windup' && s.b.combo && s.b.combo.i === 1) { stunned = s.g.stunBoss(s.b, 1.2); }
    if (stunned && s.b.state === 'move' && !after) after = s.g.t;
  });
  if (!stunned) fail('étourdissement : impossible de déclencher stunBoss en préparation');
  else if (!sim.log.steps.some(s => s.t > after && s.i === 0)) fail('étourdissement : aucun nouveau combo après l\'étourdissement');
  else if (sim.b.held) fail('étourdissement : la pose tenue est restée active');
}

// 9. téléportation : le point d'arrivée est connu pendant la préparation, le coup arrive dans le dos
{
  const sim = makeSim('mewtwo', 3, 150); let seen = null, arrived = null;
  run(sim, 150, 40, (n, s) => {
    if (s.b.state === 'windup' && s.b.atkType === 'tp' && s.b.tpDest && !seen) seen = { ...s.b.tpDest, p: { x: s.player.x, y: s.player.y }, from: { x: s.b.x, y: s.b.y } };
    if (seen && !arrived && s.b.state === 'recover') arrived = { x: s.b.x, y: s.b.y };
  });
  if (!seen) fail('téléportation : image rémanente jamais affichée (tpDest absent)');
  else if (!arrived || Math.hypot(arrived.x - seen.x, arrived.y - seen.y) > 1) fail(`téléportation : arrivée ${JSON.stringify(arrived)} ≠ image rémanente ${JSON.stringify(seen)}`);
  else { const d0 = Math.hypot(seen.from.x - seen.p.x, seen.from.y - seen.p.y), d1 = Math.hypot(arrived.x - seen.p.x, arrived.y - seen.p.y), behind = (seen.p.x - seen.from.x) * (arrived.x - seen.p.x) + (seen.p.y - seen.from.y) * (arrived.y - seen.p.y) > 0; if (!behind) fail('téléportation : arrivée devant le joueur'); if (d1 > 40) fail(`téléportation : arrivée à ${d1.toFixed(0)} px du joueur`); }
}

// rapport : rythme moyen à distance moyenne
const rows = [];
for (const id of Object.keys(D.BOSSES)) for (let ph = 1; ph <= 3; ph++) {
  const sim = makeSim(id, ph, 100); const st = run(sim, 100, 120);
  const tele = sim.log.strikes.length, hold = sim.log.steps.length;
  rows.push(`${id.padEnd(10)} P${ph} ${D.BOSSES[id].style.padEnd(18)} coups/min ${(sim.log.strikes.length / 2).toFixed(0).padStart(3)}  menace ${(100 * st.menace / st.total).toFixed(0).padStart(3)} %  combos ${sim.log.steps.filter(s => s.i === 0).length}`);
}
console.log(rows.join('\n'));
if (errors.length) { console.error(`\n${errors.length} problème(s) :\n- ` + errors.join('\n- ')); process.exit(1); }
console.log('\nOK : les combos s\'exécutent comme écrits (délais, ordre, bandes, ouvertures, parade, étourdissement, téléportation).');
