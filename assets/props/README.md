# Sprites de décor

Les feuilles PNG de décor vont ici ; `assets/props.json` décrit chaque entrée (voir `js/props.js`).

Clés reconnues (sinon le dessin procédural d'origine est utilisé) :

| Clé | Utilisation |
| --- | --- |
| `bonfire_lit`, `bonfire_unlit` | feu de camp allumé / éteint |
| `chest_closed`, `chest_open` | coffres : Poké Ball classique fermée / ouverte (`pokeball.png`) |
| `pillar`, `pillar_<fx>` | piliers, par thème (`ice`, `stone`, `lava`, `moss`, `circuit`) |
| `torii_bell` | torii de la Tour Carillon (`edo_torii.png`, 2 variantes lie-de-vin/ardoise, variante fixe par objet) |
| `tree_bell` | arbres de la Tour Carillon (`edo_trees.png`, 11 érables/cyprès recolorés carmin, variante fixe par objet) |
| `pillar_ice`, `crystal_ice`, `rock_ice` | piliers, cristaux et blocs de glace (`ice.png`, variantes fixes par objet avec `vary`) |

Champs : `file`, `fw`, `fh`, `frames` (indices), `fps`, `scale` (entier, pixels nets), `ax`/`ay` (ancrage 0..1), `oy`.
Les crédits sont à ajouter dans `showCredits` (js/ui.js) pour chaque pack utilisé.

Les feuilles `pokeball.png`, `campfire.png` et `ice.png` sont produites par `python3 tools/prepare_props.py`; les `edo_*.png` par `python3 tools/edo/build_edo.py SRC OUT assets/props` (sources : les planches de tilesets, hors dépôt) à partir de `tools/props_src/`.

## Props dessinés au code (`decor.png`)

34 sprites pixel-art générés par `python3 tools/props_gen/build.py` (moteur maison dans `tools/props_gen/engine.py`, recettes `recipes_*.py`). Le script réécrit `decor.png` et fusionne les entrées dans `props.json`.

Clés : `lantern_{bell,ember,mirror,ilex}`, `bell_{bell,ember}`, `torii_{ember,mirror,ilex}`, `tree_{ember,mirror,ilex,mystic}`, `statue_{ilex,mystic,storm}`, `brazier_{lava,stone,ember}`, `rock_{lava,stone,mirror,storm}`, `crystal_{lava,storm,mystic}`, `pillar_{stone,storm}`, `tank`, `tankbroken`, `console_{lab,plant}`, `mirror`, `generator`.

Champs supplémentaires : `x0`/`y0` (origine dans l'atlas), `per` (images d'animation par variante ; avec `vary` la variante vient de la graine, l'animation du temps), `lo` (`{x0,y0}` : même mise en page dessinée pour la caméra basse ~22°). `drawProp` fond hi (40°) → lo selon `PROPS.pitch` (écrit par `render3d`), `k = clamp((40-pitch)/16, 0, 1)`.
`--preview DIR` produit des planches de contrôle.
