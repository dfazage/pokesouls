#!/usr/bin/env python3
"""Génère les sprites de décor dessinés au code d'origine (lanternes, cloches, torii, arbres, statues, braseros, rochers, cristaux, piliers,
cuves, consoles, miroir, générateur) en pixel art, pour deux inclinaisons de caméra : « hi » (exploration, 40°) et « lo » (duel de boss, ~22°).
Écrit assets/props/decor.png et fusionne les entrées dans assets/props.json (les clés existantes sont conservées).
Usage : python3 tools/props_gen/build.py [--preview DOSSIER]"""
import json, os, sys, math
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import engine
import recipes_edo as E, recipes_stone as S, recipes_lab as L
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

# (clé, constructeur(variante, t) -> image, variantes, images par variante (animation), fps, extra json)
REG = [
    # ---- Edo (Tour Carillon, Tour Brûlée, Lac du Miroir, Forêt d'Ilex) ----
    ('lantern_bell',   lambda v, t: E.lantern('bell', t), 1, 6, 8, {}),
    ('lantern_ember',  lambda v, t: E.lantern('ember', t), 1, 6, 8, {}),
    ('lantern_mirror', lambda v, t: E.lantern('mirror', t), 1, 6, 8, {}),
    ('lantern_ilex',   lambda v, t: E.lantern('ilex', t, vine=True), 1, 6, 8, {}),
    ('bell_bell',      lambda v, t: E.bell('bell', t), 1, 8, 3, {}),
    ('bell_ember',     lambda v, t: E.bell('ember', t), 1, 8, 3, {}),
    ('torii_ember',    lambda v, t: E.torii('ember', t), 1, 4, 4, {}),
    ('torii_mirror',   lambda v, t: E.torii('mirror', t), 1, 4, 3, {}),
    ('torii_ilex',     lambda v, t: E.torii('ilex', t), 1, 4, 3, {}),
    ('tree_ember',     lambda v, t: E.tree('ember', v, t), 3, 4, 2.2, {'vary': True}),
    ('tree_mirror',    lambda v, t: E.tree('mirror', v, t), 3, 4, 2.2, {'vary': True}),
    ('tree_ilex',      lambda v, t: E.tree('ilex', v, t), 3, 4, 2.2, {'vary': True}),
    ('tree_mystic',    lambda v, t: E.tree('mystic', v, t), 3, 4, 2.2, {'vary': True}),
    ('statue_ilex',    lambda v, t: E.statue('ilex', t), 1, 4, 3, {}),
    ('statue_mystic',  lambda v, t: E.statue('mystic', t), 1, 4, 3, {}),
    ('statue_storm',   lambda v, t: E.statue('storm', t), 1, 4, 3, {}),
    # ---- feu et pierre ----
    ('brazier_lava',   lambda v, t: S.brazier('lava', t), 1, 6, 9, {}),
    ('brazier_stone',  lambda v, t: S.brazier('stone', t), 1, 6, 9, {}),
    ('brazier_ember',  lambda v, t: S.brazier('ember', t), 1, 6, 9, {}),
    ('rock_lava',      lambda v, t: S.rock('lava', v, t), 2, 4, 2.5, {'vary': True}),
    ('rock_stone',     lambda v, t: S.rock('stone', v, t), 2, 1, 1, {'vary': True}),
    ('rock_mirror',    lambda v, t: S.rock('mirror', v, t), 2, 4, 2.5, {'vary': True}),
    ('rock_storm',     lambda v, t: S.rock('storm', v, t), 2, 4, 2.5, {'vary': True}),
    ('crystal_lava',   lambda v, t: S.crystal('lava', v, t), 2, 4, 3, {'vary': True}),
    ('crystal_storm',  lambda v, t: S.crystal('storm', v, t), 2, 4, 3, {'vary': True}),
    ('crystal_mystic', lambda v, t: S.crystal('mystic', v, t), 2, 4, 3, {'vary': True}),
    ('pillar_stone',   lambda v, t: S.pillar('stone', v, t), 2, 4, 3, {'vary': True}),
    ('pillar_storm',   lambda v, t: S.pillar('storm', v, t), 2, 4, 3, {'vary': True}),
    # ---- laboratoire et centrale ----
    ('tank',           lambda v, t: L.tank(False, t), 1, 6, 6, {}),
    ('tankbroken',     lambda v, t: L.tank(True, t), 1, 6, 6, {}),
    ('console_lab',    lambda v, t: L.console('lab', t), 1, 6, 5, {}),
    ('console_plant',  lambda v, t: L.console('plant', t), 1, 6, 5, {}),
    ('mirror',         lambda v, t: L.mirror(t), 1, 8, 8, {}),
    ('generator',      lambda v, t: L.generator(t), 1, 6, 10, {}),
    # ---- remplacements des anciens sprites externes (sans variante caméra basse) ----
    ('tree_bell',      lambda v, t: E.tree('bell', v, t), 3, 4, 2.2, {'vary': True}),
    ('torii_bell',     lambda v, t: E.torii('bell', t), 1, 4, 3, {}),
    ('pillar_ice',     lambda v, t: S.pillar_nat('ice', v, t), 2, 4, 3, {'vary': True}),
    ('crystal_ice',    lambda v, t: S.crystal('ice', v, t), 2, 4, 3, {'vary': True}),
    ('rock_ice',       lambda v, t: S.rock('ice', v, t), 2, 4, 2.5, {'vary': True}),
    ('pillar_lava',    lambda v, t: S.pillar_nat('lava', v, t), 2, 4, 3, {'vary': True}),
    ('pillar_plant',   lambda v, t: L.pillar_tech('plant', v, t), 2, 4, 3, {'vary': True}),
    ('pillar_lab',     lambda v, t: L.pillar_tech('lab', v, t), 2, 4, 3, {'vary': True}),
    ('bonfire_lit',    lambda v, t: S.bonfire(True, t), 1, 6, 6, {}),
    ('bonfire_unlit',  lambda v, t: S.bonfire(False, t), 1, 1, 1, {}),
]


