#!/usr/bin/env python3
"""Prépare les feuilles de décor à partir des sources de tools/props_src/ :
  - pokeballs_gba.png (fond vert) -> assets/props/pokeball.png : Poké Ball classique seule, 2 frames (0 fermée, 1 ouverte)
  - campfire_sheet.png (4x2 cellules de 64x128) -> assets/props/campfire.png : frames recadrées, pieds alignés en bas
Usage : python3 tools/prepare_props.py   (puis vérifier assets/props.json)"""
import os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, 'props_src'); OUT = os.path.join(HERE, '..', 'assets', 'props')

def bbox(a):
    ys, xs = np.where(a[..., 3] > 0); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

# ---------- Poké Ball ----------
im = np.array(Image.open(os.path.join(SRC, 'pokeballs_gba.png')).convert('RGBA'))
im[np.all(im == [34, 177, 76, 255], axis=2)] = [0, 0, 0, 0]            # fond vert -> transparent
X0, X1 = 34, 46                                                         # 3e colonne = Poké Ball classique
closed = im[0:17, X0:X1]; opened = im[17:34, X0:X1]
FW, FH = 16, 18
sheet = Image.new('RGBA', (FW * 2, FH), (0, 0, 0, 0))
for i, f in enumerate((closed, opened)):
    x0, y0, x1, y1 = bbox(f); c = Image.fromarray(f[y0:y1, x0:x1])
    sheet.alpha_composite(c, (i * FW + (FW - c.width) // 2, FH - 1 - c.height))   # centré, 1 px sous le sprite
sheet.save(os.path.join(OUT, 'pokeball.png')); print('pokeball', sheet.size)

# ---------- Feu de camp ----------
cs = np.array(Image.open(os.path.join(SRC, 'campfire_sheet.png')).convert('RGBA'))
CW, RH = 64, 128; FRAMES = []
for r in range(2):
    row = cs[r * RH:(r + 1) * RH]; base = bbox(row)[3]                  # bas de l'anneau de pierres de la rangée
    top = base - 116
    for c in range(4):
        cell = row[max(top, 0):base, c * CW:(c + 1) * CW]
        pad = np.zeros((116, CW, 4), np.uint8); pad[116 - cell.shape[0]:] = cell; FRAMES.append(pad)
SCALE = 0.75                                                            # 64 px -> 48 px de large (~2 cases)
fw, fh = round(CW * SCALE), round(116 * SCALE)
out = Image.new('RGBA', (fw * 8, fh), (0, 0, 0, 0))
for i, f in enumerate(FRAMES):
    rgba = Image.fromarray(f); p = rgba.convert('RGBa').resize((fw, fh), Image.LANCZOS).convert('RGBA'); out.alpha_composite(p, (i * fw, 0))
out.save(os.path.join(OUT, 'campfire.png')); print('campfire', out.size, 'frame', fw, fh)
