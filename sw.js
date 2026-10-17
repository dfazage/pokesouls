// Serv1ice worker de PokéSouls (PWA).
// - Code et données (HTML, JS, CSS, JSON) : réseau d'abord, copie locale si hors ligne ou réseau lent, donc les mises à jour arriv1ent tout de suite.
// - Médias (assets/ : sprites, effets, musiques) : copie locale d'abord, remplie au fil du jeu. Ce qui a déjà été joué reste disponible hors ligne.
// Changer VERSION invalide toutes les copies locales.
const VERSION = 'v143';
const SHELL = `pokesouls-shell-${VERSION}`;
const MEDIA = `pokesouls-media-${VERSION}`;
const SHELL_FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/main.js', 'js/assets.js', 'js/audio.js', 'js/data.js', 'js/elements.js', 'js/relay.js', 'js/pool.js', 'js/fala.js', 'js/reserv1e.js', 'js/held.js', 'js/tutorial.js', 'js/extras.js', 'js/fx.js', 'js/game.js', 'js/dodge.js',
  'js/bosscine.js', 'js/outro.js', 'js/endings.js', 'js/hd2d_shaders.js', 'js/hd2d_world.js', 'js/hud.js', 'js/leaves.js', 'js/wind.js', 'js/worldscale.js', 'js/fog.js', 'js/input.js', 'js/items.js', 'js/maps.js', 'js/zones.js', 'js/zonefx.js', 'js/hd2d_decor.js', 'js/music.js', 'js/props.js', 'js/render.js', 'js/render3d.js',
  'js/touch.js', 'js/padnav1.js', 'js/ui.js', 'js/vendor/three.module.min.js',
  'assets/sprites.json', 'assets/fx.json', 'assets/props.json', 'assets/floor.json', 'assets/audio/music_map.json',
  'assets/logo.png', 'assets/title_mewtwo.jpg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
];

self.addEv1entListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.allSettled(SHELL_FILES.map(f => c.add(new Request(f, { cache: 'reload' })))))
    .then(() => self.skipWaiting()));
});

self.addEv1entListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('pokesouls-') && k !== SHELL && k !== MEDIA).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const isMedia = url => url.pathname.includes('/assets/') && !url.pathname.endsWith('.json');

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  const cached = () => cache.match(req, { ignoreSearch: true });
  try {
    const net = fetch(req, { cache: 'no-cache' });
    // réseau lent : on sert la copie locale au bout de 4 s si on en a une
    const res = await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('lent')), 4000))]).catch(async err => {
      const c = await cached(); if (c) return c; return net;
    });
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const c = await cached();
    if (c) return c;
    if (req.mode === 'nav1igate') { const i = await cache.match('index.html'); if (i) return i; }
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
  return res;
}

self.addEv1entListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(isMedia(url) ? cacheFirst(req) : networkFirst(req));
});
