#!/usr/bin/env python3
"""Génère les sols (tuiles 24 px pixel art + masque d'émission), les décors posés au sol et les murs.
Sorties : assets/props/floor.png, assets/props/floor_e.png, assets/floor.json.
Usage : python3 tools/props_gen/build_floor.py [--preview DIR]"""
import json, os, sys, math
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from tilekit import Look
import floors_a as A
import floors_b as B
import decals as DC
import walls as WL
from PIL import Image as _I

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
S = 24; COLS = 32

# couleurs copiées de THEMES (js/maps.js)
EDO = {
    'bell': [(120, 112, 100), (128, 94, 78), (122, 88, 58)],
    'ember': [(104, 96, 90), (118, 78, 62), (88, 66, 50)],
    'mirror': [(138, 156, 164), (120, 142, 152), (176, 142, 100)],
    'storm': [(52, 74, 88), (60, 82, 92), (84, 76, 64)],
    'ilex': [(96, 110, 88), (74, 112, 62), (112, 92, 62)],
}
ARENA = {'lab': (38, 30, 62), 'plant': (66, 60, 56), 'ice': (70, 96, 150), 'lava': (78, 42, 34), 'rock': (86, 72, 52), 'mystic': (52, 50, 86),
         'bell': (138, 128, 110), 'ember': (118, 96, 82), 'mirror': (104, 138, 158), 'storm': (66, 92, 108), 'ilex': (128, 138, 108)}
BRIDGE = {'ember': (136, 96, 60), 'mirror': (176, 142, 100), 'storm': (110, 90, 68), 'bell': (136, 96, 60)}
SHADOW = {'lab': (16, 16, 42), 'plant': (22, 20, 36), 'ice': (16, 34, 86), 'lava': (36, 8, 10), 'rock': (30, 20, 22), 'mystic': (10, 30, 40),
          'bell': (34, 24, 40), 'ember': (36, 14, 14), 'mirror': (30, 60, 90), 'storm': (6, 24, 50), 'ilex': (26, 40, 30)}
LIGHT = {'lab': (210, 230, 255), 'ice': (240, 250, 255), 'lava': (255, 200, 150), 'mystic': (220, 255, 240), 'mirror': (255, 250, 245), 'storm': (210, 245, 255)}
PLAIN = {'plain', 'plain2', 'twin', 'quad', 'tread', 'cobble', 'mossy', 'flags', 'strata', 'gravel', 'grass', 'grass2', 'joint', 'joint2', 'cracks', 'fine'}


def look(key, calm=1.0):
    return Look(shadow=SHADOW.get(key, (22, 20, 44)), light=LIGHT.get(key, (255, 238, 205)), calm=calm, dither=0.45)


