// Écrans et menus : choix des starters, feu de camp, sac et équipe, voyage, commandes, pause.
import { A } from './assets.js';
import * as D from './data.js';
import * as M from './maps.js';
import { ACTIONS, PAD_LABELS, Controls, keyLabel } from './input.js';
import { portrait } from './hud.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TYPES = [['fire', 'Feu', '#ff7a30'], ['water', 'Eau', '#4aa8ff'], ['grass', 'Plante', '#6cd84c']];
const menu = () => $('#menu');
export function hideMenu() { const m = menu(); m.classList.remove('show'); m.innerHTML = ''; }
function open(html) { const m = menu(); m.classList.add('show'); m.innerHTML = html; return m; }

// ---------- choix des starters ----------
export function showStarters(onDone) {
  const el = $('#starters'); el.classList.add('show');
  const pick = { fire: 0, water: 0, grass: 0 };
  const draw = () => {
    el.innerHTML = `<h2>Choisissez vos trois compagnons</h2><p class="sub">Un starter de chaque type, parmi toutes les générations. Ils évolueront au niveau ${D.EVOLVE_AT[0]} puis ${D.EVOLVE_AT[1]}.</p>
      <div class="scols">${TYPES.map(([t, label, col]) => {
        const sel = D.STARTERS[t][pick[t]];
        return `<div class="scol" style="--c:${col}"><h3>${label} · ${D.ARCH[t].cls}</h3>
          <div class="sgrid">${D.STARTERS[t].map((l, i) => `<button class="sth ${i === pick[t] ? 'on' : ''}" data-t="${t}" data-i="${i}" title="${esc(D.NAMES_FR[l[0]])}"><img src="${portrait(l[0])}" alt=""><small>Gén. ${D.GEN_OF[l[0]]}</small></button>`).join('')}</div>
          <div class="sprev"><img src="${portrait(sel[0])}" alt=""><div><b>${esc(D.NAMES_FR[sel[0]])}</b><small>${sel.map(s => esc(D.NAMES_FR[s])).join(' → ')}</small>
          <small>${D.ARCH[t].mode === 'ranged' ? 'À distance' : 'Corps à corps'} · CT de départ : ${esc(D.TMS[D.ARCH[t].tm].name)}</small></div></div></div>`;
      }).join('')}</div>
      <div class="act"><button id="st-go">Commencer l’aventure</button></div>`;
    el.querySelectorAll('.sth').forEach(b => b.onclick = () => { pick[b.dataset.t] = +b.dataset.i; draw(); });
    $('#st-go').onclick = () => { el.classList.remove('show'); onDone({ ...pick }); };
  };
  draw();
}

// ---------- feu de camp ----------
export function showBonfireMenu(game, bonfire, onClose, extra) {
  const render = () => {
    const m = open(`<div class="panel"><h2>${esc(bonfire.name)}</h2><p class="sub">Le feu vous accueille. Se reposer soigne l'équipe, recharge les baies et fait revenir les ennemis.</p>
      <div class="essl">Essence : <b>${game.essence}</b> &nbsp; Super Bonbons : <b>${game.bag.candy || 0}</b></div>
      <div class="lv">${game.team.map((t, i) => { const c = D.levelCost(t.lvl), ok = game.essence >= c && t.lvl < D.MAX_LEVEL;
        const nxtStage = t.stage < 2 && t.lvl + 1 >= D.EVOLVE_AT[t.stage] ? ` · <em>évolue en ${esc(D.NAMES_FR[t.line[t.stage + 1]])}</em>` : '';
        return `<div class="row"><img src="${portrait(t.id)}" alt=""><div><b>${esc(t.def.name)}</b> <span>${t.def.typeName} · ${t.def.cls}</span><small>Niv. ${t.lvl}${t.lvl < D.MAX_LEVEL ? ` · PV ${t.maxhp}` : ' · max'}${nxtStage}</small></div><button data-up="${i}" ${ok ? '' : 'disabled'}>Monter · ${c}</button></div>`; }).join('')}</div>
      <div class="act"><button id="m-bag">Sac et équipe</button><button id="m-travel">Voyager</button><button id="m-rest">Se reposer</button><button id="m-close">Repartir</button></div></div>`);
    m.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { game.levelUp(+b.dataset.up); render(); });
    $('#m-rest').onclick = () => { game.rest(); game.last = { map: game.mapIdx, id: bonfire.id }; game.save(); game.emit('toast', 'L’équipe se repose'); onClose(); };
    $('#m-close').onclick = onClose;
    $('#m-bag').onclick = () => extra.bag(() => render());
    $('#m-travel').onclick = () => extra.travel();
  };
  render();
}

