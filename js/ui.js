// Écrans et menus : choix des starters, feu de camp, sac et équipe, voyage, commandes, pause.
import { A } from './assets.js';
import { iconImg } from './items.js';
import * as D from './data.js';
import * as M from './maps.js';
import { ACTIONS, PAD_LABELS, Controls, keyLabel } from './input.js';
import { portrait } from './hud.js';
import { relayInfo } from './relay.js';
import { POOL, GABS, poolEntry, archOf } from './pool.js';
import { Music, TRACKS } from './music.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const menu = () => $('#menu');
export function hideMenu() { const m = menu(); m.classList.remove('show'); m.innerHTML = ''; }
function open(html) { const m = menu(); m.classList.add('show'); m.innerHTML = html; return m; }

const volRow = () => `<div class="vol"><label>Musique <input type="range" id="vol-music" min="0" max="100" value="${Math.round(Music.getVolume() * 100)}"><b id="vol-v">${Math.round(Music.getVolume() * 100)} %</b></label></div>`;
function bindVol() { const r = $('#vol-music'); if (r) r.oninput = () => { Music.setVolume(r.value / 100); $('#vol-v').textContent = r.value + ' %'; }; }

// ---------- choix des compagnons (pool de 39 lignées, 3 libres) ----------
const GAB_COL = { A: '#ff8a50', R: '#5ab8ff', D: '#c98aff', S: '#7be07a' };
export function showStarters(onDone) {
  const el = $('#starters'); el.classList.add('show');
  const picks = []; let focus = POOL[0].key;
  const draw = () => {
    const f = poolEntry(focus), ri = relayInfo(f.line), ar = archOf(f), tm = D.TMS[ar.tm];
    const types = D.typesOf(f.type, f.key);
    el.innerHTML = `<h2>Choisissez vos trois compagnons</h2>
      <p class="sub">Trois Pokémon au choix parmi 39 lignées, rangées par style de combat. Changer de Pokémon juste après une esquive ou une parade parfaite déclenche son attaque de relais. Deux Pokémon du même type en résonance frappent plus fort.</p>
      <div class="pcols">${Object.values(GABS).map(g => `<div class="pcol" style="--c:${GAB_COL[g.id]}"><h3>${g.name} <em>${POOL.filter(p => p.gab === g.id).length}</em></h3><small>${esc(g.desc)}</small>
        <div class="pgrid">${POOL.filter(p => p.gab === g.id).map(p => `<button class="pth ${picks.includes(p.key) ? 'on' : ''} ${p.key === focus ? 'foc' : ''}" data-k="${p.key}" title="${esc(D.NAMES_FR[p.key])}"><img src="${portrait(p.key)}" alt="">${picks.includes(p.key) ? `<i>${picks.indexOf(p.key) + 1}</i>` : ''}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="pbot"><div class="pdetail" style="--c:${GAB_COL[f.gab]}"><img src="${portrait(f.key)}" alt=""><div><b>${esc(D.NAMES_FR[f.key])}</b> <span>Gén. ${f.gen}</span>
        <small>${f.line.filter((x, i) => i === 0 || x !== f.line[i - 1]).map(x => esc(D.NAMES_FR[x])).join(' → ')}</small>
        <small>${types.map(t => `<u class="ty-${t}">${D.TYPE_FR[t] || t}</u>`).join('')} ${ar.cls} · ${ar.mode === 'ranged' ? 'À distance' : 'Corps à corps'} · CT de départ : ${esc(tm.name)}</small>
        <small class="srel"><b>Relais · ${esc(ri.name)}</b> : ${esc(ri.text)}</small></div></div>
        <div class="ptray">${[0, 1, 2].map(i => { const k = picks[i]; return k ? `<button class="pslot full" data-r="${k}"><img src="${portrait(k)}" alt=""><span>${esc(D.NAMES_FR[k])}</span></button>` : `<div class="pslot"><span>Compagnon ${i + 1}</span></div>`; }).join('')}</div>
        <div class="act"><button id="st-go" ${picks.length === 3 ? '' : 'disabled'}>${picks.length === 3 ? 'Commencer l’aventure' : `Encore ${3 - picks.length} à choisir`}</button></div></div>`;
    el.querySelectorAll('.pth').forEach(b => b.onclick = () => {
      const k = b.dataset.k; focus = k;
      const i = picks.indexOf(k); if (i >= 0) picks.splice(i, 1); else { if (picks.length === 3) picks.shift(); picks.push(k); }
      draw();
    });
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { picks.splice(picks.indexOf(b.dataset.r), 1); draw(); });
    const go = $('#st-go'); if (go) go.onclick = () => { if (picks.length === 3) { el.classList.remove('show'); onDone([...picks]); } };
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
let bagSel = 0, bagTab = 'items';
export function showBag(game, onClose) {
  const names = D.VITAMINS;
  const render = () => {
    if (!game.team[bagSel]) bagSel = game.chiefIdx;
    const sel = game.team[bagSel];
    const team = game.team.map((m, i) => {
      const fx = m.fx ? D.STATUS[m.fx.k] : null;
      return `<button class="bt t-${m.type} ${i === bagSel ? 'sel' : ''} ${m.exh ? 'ko' : ''}" data-sel="${i}">
        <img src="${portrait(m.id)}" alt=""><div class="bi"><div class="bn"><b>${esc(m.def.name)}</b><span>Niv. ${m.lvl}</span>${i === game.chiefIdx ? '<i class="act">EN JEU</i>' : m.exh ? '<i class="ko">K.O.</i>' : '<i>RÉSERVE</i>'}</div>
        <div class="tchips">${D.typesOf(m.type, m.id).map(t => `<u class="ty-${t}">${D.TYPE_FR[t]}</u>`).join('')}${fx ? `<u style="background:${fx.color};color:#000">⚠ ${fx.name}</u>` : ''}</div>
        <div class="hpb"><div style="width:${100 * m.hp / m.maxhp}%"></div><span>${Math.ceil(m.hp)} / ${m.maxhp}</span></div>
        <small>Dégâts ${m.def.dmg.toFixed(1)} · Vitesse ${Math.round(m.def.speed)} · CT <b style="color:${m.def.ability.color}">${esc(m.def.ability.name)}</b></small></div></button>`;
    }).join('');
    let body = '';
    if (bagTab === 'items') {
      const cards = [];
      const card = (cls, icon, name, qty, desc, btn) => `<div class="ic ${cls}"><div class="ico">${icon}</div><div class="ib"><b>${name}</b>${qty != null ? `<em>×${qty}</em>` : ''}<small>${desc}</small></div>${btn || ''}</div>`;
      cards.push(card('c-candy', iconImg('candy'), 'Super Bonbon', game.bag.candy || 0, '+1 niveau sans dépenser d’essence.', `<button data-use="candy:candy" ${(game.bag.candy > 0 && sel.lvl < D.MAX_LEVEL) ? '' : 'disabled'}>Donner</button>`));
      cards.push(card('c-revive', iconImg('revive'), 'Rappel', game.bag.revive || 0, 'Réveille un Pokémon K.O. avec la moitié de ses PV.', `<button data-use="revive:revive" ${(game.bag.revive > 0 && sel.exh) ? '' : 'disabled'}>Rappeler</button>`));
      for (const k of Object.keys(names)) cards.push(card('c-vit', iconImg(k), names[k].name, game.bag[k] || 0, names[k].desc + `<span class="pips">${'●'.repeat(sel.vit[k])}${'○'.repeat(5 - sel.vit[k])}</span>`, `<button data-use="vit:${k}" ${(game.bag[k] > 0 && sel.vit[k] < 5) ? '' : 'disabled'}>Donner</button>`));
      body = `<div class="iconsum"><div><span>${iconImg('berry')}Baies</span><b>${game.berries} / ${game.maxBerries}</b><small>soigne 40 % et guérit les altérations</small></div>
        <div><span>${iconImg('ether')}Huile</span><b>${game.ethers} / ${game.maxEthers}</b><small>endurance pleine, CT rechargée</small></div>
        <div><span>Essence</span><b>${game.essence}</b><small>à dépenser au feu de camp</small></div></div><div class="igrid">${cards.join('')}</div>`;
    } else {
      const cards = [...game.tms].sort((a, b) => (D.tmCompat(b, sel.type, sel.id, sel.stage).ok - D.tmCompat(a, sel.type, sel.id, sel.stage).ok) || (sel.tm === b) - (sel.tm === a)).map(t => {
        const T = D.TMS[t], c = D.tmCompat(t, sel.type, sel.id, sel.stage), eq = sel.tm === t;
        const types = T.types.includes('all') ? 'Tous les types' : T.types.map(x => D.TYPE_FR[x]).join(' · ');
        return `<div class="tc ${c.ok ? '' : 'no'} ${eq ? 'eq' : ''}" style="--c:${T.color}"><div class="th">${iconImg(t)}<b>${esc(T.name)}</b><u style="background:${T.color}">${T.type}</u></div>
          <small>${esc(T.desc)}</small><small class="tm-m">Coût ${T.cost} · recharge ${T.cd} s${T.minStage ? ' · stade ' + (T.minStage + 1) + '+' : ''}</small><small class="tm-t">${esc(types)}</small>
          <div class="tf">${eq ? '<span class="ok">Équipée</span>' : c.ok ? '<span class="ok">Compatible</span>' : `<span class="bad">${esc(c.why)}</span>`}<button data-use="tm:${t}" ${(c.ok && !eq) ? '' : 'disabled'}>Apprendre</button></div></div>`;
      }).join('');
      body = `<p class="sub">Compatibilité affichée pour <b>${esc(sel.def.name)}</b> (${D.typesOf(sel.type, sel.id).map(t => D.TYPE_FR[t]).join(' / ')}, stade ${sel.stage + 1}).</p><div class="tgrid">${cards || '<p class="sub">Aucune CT.</p>'}</div>`;
    }
    const m = open(`<div class="panel bag"><div class="bhead"><h2>Sac</h2><div class="tabs"><button class="${bagTab === 'items' ? 'on' : ''}" data-tab="items">Objets</button><button class="${bagTab === 'tms' ? 'on' : ''}" data-tab="tms">Capsules techniques (${game.tms.length})</button></div></div>
      <div class="bcols"><div class="bteam"><h4>Équipe — un seul Pokémon en jeu</h4>${team}</div><div class="bbody">${body}</div></div>
      <div class="act"><button id="m-close">Fermer</button></div></div>`);
    m.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { bagSel = +b.dataset.sel; render(); });
    m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { bagTab = b.dataset.tab; render(); });
    m.querySelectorAll('[data-use]').forEach(b => b.onclick = () => {
      const [kind, key] = b.dataset.use.split(':');
      if (kind === 'candy') game.useCandy(bagSel); else if (kind === 'vit') game.useVitamin(bagSel, key); else if (kind === 'revive') game.useRevive(bagSel); else game.teach(bagSel, key);
      render();
    });
    $('#m-close').onclick = onClose;
  };
  bagSel = game.chiefIdx; render();
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
      ${volRow()}<div class="kcols"><div>${rows}</div><div><h4>Manette (disposition standard, fixe)</h4>${PAD_LABELS.map(([a, b]) => `<div class="krow"><span>${a}</span><kbd>${b}</kbd></div>`).join('')}
      <h4>Pour info</h4><div class="krow"><span>Parade</span><kbd>Garde juste avant le coup</kbd></div><div class="krow"><span>Mode développeur</span><kbd>?dev dans l’adresse · F1–F6</kbd></div></div></div>
      <div class="act"><button id="k-reset" class="warn">Valeurs par défaut</button><button id="m-close">Fermer</button></div></div>`);
    bindVol();
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
    ${volRow()}<div class="act col"><button id="p-res" class="pri">Reprendre</button><button id="p-bag">Sac et équipe</button><button id="p-map">Carte et voyage</button><button id="p-keys">Commandes</button><button id="p-credits">Crédits</button><button id="p-title">Retour au menu principal</button><button id="p-reset" class="warn">Effacer la sauvegarde</button></div></div>`);
  const back = () => showPauseMenu(game, h);
  bindVol(); $('#p-credits').onclick = h.credits; $('#p-res').onclick = h.resume; $('#p-bag').onclick = h.bag; $('#p-map').onclick = h.travel; $('#p-keys').onclick = h.keys;
  $('#p-title').onclick = () => showConfirm('Retour au menu principal', 'La progression depuis le dernier feu de camp sera perdue. Ta sauvegarde est conservée : tu pourras la reprendre avec « Continuer ».', 'Quitter vers le menu', h.title, back);
  $('#p-reset').onclick = () => showConfirm('Effacer la sauvegarde', 'Ta partie sera supprimée définitivement et tu recommenceras depuis le choix des starters.', 'Tout effacer', h.reset, back);
}
function showConfirm(title, text, yes, onYes, onNo) {
  open(`<div class="panel confirm"><h2>${esc(title)}</h2><p class="sub">${esc(text)}</p><div class="act"><button id="c-no" class="pri">Annuler</button><button id="c-yes" class="warn">${esc(yes)}</button></div></div>`);
  $('#c-no').onclick = onNo; $('#c-yes').onclick = onYes;
}

