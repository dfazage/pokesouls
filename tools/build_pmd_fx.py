#!/usr/bin/env python3
"""Remplace les planches d'effets Dämmerlicht par des planches pixel art de PMDCollab (RawAsset/Particle).
Usage : python3 tools/build_pmd_fx.py CHEMIN/RawAsset
Copie les planches choisies dans assets/fx/pmd/, met à jour assets/fx.json (clé de jeu -> planche PMD) et laisse
les planches Dämmerlicht en place pour les clés non remplacées. Frames carrées : hauteur de la planche = taille d'une frame."""
import json, os, shutil, sys
from PIL import Image
RAW = sys.argv[1] if len(sys.argv) > 1 else '../doubletrio/RawAsset'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# clé de jeu -> planche PMD (Particle/<nom>.png)
MAP = {
  'scratch': 'Scratch.Dir1', 'slash': 'Slash_Ranger.Dir1', 'furyswipes': 'Fury_Swipes.None', 'crosschop': 'Cross_Chop.None', 'xscissor': 'X_Scissor.None',
  'tackle': 'Hit_Neutral.None', 'ember': 'Ember.None', 'brine': 'Brine_Splashes.None', 'leafblade': 'Leaf_Blade.None', 'spark': 'Spark.None',
  'confusion': 'Psych_Up.None', 'dig': 'Rock_Smash.None', 'shadowclaw': 'Shadow_Claw.None', 'feintattack': 'Feint_Attack.None', 'machpunch': 'Bullet_Punch.None',
  'metalclaw': 'Metal_Claw.None', 'crosspoison': 'Cross_Poison.None', 'aircutter': 'Razor_Wind.None', 'astonish': 'Hit_Super_Effective.None',
  'darkblade': 'Draco_Meteor_Explosion.None', 'skullbash': 'Rock_Pieces.None', 'frostbone': 'Ice_Shard_Hit.None', 'firespin': 'Fire_Spin_Front.None',
  'poisonpowder': 'Smoke_Purple.None', 'iceball': 'Ice_Ball.None', 'thunderwave': 'Shock_Wave.None', 'pipofire': 'Flamethrower_2.None', 'fireblast': 'Fire_Blast.None',
  'whirlpool': 'Water_Spout_Splash.None', 'watercannon': 'Hydro_Cannon.None', 'bodyslam': 'Giga_Impact_Front.None', 'earthpower': 'Earth_Power_Front.None',
  'headbutt': 'Zen_Headbutt_Hit.None', 'thunderbolt': 'Discharge_Hit.None', 'electroball': 'Light_Ball_Yellow.None', 'charge': 'Charge_Up.None',
  'extrasensory': 'Psycho_Boost_Front.None', 'cosmicpower': 'Stat_Purple_Ring.None', 'teleport': 'Materialize.None', 'swordsdance': 'Swords_Dance.None',
  'flashcannon': 'Flash_Cannon.None', 'plasmaburst': 'Signal_Beam.None', 'recover': 'Stat_Green_Ring.None', 'healingwish': 'Healing_Wish_Hit.None',
  'ingrain': 'Ingrain.None', 'aromatherapy': 'Heal_Bell.None', 'aquaring': 'Aqua_Ring.None', 'safeguard': 'Safeguard_Front.None', 'vinewhip': 'Vine_Whip_2.None',
  'moonlight': 'Moonlight_Moon.None', 'razorwind': 'Razor_Wind.None', 'aerialace': 'Wing_Attack.None', 'selfdestruct': 'Explosion.None',
}
# nouvelles clés (Feu, Eau, Glace, Dragon : absentes de Dämmerlicht)
NEW = {
  'flamethrower': 'Flamethrower.None', 'flamewheel': 'Flame_Wheel.None', 'eruption': 'Eruption.None', 'hydrocannon': 'Hydro_Cannon.None',
  'waterspout': 'Water_Spout_Up.None', 'octazooka': 'Octazooka.None', 'icywind': 'Icy_Wind.None', 'sheercold': 'Sheer_Cold_Front.None',
  'dracometeor': 'Draco_Meteor_Explosion.None', 'dragonpulse': 'Dragon_Pulse_Ball.None', 'dragonrush': 'Dragon_Rush_Front.Flip', 'dragondance': 'Dragon_Dance.None',
  'burned': 'Burned.None', 'willowisp': 'Will_O_Wisp.None',
  # ulti Lien : anneaux teintés par la couleur du type, éclat doré et étoiles (à la place des effets Dämmerlicht, trop blancs)
  'linkburst': 'Circle_Yellow_Out.None', 'linkstar': 'Lucky_Chant_Star_Yellow.None',
}
for _c in ('Blue', 'Green', 'Pink', 'Purple', 'Red', 'Yellow'):
    NEW['linkring_' + _c.lower()] = 'Stat_%s_Ring.None' % _c
    NEW['linkpulse_' + _c.lower()] = 'Circle_Red_Out.None' if _c == 'Red' else 'Circle_Small_%s_Out.None' % _c
man_path = os.path.join(ROOT, 'assets/fx.json'); man = json.load(open(man_path))
out_dir = os.path.join(ROOT, 'assets/fx/pmd'); os.makedirs(out_dir, exist_ok=True)
missing = []
for key, src in {**MAP, **NEW}.items():
    f = os.path.join(RAW, 'Particle', src + '.png')
    if not os.path.exists(f): missing.append(src); continue
    im = Image.open(f); W, H = im.size
    n = max(1, round(W / H)); fw = W // n
    shutil.copy(f, os.path.join(out_dir, key + '.png'))
    old = man.get(key, {})
    man[key] = {'file': 'fx/pmd/' + key + '.png', 'fw': fw, 'fh': H, 'cols': n, 'n': n, 'px': 1, 'src': src, 'name': old.get('name', key)}
json.dump(man, open(man_path, 'w'), ensure_ascii=False, separators=(',', ':'))
print('ok', len(MAP) + len(NEW) - len(missing), 'manquants', missing)