// ---------- sac et équipe ----------
export function showBag(game, onClose) {
  const render = () => {
    const names = D.VITAMINS;
    const memb = game.team.map((m, i) => `<div class="mc t-${m.type}"><img src="${portrait(m.id)}" alt=""><div><b>${esc(m.def.name)}</b> <span>Niv. ${m.lvl} · ${m.def.typeName}</span>
      <small>PV ${Math.ceil(m.hp)}/${m.maxhp} · Dégâts ${m.def.dmg.toFixed(1)} · Vitesse ${Math.round(m.def.speed)}</small>
      <small>CT : <b>${esc(m.def.ability.name)}</b> (${m.def.ability.type})</small>
      <small class="vit">${Object.keys(names).map(k => `${names[k].name.slice(0, 4)}. ${m.vit[k]}/5`).join(' · ')}</small></div></div>`).join('');
    const tgt = (kind, key, can) => game.team.map((m, i) => `<button class="mini-b ${can(m) ? '' : 'off'}" data-use="${kind}:${key}:${i}" ${can(m) ? '' : 'disabled'} title="${esc(m.def.name)}"><img src="${portrait(m.id)}" alt=""></button>`).join('');
    const items = [];
    if (game.bag.candy) items.push(`<div class="irow"><div><b>Super Bonbon</b> ×${game.bag.candy}<small>+1 niveau, sans coût d'essence.</small></div><div class="tg">${tgt('candy', 'candy', m => m.lvl < D.MAX_LEVEL)}</div></div>`);
    for (const k of Object.keys(names)) if (game.bag[k]) items.push(`<div class="irow"><div><b>${names[k].name}</b> ×${game.bag[k]}<small>${names[k].desc}</small></div><div class="tg">${tgt('vit', k, m => m.vit[k] < 5)}</div></div>`);
    const tms = game.tms.map(t => { const T = D.TMS[t]; return `<div class="irow"><div><b>CT : ${esc(T.name)}</b> <span style="color:${T.color}">${T.type}</span><small>${esc(T.desc)} Coût ${T.cost} · recharge ${T.cd} s</small></div><div class="tg">${game.team.map((m, i) => `<button class="mini-b ${m.tm === t ? 'cur' : ''}" data-use="tm:${t}:${i}" title="${esc(m.def.name)}"><img src="${portrait(m.id)}" alt=""></button>`).join('')}</div></div>`; }).join('');
    const m = open(`<div class="panel wide"><h2>Sac et équipe</h2><div class="mcs">${memb}</div>
      <h4>Objets</h4><div class="ilist">${items.join('') || '<p class="sub">Aucun objet à utiliser pour l’instant.</p>'}</div>
      <h4>Capsules techniques (clic sur un Pokémon pour lui apprendre la CT)</h4><div class="ilist">${tms}</div>
      <p class="sub">Baies : ${game.berries} / ${game.maxBerries}</p>
      <div class="act"><button id="m-close">Fermer</button></div></div>`);
    m.querySelectorAll('[data-use]').forEach(b => b.onclick = () => {
      const [kind, key, i] = b.dataset.use.split(':');
      if (kind === 'candy') game.useCandy(+i); else if (kind === 'vit') game.useVitamin(+i, key); else game.teach(+i, key);
      render();
    });
    $('#m-close').onclick = onClose;
  };
  render();
}