def sets():
    """[(clé, thème, variantes, calm)] ; clé = '<thème>:<rôle>'."""
    L = []
    L.append(('lab:floor', 'lab', A.lab((34, 40, 62), (80, 220, 200), 1), 1.0))
    L.append(('lab:lab', 'lab', A.lab((28, 40, 58), (80, 220, 200), 11), 1.0))
    L.append(('lab:arena', 'lab', A.lab(ARENA['lab'], (190, 120, 255), 21), 0.6))
    L.append(('plant:floor', 'plant', A.plant((58, 58, 70), (255, 232, 80), 2), 1.0))
    L.append(('plant:arena', 'plant', A.plant(ARENA['plant'], (190, 120, 255), 22), 0.6))
    L.append(('ice:floor', 'ice', A.ice((64, 92, 130), (190, 240, 255), 3), 1.0))
    L.append(('ice:arena', 'ice', A.ice(ARENA['ice'], (190, 240, 255), 23), 0.6))
    L.append(('lava:floor', 'lava', A.lava((66, 40, 38), (255, 130, 50), 4), 1.0))
    L.append(('lava:arena', 'lava', A.lava(ARENA['lava'], (255, 130, 50), 24), 0.6))
    L.append(('rock:floor', 'rock', A.rock((72, 64, 58), (255, 200, 110), 5), 1.0))
    L.append(('rock:arena', 'rock', A.rock(ARENA['rock'], (255, 200, 110), 25), 0.6))
    L.append(('mystic:floor', 'mystic', A.moss((36, 68, 62), (255, 170, 230), 6), 1.0))
    L.append(('mystic:arena', 'mystic', A.moss(ARENA['mystic'], (255, 170, 230), 26), 0.6))
    ex = {'ember': B.ember_extra, 'mirror': B.mirror_extra, 'storm': B.storm_extra}
    for i, th in enumerate(('bell', 'ember', 'mirror', 'storm', 'ilex')):
        e = EDO[th]; x = ex.get(th); sd = 40 + i * 5
        L.append((f'{th}:s0', th, B.slab(e[0], sd, extra=x), 1.0))
        L.append((f'{th}:s1', th, B.meadow(e[1], sd + 1) if th == 'ilex' else B.brick(e[1], sd + 1, extra=x), 1.0))
        L.append((f'{th}:s2', th, B.wood(e[2], sd + 2, extra=x), 1.0))
        if th in BRIDGE: L.append((f'{th}:br', th, B.wood(BRIDGE[th], sd + 3, extra=x), 1.0))
        L.append((f'{th}:arena', th, B.gravel(ARENA[th], sd + 4), 0.6))
    return L


