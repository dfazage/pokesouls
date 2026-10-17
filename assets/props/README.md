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

### Sols, murs et décors de sol (`floor.png`, `floor_d.png`, `walls.png`, `assets/floor.json`)

Générés par `python3 tools/props_gen/build_floor.py [--preview DIR]` (peintre de tuiles `tilekit.py` : carte de hauteur, joints creux, occlusion, rampes décalées, tramage).
- `floor.png` / `floor_e.png` : tuiles de sol 24 px et masque d'émission (clé `<thème>:<rôle>` : `floor`, `lab`, `arena`, `s0` dalles, `s1` briques ou prairie, `s2` planches, `br` pont) ; plusieurs variantes pondérées (`pick`). `bakeFloor` les pose à la place du dessin procédural (repli si l'atlas manque).
- `floor_d.png` / `floor_de.png` : décors posés au sol (débris, flaques, os, pétales…, `decals`) et tronçons de câbles continus (`runs`), tamponnés par `stampFloorDecals` (graine fixe, jamais sous un décor, un coffre, l'arène ni un pont).
- `walls.png` / `walls_e.png` : 9 tuiles par thème (4 faces, porte, 4 dessus) lues par `makeWallTextures`.
Les anciens sprites externes `tree_bell`, `torii_bell`, `pillar_{ice,lava,plant,lab}`, `crystal_ice`, `rock_ice`, `bonfire_*` sont remplacés par des versions `decor.png` à deux inclinaisons (`obs_basalt` et les coffres gardent leurs feuilles d'origine).

## Identité des zones (`js/zones.js`)
Chaque zone nommée des 10 cartes a un profil : `tint` (voile de couleur fondu entre zones, posé avant les décalques), `t` (poids des variantes de tuile du sol), `d` (poids des décalques), `dens`/`runs` (densité des décalques / câbles) et `decor` (types de décor solide, appliqués à la génération sauf si la zone en fixe déjà). Ajouter une zone = ajouter une entrée dans `ZONES[<id carte>][<nom>]` ; sans entrée, la zone garde le rendu de base.

## Maisons d'Edo en 3D texturé (`house_tex.py`)
Les maisons du pourtour des cartes ouvertes restent des modèles 3D instanciés (`geoEdoHouse` dans `js/hd2d_world.js` : socle, rez, auvent, étage, grand toit en croupe à rives relevées, faîtage, onigawara). Leur aspect vient d'un atlas pixel art (`assets/props/house.png` albédo + `house_e.png` : R = vitres émissives, G = masque plâtre teinté par instance) lu par `HOUSE_VERT/HOUSE_FRAG` (`js/hd2d_shaders.js`) : UV en unités d'objet × échelle de l'instance, donc 1 pixel = 1/24 de tuile. Sans atlas, repli sur l'ancien shader procédural.
Régénérer : `python3 tools/props_gen/house_tex.py && python3 tools/props_gen/build_floor.py` (le second écrit les noms de fichiers dans `assets/floor.json`).

## Forêt d'Ilex en 3D texturé (`forest_tex.py`)
Arbres et buissons de la bordure de la Forêt d'Ilex : modèles 3D instanciés (`geoForest` : tronc effilé + couronne de blobs ; buisson = blobs bas), texturés par `assets/props/forest.png` (feuillage en gris teinté par la palette de l'instance, écorce en couleur) via `TREE_FRAG` : feuillage en projection triplanaire monde (24 px par tuile), reflets dorés et pollen lumineux. Sans atlas, repli sur l'ancien arbre à cônes.
Régénérer : `python3 tools/props_gen/forest_tex.py && python3 tools/props_gen/build_floor.py`.

## Décors 3D d'Edo (`decor3d_tex.py`, `js/hd2d_decor.js`)
Lanternes de pierre, torii, cloches et arbres des cartes Carillon / Brûlée / Miroir / Ilex ne sont plus des sprites (billboards) mais des modèles 3D instanciés : ils tournent avec la caméra (pivot ±45°) comme les maisons. Atlas 144×24 (cellules 24×24 : pierre, laque, bois sombre, bronze, bois clair, face de lanterne) + masque d'émission (flamme). Pierre, laque et bronze sont en gris, teintés par thème (`LOOK` dans `hd2d_decor.js`). Le shader (`DECOR_VERT/FRAG`) lit la carte de lumière du jeu ; la flamme vacille, la cloche oscille. Les arbres réutilisent `geoForest` + `forest.png` avec les couleurs `leaf` du thème (érables par défaut). Emprise et collisions restent celles de la grille ; `collectDrawList(g, inView, skipKinds)` n'émet plus ces sprites. Les autres types (braseros, statues, rochers, cristaux, piliers, machines…) restent des sprites pour l'instant, et les cartes Îles Tourbillon / Île Mystère aussi. Repli : sans `decor3d.png` ou `forest.png`, tout redevient sprite.
Régénérer : `python3 tools/props_gen/decor3d_tex.py` (les noms de fichiers sont dans `assets/floor.json`, clés `d3file` / `d3efile`, écrites par `build_floor.py`).