// ---------- voyage entre les cartes ----------
export function showTravel(game, onClose, onGo) {
  const opts = game.travelOptions();
  const m = open(`<div class="panel wide"><h2>Carte du chapitre · Génération 1</h2><p class="sub">Téléportez-vous vers l’entrée d’une carte débloquée ou vers un feu déjà allumé. Impossible pendant un combat de boss. Vaincre le boss d’une carte ouvre la suivante.</p>
    <div class="maps">${opts.map(o => `<div class="mp ${o.open ? '' : 'locked'} ${o.idx === game.mapIdx ? 'here' : ''}"><div class="mh"><b>${o.idx + 1}. ${esc(o.name)}</b><span>${esc(o.sub)}</span><em>${o.open ? (o.done ? '✔ ' : '') + 'Boss : ' + esc(o.boss) : 'Verrouillée'}</em></div>
      <div class="spots">${o.spots.map(s => `<button data-go="${o.idx}:${s.id}">${esc(s.name)}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="act"><button id="m-close">Fermer</button></div></div>`);
  m.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const [i, id] = b.dataset.go.split(':'); onGo(+i, id); });
  $('#m-close').onclick = onClose;
}

// ---------- commandes (lecture et modification) ----------
export function showControls(onClose) {
  let waiting = null;
  const render = () => {
    const rows = ACTIONS.map(([grp, list]) => `<h4>${grp}</h4>` + list.map(([a, label]) => `<div class="krow"><span>${label}</span>${[0, 1, 2].map(s => {
      const on = waiting && waiting[0] === a && waiting[1] === s;
      return `<button class="keybtn ${on ? 'wait' : ''}" data-a="${a}" data-s="${s}">${on ? 'Appuyez…' : keyLabel(Controls.get(a)[s])}</button>`; }).join('')}</div>`).join('')).join('');
    const m = open(`<div class="panel wide kp"><h2>Commandes</h2><p class="sub">Cliquez sur une case puis appuyez sur la touche (ou un bouton de souris) voulue. Échap annule, Retour arrière efface la case. Une touche ne peut servir qu’à une action : elle est retirée de l’ancienne. Les réglages sont enregistrés dans ce navigateur.</p>
      <div class="kcols"><div>${rows}</div><div><h4>Manette (disposition standard, fixe)</h4>${PAD_LABELS.map(([a, b]) => `<div class="krow"><span>${a}</span><kbd>${b}</kbd></div>`).join('')}
      <h4>Pour info</h4><div class="krow"><span>Parade</span><kbd>Garde juste avant le coup</kbd></div><div class="krow"><span>Mode développeur</span><kbd>?dev dans l’adresse · F1–F6</kbd></div></div></div>
      <div class="act"><button id="k-reset" class="warn">Valeurs par défaut</button><button id="m-close">Fermer</button></div></div>`);
    m.querySelectorAll('.keybtn').forEach(b => b.onclick = () => {
      Controls.stopListen(); waiting = [b.dataset.a, +b.dataset.s]; render();
      Controls.listen(code => {
        const [a, s] = waiting; waiting = null;
        if (code === 'Escape') { /* annule */ } else if (code === 'Backspace' || code === 'Delete') Controls.set(a, s, ''); else Controls.set(a, s, code);
        render();
      });
    });
    $('#k-reset').onclick = () => { Controls.stopListen(); waiting = null; Controls.reset(); render(); };
    $('#m-close').onclick = () => { Controls.stopListen(); onClose(); };
  };
  render();
}

// ---------- pause ----------
export function showPauseMenu(game, h) {
  open(`<div class="panel"><h2>Pause</h2><p class="sub">${esc(game.world.name)} · Carte ${game.mapIdx + 1}/6</p>
    <div class="act col"><button id="p-res">Reprendre</button><button id="p-bag">Sac et équipe</button><button id="p-map">Carte et voyage</button><button id="p-keys">Commandes</button><button id="p-reset" class="warn">Effacer la sauvegarde</button></div></div>`);
  $('#p-res').onclick = h.resume; $('#p-bag').onclick = h.bag; $('#p-map').onclick = h.travel; $('#p-keys').onclick = h.keys;
  $('#p-reset').onclick = () => { if (confirm('Effacer la sauvegarde et recommencer ?')) h.reset(); };
}