def build(preview=None):
    tiles = []; etiles = []; man = {}
    for key, th, vs, calm in sets():
        i0 = len(tiles); pick = []
        for j, (name, t, w) in enumerate(vs):
            w = w if name in PLAIN or key.endswith(':arena') else w * 0.6
            img, em = t.render(look(th, calm)); tiles.append(img); etiles.append(em)
            pick += [j] * max(1, int(round(w * 2)))
        man[key] = {'i0': i0, 'n': len(vs), 'pick': pick, 'names': [v[0] for v in vs]}
    n = len(tiles); rows = (n + COLS - 1) // COLS
    atlas = Image.new('RGBA', (COLS * S, rows * S), (0, 0, 0, 0)); eatlas = Image.new('RGBA', (COLS * S, rows * S), (0, 0, 0, 0))
    for i, (a, e) in enumerate(zip(tiles, etiles)): atlas.paste(a, ((i % COLS) * S, (i // COLS) * S)); eatlas.paste(e, ((i % COLS) * S, (i // COLS) * S))
    return atlas, eatlas, man, tiles


def pack(items, width=512, pad=1):
    """Rangées empilées : items = [(w, h, img, em)] -> positions."""
    x = y = rowh = 0; pos = []
    for w, h, *_ in items:
        if x + w + pad > width: x = 0; y += rowh + pad; rowh = 0
        pos.append((x, y)); x += w + pad; rowh = max(rowh, h)
    return pos, y + rowh + pad


def build_decals():
    cat = DC.catalog(); items = []; meta = []
    for th, lst in cat.items():
        for name, fn, w, near in lst:
            for v in range(2):
                t = fn(7 + v * 13 + len(name)); img, em = DC.finish(t, look(th, 1.0))
                items.append((img.width, img.height, img, em)); meta.append((th, 'd', name, w, near))
    runs = {}
    for th, cols in DC.RUNS.items():
        for ci, (c,) in enumerate(cols):
            for kind in ('mid', 'endL', 'endR'):
                t = DC.cable(ci * 3 + 1, [c], kind=kind); hi, he = DC.finish(t, look(th, 1.0), shadow=True)
                items.append((hi.width, hi.height, hi, he)); meta.append((th, 'r', f'{ci}:h:{kind}', 0, 0))
                tv = DC.rotate(DC.cable(ci * 3 + 1, [c], kind=kind), 1); vi, ve = DC.finish(tv, look(th, 1.0), shadow=True)
                items.append((vi.width, vi.height, vi, ve)); meta.append((th, 'r', f'{ci}:v:{kind}', 0, 0))
    pos, H = pack(items)
    atlas = _I.new('RGBA', (512, H), (0, 0, 0, 0)); eatlas = _I.new('RGBA', (512, H), (0, 0, 0, 0)); dec = {}; runs = {}
    for (w, h, img, em), (x, y), (th, typ, name, wt, near) in zip(items, pos, meta):
        atlas.paste(img, (x, y)); eatlas.paste(em, (x, y)); rec = [x, y, w, h]
        if typ == 'd': dec.setdefault(th, []).append({'r': rec, 'w': wt, 'near': near, 'n': name})
        else: runs.setdefault(th, {})[name] = rec
    return atlas, eatlas, dec, runs


def build_walls():
    w = WL.build_wall_tiles(); keys = list(w); atlas = _I.new('RGBA', (9 * S, len(keys) * S), (0, 0, 0, 0)); ea = _I.new('RGBA', (9 * S, len(keys) * S), (0, 0, 0, 0))
    for r, k in enumerate(keys):
        for c, (img, em) in enumerate(w[k]): atlas.paste(img, (c * S, r * S)); ea.paste(em, (c * S, r * S))
    return atlas, ea, {k: r for r, k in enumerate(keys)}


def main():
    prev = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    atlas, eatlas, man, tiles = build()
    out = os.path.join(ROOT, 'assets', 'props'); os.makedirs(out, exist_ok=True)
    manifest = {'ts': S, 'cols': COLS, 'file': 'props/floor.png', 'efile': 'props/floor_e.png', 'tiles': man}
    da, dea, dec, runs = build_decals(); da.save(os.path.join(out, 'floor_d.png'), optimize=True); dea.save(os.path.join(out, 'floor_de.png'), optimize=True)
    wa, wea, wk = build_walls(); wa.save(os.path.join(out, 'walls.png'), optimize=True); wea.save(os.path.join(out, 'walls_e.png'), optimize=True)
    manifest.update({'wfile': 'props/walls.png', 'wefile': 'props/walls_e.png', 'walls': wk, 'dfile': 'props/floor_d.png', 'defile': 'props/floor_de.png', 'decals': dec, 'runs': runs, 'hfile': 'props/house.png', 'hefile': 'props/house_e.png', 'ffile': 'props/forest.png'})
    atlas.save(os.path.join(out, 'floor.png'), optimize=True); eatlas.save(os.path.join(out, 'floor_e.png'), optimize=True)
    json.dump(manifest, open(os.path.join(ROOT, 'assets', 'floor.json'), 'w'), separators=(',', ':'))
    print('tuiles', len(tiles), 'sets', len(man), 'atlas', atlas.size, 'décors', sum(len(v) for v in dec.values()), da.size)
    if prev:
        os.makedirs(prev, exist_ok=True); wa.resize((wa.width * 4, wa.height * 4), _I.NEAREST).save(os.path.join(prev, 'walls.png')); da.resize((da.width * 3, da.height * 3), _I.NEAREST).save(os.path.join(prev, 'decals.png'))
        for key, m in man.items():
            im = Image.new('RGBA', (m['n'] * 26, 26), (30, 30, 36, 255))
            for j in range(m['n']): im.paste(tiles[m['i0'] + j], (j * 26 + 1, 1))
            im.resize((im.width * 3, im.height * 3), Image.NEAREST).save(os.path.join(prev, key.replace(':', '_') + '.png'))
        import random; random.seed(3)
        for key, m in man.items():
            mo = Image.new('RGBA', (24 * 12, 24 * 6))
            for y in range(6):
                for x in range(12): mo.paste(tiles[m['i0'] + random.choice(m['pick'])], (x * 24, y * 24))
            mo.resize((mo.width * 3, mo.height * 3), Image.NEAREST).save(os.path.join(prev, 'mos_' + key.replace(':', '_') + '.png'))


if __name__ == '__main__':
    main()
