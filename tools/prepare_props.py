#!/usr/bin/env python3
"""Prépare les feuilles de décor à partir des sources de tools/props_src/ :
  - pokeballs_gba.png (fond vert) -> assets/props/pokeball.png : Poké Ball classique seule, 2 frames (0 fermée, 1 ouverte)
  - ice_sheet.png -> assets/props/ice.png : 12 sprites de glace repackés (cellules uniformes, pieds en bas, réduits à 55 %)
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

# ---------- Glace (piliers, cristaux, blocs) ----------
ic = np.array(Image.open(os.path.join(SRC, 'ice_sheet.png')).convert('RGBA'))
# boîtes (x0, y0, x1, y1) repérées sur la feuille ; ordre = indices de frames dans ice.png
BOXES = [(3, 82, 49, 160), (54, 84, 103, 160), (8, 166, 59, 253), (207, 168, 243, 252),      # 0-3 piliers : intact, fissuré, pointe haute, paire
         (204, 0, 253, 80), (156, 13, 201, 80), (107, 23, 150, 79), (71, 168, 124, 252),      # 4-7 cristaux : grands amas, éclats
         (138, 174, 186, 253), (56, 39, 99, 79), (6, 54, 48, 78), (105, 96, 151, 160)]        # 8-10 blocs/petits amas, 11 pilier abîmé (libre)
CELL_W, CELL_H, S = 56, 90, 0.55
cw, ch = round(CELL_W * S), round(CELL_H * S)
ice = Image.new('RGBA', (cw * 6, ch * 2), (0, 0, 0, 0))
for i, (x0, y0, x1, y1) in enumerate(BOXES):
    crop = ic[y0:y1, x0:x1].copy(); a = bbox(crop); crop = crop[a[1]:a[3], a[0]:a[2]]
    cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0)); c = Image.fromarray(crop)
    cell.alpha_composite(c, ((CELL_W - c.width) // 2, CELL_H - 1 - c.height))
    cell = cell.convert('RGBa').resize((cw, ch), Image.LANCZOS).convert('RGBA')
    ice.alpha_composite(cell, ((i % 6) * cw, (i // 6) * ch))
ice.save(os.path.join(OUT, 'ice.png')); print('ice', ice.size, 'cell', cw, ch)
