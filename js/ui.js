// Écrans et menus : choix des starters, feu de camp, sac et équipe, voyage, commandes, pause.
import { A } from './assets.js';
import { iconImg } from './items.js';
import * as D from './data.js';
import * as M from './maps.js';
import { ACTIONS, padLabels, padKindName, padFace, Controls, keyLabel } from './input.js';
import { portrait } from './hud.js';
import { relayInfo } from './relay.js';
import { POOL, GABS, poolEntry, archOf } from './pool.js';
import { Music, TRACKS } from './music.js';
import { SFX } from './audio.js';
import { MODULES, MOD_ORDER, FALA_KEY } from './fala.js';
import { EXTRA_BY_MAP } from './reserve.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const menu = () => $('#menu');
export function hideMenu() { const m = menu(); m.classList.remove('show', 'dock'); m.innerHTML = ''; }
function open(html) { const m = menu(); m.classList.add('show'); m.classList.remove('dock'); m.innerHTML = html; return m; }

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
        return `<div class="row"><img src="${portrait(t.id)}" alt=""><div><b>${esc(t.def.name)}</b> <span>${t.def.typeName} · ${t.def.cls}</span><small>Niv. ${t.lvl}${t.lvl < D.MAX_LEVEL ? ` · PV ${t.maxhp}` : ' · max'}${nxtStage}</small>${t.key === FALA_KEY ? `<small class="pmods">Module : ${MOD_ORDER.map(id => `<button class="pmod ${t.mod === id ? 'on' : ''}" style="--m:${MODULES[id].color}" data-mod="${i}:${id}">${MODULES[id].name}</button>`).join('')}</small>` : ''}</div><button data-up="${i}" ${ok ? '' : 'disabled'}>Monter · ${c}</button></div>`; }).join('')}</div>
      <div class="act"><button id="m-bag">Équipe</button>${game.bench.length ? '<button id="m-reserve">Réserve</button>' : ''}<button id="m-travel">Voyager</button><button id="m-rest">Se reposer</button><button id="m-close">Repartir</button></div></div>`);
    m.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { game.levelUp(+b.dataset.up); render(); });
    m.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => { const [k, id] = b.dataset.mod.split(':'); game.setModule(+k, id); render(); });
    $('#m-rest').onclick = () => { game.rest(); game.last = { map: game.mapIdx, id: bonfire.id }; game.save(); game.emit('toast', 'L’équipe se repose'); onClose(); };
    $('#m-close').onclick = onClose;
    $('#m-bag').onclick = () => extra.bag(() => render());
    const rb = $('#m-reserve'); if (rb) rb.onclick = () => extra.reserve();
    $('#m-travel').onclick = () => extra.travel();
  };
  render();
}

// ---------- sac et équipe ----------
let bagSel = 0, bagTab = 'items', questSel = null;
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
    } else if (bagTab === 'quest') {
      const qs = game.questLog();
      body = qs.length ? `<div class="qlist">${qs.map(q => `<button class="qc ${q.status} ${questSel === q.id ? 'open' : ''}" data-q="${q.id}"><div class="qh"><b>${esc(q.title)}</b><span>${q.status === 'done' ? 'Terminée' : q.progress}</span></div><small>${esc(q.zone)} · ${esc(q.summary)}</small>${questSel === q.id ? `<div class="qd">${q.steps.map(s => `<div class="qs ${s.state}"><i style="background:${s.color}"></i><div><b>${esc(s.name)}</b><small>${esc(s.state === 'given' ? 'Rapporté à Fala' : s.state === 'carried' ? 'Récupéré · à rapporter à Fala' : s.hint)}</small></div></div>`).join('')}<small class="qr">Récompense : ${esc(q.reward)}</small></div>` : '<em class="qm">Détails ▾</em>'}</button>`).join('')}</div>` : '<p class="sub">Aucune quête pour le moment. Certains habitants de ces lieux ont peut-être besoin d’aide...</p>';
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
    const m = open(`<div class="panel bag"><div class="bhead"><h2>Équipe</h2><div class="tabs"><button class="${bagTab === 'items' ? 'on' : ''}" data-tab="items">Objets</button><button class="${bagTab === 'tms' ? 'on' : ''}" data-tab="tms">Capsules techniques (${game.tms.length})</button><button class="${bagTab === 'quest' ? 'on' : ''}" data-tab="quest">Quêtes${game.questLog().some(q => q.status === 'active') ? ' •' : ''}</button></div></div>
      <div class="bcols"><div class="bteam"><h4>Équipe — un seul Pokémon en jeu</h4>${team}</div><div class="bbody">${body}</div></div>
      <div class="act"><button id="m-close">Fermer</button></div></div>`);
    m.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { bagSel = +b.dataset.sel; render(); });
    m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { bagTab = b.dataset.tab; render(); });
    m.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { questSel = questSel === b.dataset.q ? null : b.dataset.q; render(); });
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
// Carte du monde : îles reliées par une route, liste des chapitres à gauche, fiche de la carte choisie à droite.
const ROMAN = ['I', 'II', 'III', 'IV', '✦'];
const NODES = [[13, 64], [32, 40], [52, 62], [72, 38], [88, 16]];   // position des cartes (en % de la zone de carte, ratio 100:70)
let travelSel = -1, travelSpot = 'start';
export function showTravel(game, onClose, onGo) {
  const opts = game.travelOptions();
  if (travelSel < 0 || travelSel >= opts.length) { travelSel = game.mapIdx; travelSpot = 'start'; }
  const render = () => {
    const o = opts[travelSel], d = M.MAPS[o.idx], bs = D.BOSSES[d.boss], col = bs.color;
    if (!o.spots.some(x => x.id === travelSpot)) travelSpot = 'start';
    const here = o.idx === game.mapIdx;
    const hid = k => M.MAPS[k].secret && !opts[k].open;   // la carte secrète reste cachée tant qu'elle n'est pas ouverte
    const roads = NODES.slice(1).map((n, k) => hid(k + 1) ? '' : `<line x1="${NODES[k][0]}" y1="${NODES[k][1] * 0.7}" x2="${n[0]}" y2="${n[1] * 0.7}" class="${opts[k + 1].open ? 'road' : 'road locked'}"/>`).join('');
    const nodes = opts.map((x, k) => { if (hid(k)) return `<span class="wghost" style="left:${NODES[k][0]}%;top:${NODES[k][1]}%">?</span>`; const c = D.BOSSES[M.MAPS[k].boss].color; return `<button class="wn ${k === travelSel ? 'on' : ''} ${x.open ? '' : 'locked'} ${k === game.mapIdx ? 'here' : ''}" style="left:${NODES[k][0]}%;top:${NODES[k][1]}%;--c:${c}" data-n="${k}" title="${esc(x.name)}"><b>${ROMAN[k]}</b>${x.done ? '<i>✔</i>' : ''}</button><span class="wl" style="left:${NODES[k][0]}%;top:${NODES[k][1]}%">${esc(x.name)}</span>`; }).join('');
    const list = opts.map((x, k) => hid(k) ? `<div class="wr locked ghost"><span class="rn">?</span><b>???</b><em></em></div>` : `<div class="wr ${k === travelSel ? 'on' : ''} ${x.open ? '' : 'locked'}" data-n="${k}"><span class="rn" style="--c:${D.BOSSES[M.MAPS[k].boss].color}">${ROMAN[k]}</span><b>${esc(x.name)}</b><em>${!x.open ? 'Scellée' : x.done ? '✔' : k === game.mapIdx ? '◆' : ''}</em></div>`).join('');
    const prev = opts[o.idx - 1];
    const body = o.open
      ? `<div class="wsp"><h4>Destination</h4>${o.spots.map(x => `<button class="wspot ${x.id === travelSpot ? 'on' : ''}" data-spot="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>`
      : `<p class="sub">Cette carte est scellée. Elle s’ouvre quand le boss de <b>${esc(prev ? prev.name : '')}</b> tombe.</p>`;
    const m = open(`<div class="panel worldmap"><div class="bhead"><h2>Carte du chapitre · Génération 1</h2></div>
      <div class="wm-cols">
        <div class="wm-list"><h4>Chapitres</h4>${list}</div>
        <div class="wm-map"><svg viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
          <path class="isle" d="M4 52 C2 36 12 24 24 22 C32 12 48 14 56 22 C66 16 80 24 84 36 C94 40 96 54 86 62 C74 68 60 66 50 68 C36 70 20 68 12 64 C7 61 5 57 4 52Z"/>
          <path class="isle small" d="M80 8 C84 4 94 5 96 11 C98 18 92 24 86 24 C80 23 76 14 80 8Z"/>
          <g>${roads}</g></svg>${nodes}</div>
        <div class="wm-det" style="--c:${col}">
          <div class="wd-art ${o.open ? '' : 'sealed'}"><img src="assets/sprites/${bs.sprite}/portrait.png" alt="" onerror="this.style.display='none'"></div>
          <h3>${ROMAN[o.idx]} · ${esc(o.name)}</h3><p class="sub">${esc(o.sub)}${here ? ' · vous êtes ici' : ''}</p>
          <dl><dt>Boss</dt><dd>${o.open ? esc(bs.name) : '???'}</dd><dt>Niveau conseillé</dt><dd>${d.lv}</dd><dt>Feux allumés</dt><dd>${o.open ? o.spots.length - 1 : 0}</dd><dt>État</dt><dd>${!o.open ? 'Scellée' : o.done ? 'Boss vaincu ✔' : 'Boss en vie'}</dd></dl>
          ${body}
          <button class="pri wgo" id="t-go" ${o.open ? '' : 'disabled'}>Voyager</button></div>
      </div>
      <div class="act"><button id="m-close">Retour</button></div></div>`);
    m.querySelectorAll('[data-n]').forEach(x => x.onclick = () => { travelSel = +x.dataset.n; travelSpot = 'start'; render(); });
    m.querySelectorAll('[data-spot]').forEach(x => x.onclick = () => { travelSpot = x.dataset.spot; render(); });
    const go = $('#t-go'); if (go) go.onclick = () => onGo(o.idx, travelSpot);
    $('#m-close').onclick = () => { travelSel = -1; onClose(); };
  };
  render();
}

