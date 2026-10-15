#!/usr/bin/env python3
"""Télécharge les feuilles PMDCollab SpriteCollab (CC BY-NC) nécessaires.
Usage: python3 -I tools/fetch_sprites.py tools/species.json <raw_dir>"""
import sys, os, json, urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
BASE = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/'
WANT = {'Walk', 'Attack', 'Hurt', 'Idle', 'Swing', 'Charge', 'Shoot', 'Faint', 'Hover', 'SpAttack', 'Appeal', 'Strike'}
spec, raw = sys.argv[1], sys.argv[2]
def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0: return True
    for _ in range(3):
        try:
            data = urllib.request.urlopen(url, timeout=30).read()
            open(dest, 'wb').write(data); return True
        except Exception as e: err = e
    return False
def one(dex):
    pid = '%04d' % dex; d = os.path.join(raw, pid); os.makedirs(d, exist_ok=True)
    if not get(BASE + f'sprite/{pid}/AnimData.xml', os.path.join(d, 'AnimData.xml')): return pid, 'noxml'
    root = ET.parse(os.path.join(d, 'AnimData.xml')).getroot(); miss = []
    for a in root.iter('Anim'):
        n = a.findtext('Name')
        if n in WANT and not a.findtext('CopyOf'):
            if not get(BASE + f'sprite/{pid}/{n}-Anim.png', os.path.join(d, f'{n}-Anim.png')): miss.append(n)
    get(BASE + f'portrait/{pid}/Normal.png', os.path.join(d, 'portrait.png'))
    return pid, miss
ids = sorted({s[0] for s in json.load(open(spec))})
with ThreadPoolExecutor(12) as ex:
    for pid, m in ex.map(one, ids):
        if m: print(pid, m)
print('ok', len(ids))
