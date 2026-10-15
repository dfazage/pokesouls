#!/usr/bin/env python3
"""Bake PMDCollab SpriteCollab sheets into assets/sprites + assets/sprites.json.
Usage: python3 -I tools/bake_sprites.py <raw_dir> <out_assets_dir>
raw_dir/<id>/{AnimData.xml,<Anim>-Anim.png,portrait.png}
Sprites: PMDCollab SpriteCollab, CC BY-NC (non-commercial, credit required)."""
import sys, os, json, shutil
import xml.etree.ElementTree as ET
from PIL import Image
raw, out = sys.argv[1], sys.argv[2]
spec = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'species.json')))
NAMES = {'%04d' % d: slug for d, slug, fr in spec}
db = {}
for pid, name in NAMES.items():
    d = os.path.join(raw, pid)
    root = ET.parse(os.path.join(d, 'AnimData.xml')).getroot()
    anims = {}
    for a in root.iter('Anim'):
        n = a.findtext('Name')
        anims[n] = a
    def resolve(n):
        a = anims.get(n)
        if a is None: return None
        c = a.findtext('CopyOf')
        return resolve(c) if c else (n, a)
    entry = {'id': pid, 'anims': {}}
    os.makedirs(os.path.join(out, 'sprites', name), exist_ok=True)
    for n in anims:
        r = resolve(n)
        if not r: continue
        src_name, a = r
        f = os.path.join(d, src_name + '-Anim.png')
        if not os.path.exists(f): continue
        fw, fh = int(a.findtext('FrameWidth')), int(a.findtext('FrameHeight'))
        im = Image.open(f)
        dur = [int(x.text) for x in a.iter('Duration')]
        dst = os.path.join(out, 'sprites', name, src_name + '.png')
        if not os.path.exists(dst): im.save(dst, optimize=True)
        entry['anims'][n] = {'file': f'sprites/{name}/{src_name}.png', 'fw': fw, 'fh': fh, 'frames': im.size[0] // fw,
            'dur': dur, 'hit': int(a.findtext('HitFrame') or -1), 'rush': int(a.findtext('RushFrame') or -1), 'ret': int(a.findtext('ReturnFrame') or -1)}
    idle = entry['anims']['Idle']
    im = Image.open(os.path.join(out, idle['file'])).convert('RGBA').crop((0, 0, idle['fw'], idle['fh']))
    bb = im.getchannel('A').getbbox()
    entry['anchor'] = {'ox': (bb[0] + bb[2]) / 2 - idle['fw'] / 2, 'oy': bb[3] - idle['fh'] / 2, 'w': bb[2] - bb[0], 'h': bb[3] - bb[1]}
    pp = os.path.join(d, 'portrait.png')
    if os.path.exists(pp): shutil.copy(pp, os.path.join(out, 'sprites', name, 'portrait.png')); entry['portrait'] = f'sprites/{name}/portrait.png'
    db[name] = entry
json.dump(db, open(os.path.join(out, 'sprites.json'), 'w'), separators=(',', ':'))
need = {'Idle', 'Walk', 'Attack', 'Hurt'}
for k, v in db.items():
    if not need <= set(v['anims']): print('MANQUE', k, sorted(v['anims']))
print(len(db), 'espèces')
