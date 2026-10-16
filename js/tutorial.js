// Tutoriel de combat jouable : une zone d'entraînement avec un mannequin, dix étapes validées par l'action du joueur.
// installTutorial() ajoute les méthodes à la classe Game ; createTutorialUi() dessine l'invite à l'écran.
// Le tutoriel se lance au premier démarrage d'une nouvelle partie (état « pending ») et peut être passé.

import { Input } from './input.js';
import { kl } from './hud.js';

// actions affichées en pastilles ; evt : événement du moteur qui fait progresser l'étape
const STEPS = [
  { id: 'move', title: 'Bouger et courir', keys: ['up', 'down', 'left', 'right', 'run'], text: 'Rejoins le mannequin en courant : maintiens la touche de course. Courir consomme de l’endurance.', goal: 'Cours jusqu’au mannequin.' },
  { id: 'hit', title: 'Attaque légère et lourde', keys: ['light', 'heavy'], need: 3, text: 'Frappe le mannequin. La légère est rapide, la lourde est lente et casse la garde. Chaque coup coûte de l’endurance.', goal: 'Touche 3 fois, dont 1 coup lourd.' },
  { id: 'dodge', title: 'Esquiver', keys: ['dodge'], need: 1, aggro: true, text: 'Le mannequin va frapper : un cercle apparaît au sol. Esquive à la dernière seconde, c’est une esquive juste. La jauge de Lien monte.', goal: 'Réussis 1 esquive juste.' },
  { id: 'parry', title: 'Garder et parer', keys: ['guard'], need: 1, aggro: true, text: 'Appuie sur la garde juste avant l’impact : parade. Le mannequin vacille et ton prochain coup part plus fort.', goal: 'Réussis 1 parade.' },
  { id: 'combo', title: 'Combo signature', keys: ['light', 'light', 'heavy'], need: 1, text: 'Attaque légère, légère, lourde en moins d’une demi-seconde : l’attaque signature de ton Pokémon.', goal: 'Lance 1 attaque signature.' },
  { id: 'ct', title: 'Capacité spéciale', keys: ['ability'], need: 1, text: 'La capacité spéciale (CT) consomme de l’endurance et se recharge. Chaque Pokémon a la sienne.', goal: 'Lance 1 capacité spéciale.' },
  { id: 'relay', title: 'Relève et relais', keys: ['next', 's1', 's2', 's3'], need: 1, aggro: true, text: 'Esquive ou pare, puis change de Pokémon dans la seconde qui suit : le nouveau venu frappe tout de suite avec son attaque de relais.', goal: 'Déclenche 1 relais.' },
  { id: 'link', title: 'Le Lien', keys: ['link'], need: 1, text: 'La jauge de Lien monte quand tu touches, esquives et pares. Pleine, elle libère tes deux autres Pokémon pendant 8 s. Elle est pleine pour cet essai.', goal: 'Libère le Lien.' },
  { id: 'berry', title: 'Se soigner', keys: ['berry', 'ether'], need: 1, text: 'La baie soigne 40 % des PV et guérit les altérations. L’huile recharge endurance et CT. Le feu de camp restaure toute l’équipe.', goal: 'Utilise 1 baie.' },
  { id: 'lock', title: 'Verrouiller et types', keys: ['lock'], need: 1, text: 'Verrouille une cible. Les flèches vertes et rouges sur les portraits indiquent l’avantage de type. Deux marques compatibles déclenchent une réaction.', goal: 'Verrouille le mannequin.' },
];

