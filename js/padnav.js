// Navigation à la manette dans les écrans DOM : titre, choix des compagnons, feu de camp, sac, voyage, commandes, pause.
// Croix ou stick gauche : déplacer la sélection · bouton du bas (A) : valider · bouton de droite (B) : retour · L / R : changer d'onglet.
import { Input } from './input.js';

const ROOTS = ['#menu.show', '#end.show', '#worlds.show', '#starters.show', '#title.show'];
const BACK = ['#c-no', '#m-close', '#end-close', '#p-res', '#w-back', '#st-back'];
const DIRS = { 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

const visible = el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && !el.closest('[hidden]'); };
const gap = (a0, a1, b0, b1) => Math.max(0, Math.max(a0, b0) - Math.min(a1, b1));
// clé stable d'un élément : survit au redessin complet d'un menu (innerHTML)
const keyOf = el => el.id || Object.entries(el.dataset).map(([k, v]) => k + '=' + v).join('&') || (el.tagName + ':' + (el.textContent || '').trim().slice(0, 24));

export function createPadNav() {
  let cur = null, key = '', cx = 0, cy = 0, rep = 0, held = null;

  const root = () => { for (const s of ROOTS) { const r = document.querySelector(s); if (r) return r; } return null; };
  const list = r => [...r.querySelectorAll('button:not([disabled]), input[type=range]')].filter(visible);
  const center = el => { const q = el.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; };
  const mark = el => {
    if (cur && cur !== el) cur.classList.remove('padfocus');
    cur = el; el.classList.add('padfocus'); key = keyOf(el); [cx, cy] = center(el);
    try { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* ignoré */ }
  };
  const clear = () => { if (cur) cur.classList.remove('padfocus'); cur = null; held = null; };

  // premier élément à sélectionner, ou retour sur l'élément qu'on vient de quitter après un redessin du menu
  function restore(r) {
    const items = list(r); if (!items.length) return null;
    const same = key && items.find(e => keyOf(e) === key);
    if (same) return same;
    if (key) { let best = null, bd = Infinity; for (const e of items) { const [x, y] = center(e), d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = e; } } if (best) return best; }
    return items.find(e => e.classList.contains('pri') || e.classList.contains('on')) || items[0];
  }

  function move(dir, r) {
    if (cur.matches('input[type=range]') && (dir === 'left' || dir === 'right')) {
      cur.value = Math.max(+cur.min, Math.min(+cur.max, +cur.value + (dir === 'right' ? 5 : -5)));
      cur.dispatchEvent(new Event('input', { bubbles: true })); return;
    }
    const a = cur.getBoundingClientRect(), [fx, fy] = center(cur);
    let best = null, bs = Infinity;
    for (const e of list(r)) {
      if (e === cur) continue;
      const q = e.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2;
      const horiz = dir === 'left' || dir === 'right';
      const along = dir === 'right' ? x - fx : dir === 'left' ? fx - x : dir === 'down' ? y - fy : fy - y;
      if (along < 4) continue;
      const across = horiz ? gap(a.top, a.bottom, q.top, q.bottom) + Math.abs(y - fy) * 0.15 : gap(a.left, a.right, q.left, q.right) + Math.abs(x - fx) * 0.15;
      const score = along + across * 3;
      if (score < bs) { bs = score; best = e; }
    }
    if (best) mark(best);
  }

  return {
    update(dt) {
      const r = root();
      document.body.classList.toggle('padnav', !!r && Input.usingPad());
      if (!r) { clear(); return; }
      if (!Input.usingPad()) return;
      if (!cur || !cur.isConnected || !r.contains(cur) || !visible(cur)) {
        const e = restore(r); if (!e) { clear(); return; }
        mark(e); return; // première apparition de la sélection : on ne consomme pas l'appui pour une action
      }
      // direction : croix d'abord, sinon stick gauche ; répétition quand on maintient
      let dir = null;
      for (const [b, d] of Object.entries(DIRS)) if (Input.padHeld(+b)) dir = d;
      if (!dir) { const [x, y] = Input.padStick(); if (Math.max(Math.abs(x), Math.abs(y)) > 0.6) dir = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'); }
      if (dir !== held) { held = dir; rep = 0.38; if (dir) move(dir, r); }
      else if (dir && (rep -= dt) <= 0) { rep = 0.11; move(dir, r); }
      if (Input.padEdge(12) || Input.padEdge(13) || Input.padEdge(14) || Input.padEdge(15)) { for (const a of ['berry', 'revive', 'candy', 'ether', 'bag']) Input.eat(a); } // la croix sert ici à naviguer, pas aux raccourcis de jeu
      if (!cur || !cur.isConnected) return;
      // valider
      if (Input.padEdge(0) && !cur.matches('input')) { cur.click(); return; }
      // onglets (sac) : L / R
      if (Input.padEdge(4) || Input.padEdge(5)) {   // L / R : onglet précédent / suivant (boucle)
        const tabs = [...r.querySelectorAll('.tabs button')];
        if (tabs.length > 1) { const idx = Math.max(0, tabs.findIndex(b => b.classList.contains("on"))), dir = Input.padEdge(5) ? 1 : -1; const t = tabs[(idx + dir + tabs.length) % tabs.length]; key = keyOf(t); [cx, cy] = center(t); t.click(); if (cur) cur.classList.remove('padfocus'); cur = null; return; }
      }
      // retour
      if (Input.padEdge(1)) {
        Input.eat('interact');
        for (const s of BACK) { const b = r.querySelector(s); if (b && !b.disabled && visible(b)) { b.click(); return; } }
        const last = [...r.querySelectorAll('[data-r]')].pop(); // choix des compagnons : retirer le dernier
        if (last) last.click();
      }
    },
  };
}
