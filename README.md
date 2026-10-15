# PokéSouls

Fan game **non commercial** : action-RPG souls-like en temps réel, équipe de six Pokémon-classes, pixel art sur un monde HD-2D.

**Première version jouable : Monde IV, Le Laboratoire oublié** (boss : Mewtwo).
Explorer le laboratoire, allumer les feux, ouvrir le raccourci, vaincre l'Électrode Alpha, puis franchir la brume du Sanctuaire.

Jouer : https://dfazage.github.io/pokesouls/

## Commandes

| Action | Clavier | Manette |
|---|---|---|
| Déplacement | WASD / ZQSD / flèches | stick gauche |
| Course | Maj | A (maintenu) |
| Esquive | Espace | A |
| Attaque légère / lourde | J (clic gauche) / K (clic droit) | X / Y |
| Capacité | L | RB |
| Garde (parade juste après l'appui) | H | LB |
| Interagir | E | B |
| Baie de soin | R | croix haut |
| Verrouillage | T | clic stick droit |
| Changer de chef | Tab ou 1 à 6 | RT |
| Ordre des suiveurs (Focus / Garde / Repli) | C | LT |
| Pause | Échap | Start |

La manette n'a pas encore été testée.

## Règles de base

- Six Pokémon, un seul chef à la fois ; les cinq autres suivent et combattent selon l'ordre donné.
- Un Pokémon à 0 PV est épuisé. Quand les six sont épuisés, vous mourez : l'essence est laissée en Souvenir à l'endroit de la mort.
- Les feux de camp soignent, rechargent les baies, font revenir les ennemis et permettent de monter les niveaux (coût 80 × 1,13^niveau).
- Mewtwo : trois phases (seuils à 60 % et 25 %). Les valeurs (PV, dégâts, niveau de départ 10) sont des valeurs de départ à équilibrer.

## Développement

Site statique, sans build : `python3 -m http.server` puis ouvrir `http://localhost:8000/`.
Avec `?dev` : F1 invincible, F2 devant la brume du boss, F3 +1000 essence, F4 tue les ennemis proches, F5 Mewtwo à 27 %.
`?autostart` saute l'écran titre.

Les sprites sont préparés par `tools/bake_sprites.py` à partir des feuilles brutes de PMDCollab (voir ci-dessous) :
`python3 -I tools/bake_sprites.py <dossier_brut> assets`.

## Crédits

- Sprites : [PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licence **CC BY-NC 4.0**. Merci à tous les artistes du projet (crédits par sprite dans le dépôt PMDCollab).
- Pokémon est une marque de Nintendo / Creatures Inc. / GAME FREAK inc. Ce projet n'est ni affilié ni approuvé par eux.
- Code et sons de synthèse : ce dépôt.