def render_entry(fn, nv, per, pitch):
    engine.set_pitch(pitch)
    return [[fn(v, i / per) for i in range(per)] for v in range(nv)]


def union_box(imgs):
    """Rectangle commun à toutes les images : le bas colle au sol, les côtés restent symétriques autour du centre."""
    top, bot, half = 10 ** 9, 0, 0; W = imgs[0].width; cx = W / 2
    for im in imgs:
        a = np.array(im)[:, :, 3] > 0; ys, xs = np.nonzero(a)
        top, bot = min(top, ys.min()), max(bot, ys.max() + 1); half = max(half, cx - xs.min(), xs.max() + 1 - cx)
    half = int(math.ceil(half)); x0 = int(round(cx - half)); x1 = x0 + 2 * half
    return int(max(0, x0)), int(top), int(min(W, x1)), int(bot)


def build(preview=None):
    entries = []
    for key, fn, nv, per, fps, extra in REG:
        sets = {p: render_entry(fn, nv, per, p) for p in ('hi', 'lo')}
        flat = [im for p in sets for row in sets[p] for im in row]
        x0, y0, x1, y1 = union_box(flat)
        cells = {p: [[im.crop((x0, y0, x1, y1)) for im in row] for row in sets[p]] for p in sets}
        entries.append((key, cells, x1 - x0, y1 - y0, nv, per, fps, extra))
    # rangement en étagères
    AW = 1024; x = y = shelf = 0; place = {}
    for key, cells, fw, fh, nv, per, fps, extra in entries:
        for p in ('hi', 'lo'):
            bw, bh = per * fw, nv * fh
            if x + bw > AW: x, y, shelf = 0, y + shelf, 0
            place[(key, p)] = (x, y); x += bw + 1; shelf = max(shelf, bh + 1)
    atlas = Image.new('RGBA', (AW, y + shelf), (0, 0, 0, 0))
    for key, cells, fw, fh, nv, per, fps, extra in entries:
        for p in ('hi', 'lo'):
            ox, oy = place[(key, p)]
            for v, row in enumerate(cells[p]):
                for i, im in enumerate(row): atlas.alpha_composite(im, (ox + i * fw, oy + v * fh))
    out = os.path.join(ROOT, 'assets', 'props', 'decor.png'); atlas.save(out, optimize=True)
    db_path = os.path.join(ROOT, 'assets', 'props.json'); db = json.load(open(db_path))
    for key, cells, fw, fh, nv, per, fps, extra in entries:
        hx, hy = place[(key, 'hi')]; lx, ly = place[(key, 'lo')]
        e = {'file': 'props/decor.png', 'x0': int(hx), 'y0': int(hy), 'fw': int(fw), 'fh': int(fh), 'cols': per, 'frames': list(range(nv * per)), 'lo': {'x0': int(lx), 'y0': int(ly)}}
        if per > 1: e['per'] = per; e['fps'] = fps
        if fps and per > 1 and not extra.get('vary'): pass
        e.update(extra); db[key] = e
    txt = json.dumps(db, indent=2, ensure_ascii=False) + '\n'; open(db_path, 'w').write(txt)   # sérialisé d'abord : un échec ne tronque pas le fichier
    print('atlas', atlas.size, len(entries), 'entrées')
    if preview:
        os.makedirs(preview, exist_ok=True)
        for p in ('hi', 'lo'):
            rows = []
            for key, cells, fw, fh, nv, per, fps, extra in entries:
                rows.append((key, [cells[p][v][0] for v in range(nv)] + [cells[p][0][i] for i in range(1, per)][:3]))
            for gi, grp in enumerate([rows[i:i + 9] for i in range(0, len(rows), 9)]):
                W = max(sum(im.width + 6 for im in r[1]) for r in grp) + 6; H = sum(max(im.height for im in r[1]) + 8 for r in grp) + 4
                sh = Image.new('RGBA', (W, H), (66, 62, 74, 255)); yy = 4
                for key, ims in grp:
                    xx = 6
                    for im in ims: sh.alpha_composite(im, (xx, yy + max(i.height for i in ims) - im.height)); xx += im.width + 6
                    yy += max(i.height for i in ims) + 8
                sh.resize((sh.width * 3, sh.height * 3), Image.NEAREST).save(os.path.join(preview, f'sheet_{p}_{gi}.png'))
    return entries


if __name__ == '__main__':
    pv = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    build(pv)
