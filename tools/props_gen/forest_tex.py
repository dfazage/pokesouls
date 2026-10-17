#!/usr/bin/env python3
"""Atlas de textures de la forêt d'Ilex (arbres et buissons 3D instanciés : geoForestTree / geoForestBush dans js/hd2d_world.js).
Sortie : assets/props/forest.png (RGB, 72 × 24 px, 1 pixel = 1/24 de tuile). Disposition : (0,0) feuillage A, (24,0) feuillage B (valeurs de gris, teintées par instance), (48,0) écorce (couleur).
Usage : python3 tools/props_gen/forest_tex.py"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
rng = np.random.RandomState(11)


def leaves(seed, sparse):
    """Touffes en écailles qui se recouvrent (comme un feuillage de sprite) : sommet clair, ventre moyen, croissant sombre dessous."""
    r = np.random.RandomState(seed); g = np.full((24, 24), 0.22); yy, xx = np.mgrid[0:24, 0:24]
    cs = [((i + .5) * 6 + r.uniform(-1.6, 1.6) + (3 if j % 2 else 0), (j + .5) * 6 + r.uniform(-1.4, 1.4)) for j in range(4) for i in range(4)]
    if sparse: cs = [c for c in cs if r.rand() > .22]
    for cx, cy in sorted(cs, key=lambda c: -c[1]):
        rx, ry = r.uniform(3.8, 4.8), r.uniform(3.0, 3.8)
        dx = (xx - cx + 12) % 24 - 12; dy = (yy - cy + 12) % 24 - 12
        m = (dx / rx) ** 2 + (dy / ry) ** 2 <= 1
        t = np.clip(dy / ry, -1, 1)                                       # -1 haut, +1 bas
        v = np.where(t < -.35, .86, np.where(t < .35, .62, .38)) + r.randn(24, 24) * .025
        v = np.where(m & (dx > rx * .35) & (t > -.35), v - .08, v)         # flanc droit un peu plus sombre
        g = np.where(m, v, g)
    for _ in range(6): g[r.randint(24), r.randint(24)] = 0.97             # quelques reflets
    return np.clip(g, 0, 1)


def bark():
    img = np.zeros((24, 24, 3)); base = np.array([.34, .22, .13])
    for x in range(24):
        col = (x // 3 + (x % 7 == 0)) % 4
        for y in range(24):
            v = [1.0, .8, 1.15, .65][col]
            v *= 0.9 + 0.2 * (((y + x * 5) % 9) < 4)
            if x % 6 == 5: v *= .55                                     # fissure verticale
            img[y, x] = base * v
    r = np.random.RandomState(5)
    for _ in range(3):                                                 # nœuds
        x, y = r.randint(2, 21), r.randint(2, 21); img[y:y + 3, x:x + 2] *= .5; img[y - 1, x:x + 2] *= 1.3
    for _ in range(10): img[r.randint(24), r.randint(24)] = np.array([.30, .42, .18])      # mousse
    return np.clip(img, 0, 1)


def main():
    a = np.zeros((24, 72, 3))
    for i, (seed, sp) in enumerate([(3, False), (9, True)]):
        g = leaves(seed, sp); a[:, i * 24:(i + 1) * 24] = g[..., None]
    a[:, 48:72] = bark()
    out = os.path.join(ROOT, 'assets', 'props', 'forest.png')
    Image.fromarray((a * 255).astype(np.uint8), 'RGB').save(out, optimize=True)
    Image.open(out).resize((72 * 8, 24 * 8), Image.NEAREST).save('/tmp/forest_prev.png'); print('ok')


if __name__ == '__main__':
    main()
