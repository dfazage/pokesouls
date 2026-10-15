#!/usr/bin/env python3
"""Bake PMDCollab SpriteCollab sheets into assets/sprites + assets/sprites.json.
Usage: python3 -I tools/bake_sprites.py <raw_dir> <out_assets_dir>
raw_dir/<id>/{AnimData.xml,<Anim>-Anim.png,portrait.png}
Sprites: PMDCollab SpriteCollab, CC BY-NC (non-commercial, credit required)."""
import sys, os, json, shutil
import xml.etree.ElementTree as ET
from PIL import Image
raw, out = sys.argv[1], sys.argv[2]
NAMES = {'0448':'lucario','0282':'gardevoir','0065':'alakazam','0571':'zoroark','0724':'decidueye','0009':'blastoise',
         '0081':'magnemite','0109':'koffing','0100':'voltorb','0101':'electrode','0137':'porygon','0150':'mewtwo'}
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
        shutil.copy(f, os.path.join(out, 'sprites', name, src_name + '.png'))
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
print({k: sorted(v['anims']) for k, v in db.items()})
