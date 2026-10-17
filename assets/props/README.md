# Sprites de décor

Les feuilles PNG de décor vont ici ; `assets/props.json` décrit chaque entrée (voir `js/props.js`).

Clés reconnues (sinon le dessin procédural d'origine est utilisé) :

| Clé | Utilisation |
| --- | --- |
| `bonfire_lit`, `bonfire_unlit` | feu de camp allumé / éteint |
| `chest_closed`, `chest_open` | coffres : Poké Ball classique fermée / ouverte (`pokeball.png`) |
| `pillar`, `pillar_<fx>` | piliers, par thème (`ice`, `stone`, `lava`, `moss`, `circuit`) |
| `torii_bell`, `pagoda_bell`, `shrine_bell`, `chapel_bell`, `fence_bell`, `ruin_bell` | décors Edo de la Tour Carillon (`edo_*.png`) : torii, pagodes, sanctuaires, chapelles, clôtures, piliers brisés (variante fixe par objet) |
| `tree_bell` | arbres de la Tour Carillon (`edo_trees.png`, 11 érables/cyprès recolorés carmin, variante fixe par objet) |
| `pillar_ice`, `crystal_ice`, `rock_ice` | piliers, cristaux et blocs de glace (`ice.png`, variantes fixes par objet avec `vary`) |

Champs : `file`, `fw`, `fh`, `frames` (indices), `fps`, `scale` (entier, pixels nets), `ax`/`ay` (ancrage 0..1), `oy`.
Les crédits sont à ajouter dans `showCredits` (js/ui.js) pour chaque pack utilisé.

Les feuilles `pokeball.png`, `campfire.png` et `ice.png` sont produites par `python3 tools/prepare_props.py`; les `edo_*.png` par `python3 tools/edo/build_edo.py SRC OUT assets/props` (sources : les planches de tilesets, hors dépôt) à partir de `tools/props_src/`.
