# Sprites de décor

Les feuilles PNG de décor vont ici ; `assets/props.json` décrit chaque entrée (voir `js/props.js`).

Clés reconnues (sinon le dessin procédural d'origine est utilisé) :

| Clé | Utilisation |
| --- | --- |
| `bonfire_lit`, `bonfire_unlit` | feu de camp allumé / éteint |
| `chest_closed`, `chest_open` | coffres : Poké Ball fermée / ouverte (Poké Ball classique uniquement) |
| `pillar`, `pillar_<fx>` | piliers, par thème (`ice`, `stone`, `lava`, `moss`, `circuit`) |
| `crystal`, `crystal_ice`, `rock_ice` | blocs et cristaux de glace |

Champs : `file`, `fw`, `fh`, `frames` (indices), `fps`, `scale` (entier, pixels nets), `ax`/`ay` (ancrage 0..1), `oy`.
Les crédits sont à ajouter dans `showCredits` (js/ui.js) pour chaque pack utilisé.