// Schéma de la manette (style Switch Pro) avec l'action de chaque bouton ; les noms des boutons suivent le type détecté.
function padDiagram() {
  const { f, s } = padFace();
  // Proportions d'une Pro Controller vue de face (repère d'origine 975 × 975, dessin vectoriel original), placée dans le schéma.
  const K = 0.4, OX = 305, OY = -46, X = x => Math.round(OX + K * x), Y = y => Math.round(OY + K * y);
  const tx = (x, y, a, name, act) => `<text x="${x}" y="${y}" text-anchor="${a}" class="pd-n">${name}</text>${act ? `<text x="${x}" y="${y + 13}" text-anchor="${a}" class="pd-a">${act}</text>` : ''}`;
  const ln = (x1, y1, x2, y2) => `<polyline points="${X(x1)},${Y(y1)} ${x2},${y2}" class="pd-l"/>`;
  const rc = (x, y, w, h, r, c) => `<rect class="pd-b ${c}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const ci = (x, y, r, c) => `<circle class="pd-b ${c}" cx="${x}" cy="${y}" r="${r}"/>`;
  const L = 300, R = 705;   // colonnes de texte (fin du texte à gauche, début à droite)
  return `<svg class="pad" viewBox="0 0 1000 312" role="img" aria-label="Schéma de la manette"><g transform="translate(${OX} ${OY}) scale(${K})">
    ${rc(150, 150, 190, 40, 20, 't-eq')}${rc(150, 194, 205, 28, 14, 't-fi')}${rc(640, 150, 190, 40, 20, 't-fi')}${rc(625, 194, 205, 28, 14, 't-it')}
    <path class="pd-body" d="M150 250Q160 215 230 212L745 212Q815 215 825 250L905 560Q940 700 880 780Q830 830 770 770Q720 700 690 640Q660 600 600 600L375 600Q315 600 285 640Q255 700 205 770Q145 830 95 780Q35 700 70 560Z"/>
    ${ci(255, 355, 82, 'pd-ring')}${ci(255, 355, 50, 't-mv')}${ci(255, 355, 30, 'in')}
    <path class="pd-b t-mn" d="M334 430h52v34h34v52h-34v34h-52v-34h-34v-52h34z" transform="translate(-4 -6)"/>
    ${ci(595, 490, 74, 'pd-ring')}${ci(595, 490, 48, 't-lk')}${ci(595, 490, 28, 'in')}
    ${ci(715, 303, 34, 't-fi')}${ci(643, 364, 34, 't-mv')}${ci(786, 363, 34, 't-mn')}${ci(715, 425, 34, 't-eq')}
    ${ci(380, 297, 21, 't-mn')}${ci(595, 297, 21, 't-mn')}${rc(415, 345, 36, 36, 6, '')}${ci(540, 363, 20, '')}${rc(468, 540, 36, 30, 6, '')}
    <g class="pd-f"><text x="715" y="313">${f[3]}</text><text x="643" y="374">${f[2]}</text><text x="786" y="373">${f[1]}</text><text x="715" y="435">${f[0]}</text><text x="380" y="306">−</text><text x="595" y="306">+</text></g>
  </g>
    ${ln(150, 170, L + 6, 34)}${tx(L, 30, 'end', f[6] + ' · Relève', 'Pokémon suivant')}
    ${ln(150, 208, L + 6, 80)}${tx(L, 76, 'end', f[4] + ' · Capacité', 'Attaque spéciale')}
    ${ln(360, 297, L + 6, 124)}${tx(L, 120, 'end', s[0] + ' · Carte', 'Téléportation')}
    ${ln(175, 340, L + 6, 168)}${tx(L, 164, 'end', 'Stick gauche', 'Déplacement · clic : Lien')}
    ${ln(300, 490, L + 6, 226)}${tx(L, 222, 'end', 'Croix haut', 'Sac (menu)')}
    ${ln(830, 170, R - 6, 34)}${tx(R, 30, 'start', f[7] + ' · Garde', 'Maintenir · parade juste')}
    ${ln(830, 208, R - 6, 80)}${tx(R, 76, 'start', f[5] + ' · Objets', 'Maintenir + stick droit')}
    ${ln(616, 297, R - 6, 124)}${tx(R, 120, 'start', s[1] + ' · Pause', '')}
    ${ln(822, 363, R - 6, 170)}<text x="${R}" y="166" class="pd-n">Boutons de face</text>
    <text x="${R}" y="182" class="pd-a">${f[3]} Attaque lourde</text><text x="${R}" y="196" class="pd-a">${f[2]} Attaque légère</text><text x="${R}" y="210" class="pd-a">${f[1]} Interagir</text><text x="${R}" y="224" class="pd-a">${f[0]} Esquive · maintenu : course</text>
    ${ln(660, 520, R - 6, 266)}${tx(R, 262, 'start', 'Stick droit', 'Clic : verrouiller · ← / → : cible')}
    <text x="500" y="306" text-anchor="middle" class="pd-a">Roue d’objets : maintenir ${f[5]}, pousser le stick droit (↑ baie · ← bonbon · → Éther · ↓ Rappel), relâcher ${f[5]}.</text>
  </svg>`;
}

// ---------- commandes (lecture et modification) ----------
export function showControls(onClose) {
  let waiting = null;
  const render = () => {
    const rows = ACTIONS.map(([grp, list]) => `<h4>${grp}</h4>` + list.map(([a, label]) => `<div class="krow"><span>${label}</span>${[0, 1, 2].map(s => {
      const on = waiting && waiting[0] === a && waiting[1] === s;
      return `<button class="keybtn ${on ? 'wait' : ''}" data-a="${a}" data-s="${s}">${on ? 'Appuyez…' : keyLabel(Controls.get(a)[s])}</button>`; }).join('')}</div>`).join('')).join('');
    const m = open(`<div class="panel wide kp"><h2>Commandes</h2><p class="sub">Cliquez sur une case puis appuyez sur la touche (ou un bouton de souris) voulue. Échap annule, Retour arrière efface la case. Une touche ne peut servir qu’à une action : elle est retirée de l’ancienne. Les réglages sont enregistrés dans ce navigateur.</p>
      ${volRow()}<h4 class="padh">Manette${padKindName() ? ' détectée : ' + padKindName() : ' (disposition Nintendo Switch)'}</h4>${padDiagram()}<div class="kcols"><div>${rows}</div><div><h4>Manette</h4><div class="krow"><span>Menus : naviguer</span><kbd>Croix ou stick gauche</kbd></div><div class="krow"><span>Valider / retour · onglets</span><kbd>${padFace().f[0]} / ${padFace().f[1]} · ${padFace().f[4]} / ${padFace().f[5]}</kbd></div>
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
    ${volRow()}<div class="act col"><button id="p-res" class="pri">Reprendre</button><button id="p-bag">Équipe</button><button id="p-map">Carte et voyage</button><button id="p-keys">Commandes</button><button id="p-credits">Crédits</button><button id="p-title">Retour au menu principal</button><button id="p-reset" class="warn">Effacer la sauvegarde</button></div></div>`);
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

// ---------- dialogues (quête de Fala) ----------
// Carte posée en bas de l'écran (on continue de voir le jeu), portrait de Fala, texte lettre par lettre avec bip à l'ancienne.
// lines : [{ who, text, choices?: [{ label, key, then: [lignes], again? }], module?, system? }] ; done(clé du dernier choix) à la fin.
export function showDialogue(lines, done) {
  const q = lines.slice(); let result = null, cur = null, timer = null, shown = 0;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const next = () => { stop(); if (!q.length) { done(result); return; } cur = q.shift(); draw(); };
  const draw = () => {
    const mod = cur.module ? MODULES[cur.module] : null, hidden = cur.who === '???';
    const m = open(`<div class="panel dlg ${cur.system ? 'sys' : ''}">${cur.system ? '' : `<div class="dpic ${hidden ? 'hid' : ''}"><img src="${portrait(FALA_KEY)}" alt=""></div>`}
      <div class="dbody"><div class="dwho"><b>${esc(cur.who)}</b>${mod ? `<u style="background:${mod.color}">Module ${mod.name}</u>` : ''}</div>
      <p id="d-text"></p><div class="act"><button id="d-next" ${cur.choices ? 'hidden' : ''}>Suite</button></div></div></div>`);
    m.classList.add('dock');
    const el = $('#d-text'), full = cur.text, pitch = cur.who === 'Fala' ? 0.8 : 1;
    const showChoices = () => {
      if (!cur.choices) return;
      const act = m.querySelector('.act'); act.innerHTML = cur.choices.map((c, k) => `<button data-c="${k}">${esc(c.label)}</button>`).join('');
      act.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
        const c = cur.choices[+b.dataset.c]; result = c.key;
        const again = c.again ? [{ ...cur, choices: cur.choices.filter(x => x !== c) }] : [];
        q.unshift(...c.then, ...again); next();
      });
      const f = act.querySelector('button'); if (f) f.focus();
    };
    shown = 0; el.textContent = '';
    const nb = $('#d-next'); if (nb) nb.focus();
    const finish = () => { stop(); shown = full.length; el.textContent = full; showChoices(); };
    timer = setInterval(() => {
      if (!el.isConnected) { stop(); return; }   // menu fermé (Échap) : on arrête la machine à écrire
      shown++; el.textContent = full.slice(0, shown);
      const ch = full[shown - 1]; if (ch && /[^\s.,…!?—-]/.test(ch) && shown % 2 === 1 && !cur.system) SFX.blip(pitch);
      if (shown >= full.length) finish();
    }, 28);
    if (nb) nb.onclick = () => { if (shown < full.length) finish(); else next(); };
    m.onclick = e => { if (e.target === m && shown < full.length) finish(); };
  };
  next();
}

// ---------- réserve du feu : échanger un équipier contre un Pokémon bonus recruté en partie ----------
let resSel = 0, outSel = 2;
export function showReserve(game, onBack) {
  let ask = false;
  const render = () => {
    if (!game.bench[resSel]) resSel = 0;
    if (outSel >= game.team.length) outSel = game.team.length - 1;
    const b = game.bench[resSel], o = game.team[outSel];
    const thumb = m => `<img src="${portrait(m.id)}" alt="">`;
    const chips = m => D.typesOf(m.type, m.id).map(ty => `<u class="ty-${ty}">${D.TYPE_FR[ty] || ty}</u>`).join('');
    const maps = M.MAPS.map((d, k) => ({ d, k, key: EXTRA_BY_MAP[k] }));
    const found = maps.filter(x => x.key && game.hasMember(x.key)).length;
    const locked = maps.filter(x => !(x.key && game.hasMember(x.key))).map(x => `<div class="rlock"><b>???</b><small>${x.d.secret && x.k > game.unlocked ? '???' : esc(x.d.name)}</small></div>`).join('');
    let det = '<p class="sub">La réserve est vide.</p>';
    if (b) {
      const ri = relayInfo(b.line);
      det = `<div class="rdet"><div class="rdh"><b>${esc(b.def.name)}</b><span>Niv. ${b.lvl} · ${b.def.cls}</span>${chips(b)}</div>
        <small><b>Relais · ${esc(ri.name)}</b> : ${esc(ri.text)}${b.key === FALA_KEY ? ' · l’élément dépend du Module équipé' : ''}</small>
        ${b.key === FALA_KEY ? `<div class="pmods"><span>Module</span>${MOD_ORDER.map(id => `<button class="pmod ${b.mod === id ? 'on' : ''}" style="--m:${MODULES[id].color}" data-rmod="${id}" ${ask ? 'disabled' : ''}>${MODULES[id].name}</button>`).join('')}</div>` : ''}
        <div class="rsw"><span>Clique de nouveau sur ${esc(b.def.name)} pour l’échanger avec <b>${esc(o.def.name)}</b> · gratuit · choisis qui sort dans la liste de gauche</span></div></div>`;
    }
    const m = open(`<div class="panel reserve"><div class="bhead"><h2>Réserve du feu</h2></div>
      <div class="rcols"><div class="rteam"><h4>Équipe active · ${game.team.length} / 3</h4>${game.team.map((x, i) => `<button class="rrow ${i === outSel ? 'out' : ''}" ${ask ? 'disabled' : ''} data-out="${i}">${thumb(x)}<div><b>${esc(x.def.name)}</b><small>Niv. ${x.lvl} · ${x.def.cls} · ${x.def.typeName}</small></div>${i === outSel ? '<i>SORT</i>' : ''}</button>`).join('')}
        <p class="sub">Celui qui sort garde son niveau, ses vitamines et sa CT. Il attend à la réserve du feu.</p></div>
        <div class="rres"><h4>Réserve · ${found} / ${maps.length} bonus trouvés</h4>
          <div class="rgrid">${game.bench.map((x, i) => `<button class="rcard ${i === resSel ? 'sel' : ''}" ${ask ? 'disabled' : ''} data-bi="${i}">${thumb(x)}<div><b>${esc(x.def.name)}</b><small>Niv. ${x.lvl} · ${x.def.cls}</small></div></button>`).join('')}${locked}</div>${det}</div></div>
      <div class="act"><button id="r-back" ${ask ? 'disabled' : ''}>Retour</button></div>
      ${ask ? `<div class="rconf"><div class="rcbox"><p>Échanger <b>${esc(b.def.name)}</b> avec <b>${esc(o.def.name)}</b> ?</p><small>${esc(o.def.name)} attendra à la réserve du feu. Gratuit.</small><div class="act"><button id="c-no">Annuler</button><button class="pri" id="r-swap">Échanger</button></div></div></div>` : ''}</div>`);
    m.querySelectorAll('[data-out]').forEach(x => x.onclick = () => { outSel = +x.dataset.out; render(); });
    m.querySelectorAll('[data-bi]').forEach(x => x.onclick = () => {
      const i = +x.dataset.bi;
      if (i !== resSel) { resSel = i; render(); return; }
      ask = true; render();
    });
    const no = $('#c-no'); if (no) no.onclick = () => { ask = false; render(); };
    const sw = $('#r-swap'); if (sw) sw.onclick = async () => { sw.disabled = true; const nm = b.def.name; ask = false; if (await game.swapMember(outSel, resSel)) game.emit('toast', `${nm} rejoint l’équipe`); render(); };
    m.querySelectorAll('[data-rmod]').forEach(x => x.onclick = () => { game.setModuleOf(game.bench[resSel], x.dataset.rmod); render(); });
    $('#r-back').onclick = onBack;
  };
  render();
}