export function installTutorial(Game, { M, D, TS, SFX, hyp }) {
  const P = Game.prototype;

  P.initTutorial = function () { this.tut = null; this.tutState = 'done'; this.tutUi = null; };

  P.startTutorial = function () {
    const c = this.chief(); if (!c || this.tut) return;
    // mannequin : premier emplacement libre autour de l'équipe
    const spots = [[5, 0], [-5, 0], [0, 5], [0, -5], [4, 4], [-4, 4], [4, -4], [-4, -4], [3, 0], [-3, 0]];
    let pos = null;
    for (const [dx, dy] of spots) {
      const x = c.x + dx * TS, y = c.y + dy * TS;
      if (M.boxFree(this.world, x, y, 8, 8) && M.lineClear(this.world, c.x, c.y, x, y)) { pos = { x, y }; break; }
    }
    if (!pos) pos = { x: c.x + 3 * TS, y: c.y };
    const d = this.makeEnemy('dummy', pos.x, pos.y); d.tutDummy = true; d.name = 'Mannequin'; d.state = 'idle'; d.face = { x: -1, y: 0 };
    this.enemies = [d]; this.respawnQ = []; this.projs = []; this.rings = []; this.zones = []; this.lock = null;
    this.tut = { i: -1, count: 0, heavy: false, run: 0, aggro: false, wait: 0, dummy: d, done: false };
    this.berries = Math.max(this.berries, 3);
    this.nextTutStep();
  };

  P.nextTutStep = function () {
    const T = this.tut; if (!T) return;
    T.i++; T.count = 0; T.heavy = false; T.run = 0; T.wait = 0; T.fin = false;
    if (T.i >= STEPS.length) { this.finishTutorial(false); return; }
    const s = STEPS[T.i]; T.aggro = !!s.aggro;
    const d = T.dummy; if (d) { d.hp = d.maxhp; d.state = 'idle'; d.tele = false; d.cd = 1.2; }
    const c = this.chief();
    if (s.id === 'link') this.link = 100;
    if (s.id === 'berry') { c.hp = Math.min(c.hp, c.maxhp * 0.5); c.fx = null; }
    this.renderTut();
  };

  P.tutProgress = function () {
    const T = this.tut, s = STEPS[T.i];
    if (s.id === 'move') return null;
    if (s.id === 'hit') return Math.min(T.count, 3) + ' / 3' + (T.heavy ? '' : ' · coup lourd à faire');
    return null;
  };

  P.renderTut = function () {
    if (!this.tutUi) return;
    const T = this.tut; if (!T) { this.tutUi.hide(); return; }
    if (T.done) { this.tutUi.render({ done: true }); return; }
    const s = STEPS[T.i];
    this.tutUi.render({ n: T.i + 1, total: STEPS.length, title: s.title, text: s.text, goal: s.goal, keys: s.keys, progress: this.tutProgress(), ok: T.fin });
  };

  P.tutEvent = function (name, data) {
    const T = this.tut; if (!T || T.done || T.fin) return;
    const s = STEPS[T.i]; if (!s) return;
    let ok = false;
    if (s.id === 'hit' && name === 'hit') { T.count++; if (data && data.heavy) T.heavy = true; ok = T.count >= 3 && T.heavy; if (!ok) this.renderTut(); }
    else if (s.id === 'dodge' && name === 'dodge') ok = true;
    else if (s.id === 'parry' && name === 'parry') ok = true;
    else if (s.id === 'combo' && name === 'sig') ok = true;
    else if (s.id === 'ct' && name === 'ct') ok = true;
    else if (s.id === 'relay' && name === 'relay') ok = true;
    else if (s.id === 'link' && name === 'link') ok = true;
    else if (s.id === 'berry' && name === 'berry') ok = true;
    else if (s.id === 'lock' && (name === 'lock' || name === 'react')) ok = true;
    if (ok) { T.fin = true; T.wait = 1.1; SFX.pick(); this.renderTut(); }
  };

  P.updateTutorial = function (dt) {
    const T = this.tut; if (!T || T.done) return;
    const c = this.chief(), d = T.dummy, s = STEPS[T.i];
    // le mannequin ne meurt pas ; l'équipe ne tombe pas pendant l'entraînement
    if (d) { if (d.dead) { d.dead = false; d.deadT = 0; } d.hp = Math.max(d.hp, d.maxhp * 0.5); if (!this.enemies.includes(d)) this.enemies.push(d); }
    for (const m of this.team) { if (s && s.id !== 'berry') m.hp = Math.max(m.hp, m.maxhp * 0.45); m.cd = 0; }
    if (this.stam < this.maxStam * 0.6) this.stam = this.maxStam * 0.6;
    if (T.fin) { T.wait -= dt; if (T.wait <= 0) this.nextTutStep(); return; }
    if (s && s.id === 'move') {
      const [ax, ay] = Input.axis();
      if ((ax || ay) && Input.down('run')) T.run += dt;
      if (T.run > 0.5 && d && hyp(d.x - c.x, d.y - c.y) < 60) { T.fin = true; T.wait = 1.0; SFX.pick(); this.renderTut(); }
    }
  };

  P.finishTutorial = function (skipped) {
    const T = this.tut; if (!T) return;
    this.tutState = 'done'; T.done = true;
    for (const m of this.team) { m.exh = false; m.hp = m.maxhp; m.cd = 0; m.fx = null; }
    this.stam = this.maxStam; this.berries = Math.max(this.berries, this.maxBerries); this.link = 0; this.endLink(true);
    this.spawnAll(); this.projs = []; this.lock = null;
    this.emit('banner', skipped ? 'TUTORIEL PASSÉ' : 'ENTRAÎNEMENT TERMINÉ', 'mini');
    if (this.tutUi) { this.tutUi.render({ done: true, skipped }); }
    setTimeout(() => { if (this.tutUi) this.tutUi.hide(); }, 3200);
    this.tut = null; this.save();
  };
  P.skipTutorial = function () { if (this.tut && !this.tut.done) this.finishTutorial(true); };
}