// ---------- crédits ----------
export function showCredits(onClose) {
  const m = open(`<div class="panel wide"><h2>Crédits</h2>
    <h4>Musique libre de repli (OpenGameArt.org)</h4><div class="cred">${Object.entries(TRACKS).map(([id, t]) => `<div class="krow"><span><b>${esc(t.title)}</b> — ${esc(t.author)} <small>(${esc(t.use)})</small></span><a href="${t.url}" target="_blank" rel="noopener">${esc(t.license)}</a></div>`).join('')}</div>
    <h4>Sprites</h4><p class="sub">PMDCollab SpriteCollab (CC BY-NC 4.0), merci à tous les artistes du projet.</p>
    <h4>Décors et objets</h4><p class="sub">Icônes d'objets : PokéAPI/sprites (Nintendo / Game Freak). Poké Ball : sprite de Pokémon Rubis/Saphir (Game Freak / Nintendo) via The Spriters Resource. Feu de camp et cristaux/piliers de glace : feuilles pixel art fournies pour le projet (auteurs à préciser).</p>
    <h4>Effets d'attaque</h4><p class="sub">effets pixel art de PMDCollab / Pokémon Mystery Dungeon (projet de fan non commercial) ; Dämmerlicht BFX par KotatsuAkira (gratuit, crédit demandé) ; PIPO Fire par PIPOSCHPATZ (CC BY 4.0) ; Water Cannon par Anton Chi.</p>
    <h4>Mentions</h4><p class="sub">Pokémon est une marque de Nintendo / Creatures Inc. / GAME FREAK inc. Ce fan game non commercial n'est ni affilié ni approuvé par eux. Code et effets sonores : ce dépôt.</p>
    <div class="act"><button id="m-close">Fermer</button></div></div>`);
  $('#m-close').onclick = onClose; void m;
}