// ---------- invite à l'écran ----------
const LABEL = { up: 'Haut', down: 'Bas', left: 'Gauche', right: 'Droite', run: 'Courir', dodge: 'Esquive', light: 'Légère', heavy: 'Lourde', guard: 'Garde', ability: 'CT', next: 'Relève', s1: '1', s2: '2', s3: '3', link: 'Lien', berry: 'Baie', ether: 'Huile', lock: 'Verrou' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createTutorialUi(root, game) {
  const el = document.createElement('div'); el.id = 'tut'; el.hidden = true; root.appendChild(el);
  const touch = () => document.body.classList.contains('touch');
  const chips = keys => {
    const seen = new Set();
    return keys.filter(k => { const t = touch() ? LABEL[k] : kl(k); const key = k === 'up' || k === 'down' || k === 'left' || k === 'right' ? 'move' : k + t; if (seen.has(key)) return false; seen.add(key); return true; })
      .map(k => touch() ? `<span class="tk">${esc(LABEL[k])}</span>` : `<span class="tk"><kbd>${esc(kl(k))}</kbd>${esc(LABEL[k])}</span>`).join('');
  };
  const api = {
    hide() { el.hidden = true; },
    render(s) {
      el.hidden = false;
      if (s.done) { el.className = 'done'; el.innerHTML = `<div class="tt-h"><b>${s.skipped ? 'Tutoriel passé' : 'Entraînement terminé'}</b></div><p>${s.skipped ? 'Les commandes restent dans le menu pause.' : 'Tu connais les bases. Explore, et allume des feux pour te reposer.'}</p>`; return; }
      el.className = s.ok ? 'ok' : '';
      const dots = Array.from({ length: s.total }, (_, i) => `<i class="${i < s.n - 1 ? 'd' : i === s.n - 1 ? 'c' : ''}"></i>`).join('');
      el.innerHTML = `<div class="tt-h"><span>Étape ${s.n} sur ${s.total}</span><b>${esc(s.title)}</b><button id="tut-skip" type="button">Passer</button></div>
        <p>${esc(s.text)}</p><div class="tt-k">${chips(s.keys)}</div>
        <div class="tt-g">${s.ok ? '<b>Bien joué</b>' : esc(s.goal)}${s.progress ? ` <em>${esc(s.progress)}</em>` : ''}</div><div class="tt-d">${dots}</div>`;
      const b = el.querySelector('#tut-skip'); if (b) b.onclick = () => game.skipTutorial();
    },
  };
  return api;
}
