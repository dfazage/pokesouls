# PokéSouls

Fan game **non commercial** : action-RPG souls-like en temps réel, pixel art sur un monde HD-2D.

**Chapitre 1 : Génération 1** · six cartes, trois starters, les oiseaux légendaires, un roi de Kanto, Mewtwo et Mew.

Jouer : https://dfazage.github.io/pokesouls/

## Le chapitre

Chaque chapitre correspond à une génération. Chaque chapitre compte six cartes, reliées par un portail (après le boss) et par un menu de téléportation.

| # | Carte | Boss | Gros mob |
|---|---|---|---|
| 1 | Îles Écume | Artikodin | Lokhlass |
| 2 | Centrale abandonnée | Électhor | Élektek |
| 3 | Mont Braise | Sulfura | Magmar |
| 4 | Route Victoire | Dracolosse (roi de Kanto) | Ronflex |
| 5 | Laboratoire oublié | Mewtwo | Électrode Alpha |
| 6 | Île Mystère | Mew | Noadkoko |

- **Équipe de trois** : au départ, vous choisissez un starter Feu, un Eau et un Plante parmi toutes les générations. Ils évoluent aux niveaux 16 et 36.
- **Monde** : mini mobs, mobs moyens, gros mob (mini-boss, donne un Super Bonbon).
- **Objets** : Super Bonbons (+1 niveau), baies, vitamines (PV Plus, Protéine, Fer, Calcium, Carbone, Zinc, 5 par Pokémon) et 16 CT qui donnent la capacité spéciale (touche L). Les coffres des cartes et les boss les donnent ; le sac (B) permet de les utiliser.
- **Téléportation** (M) : vers l'entrée de toute carte débloquée ou vers un feu allumé, sauf pendant un boss.

## Commandes

Page **Commandes** (écran titre ou Pause) : toutes les touches, clavier et souris, sont modifiables (3 cases par action), enregistrées dans le navigateur.

| Action | Par défaut | Manette |
|---|---|---|
| Déplacement | WASD / ZQSD / flèches | stick gauche |
| Course / Esquive | Maj / Espace | A |
| Attaque légère / lourde | J (clic gauche) / K (clic droit) | X / Y |
| Capacité spéciale (CT) | L | RB |
| Garde (parade juste après l'appui) | H | LB |
| Interagir | E | B |
| Baie de soin | R | croix haut |
| Verrouillage | T | clic stick droit |
| Changer de chef | Tab ou 1 à 3 | RT |
| Ordre des suiveurs (Focus / Garde / Repli) | C | LT |
| Carte / Sac | M / B | Select / croix bas |
| Pause | Échap | Start |

La manette n'a pas encore été testée.

## Développement

Site statique, sans build : `python3 -m http.server` puis ouvrir `http://localhost:8000/`.
Avec `?dev` : F1 invincible, F2 devant la brume du boss, F3 +1000 essence, F4 tue les ennemis proches, F5 boss à 27 %, F6 débloque tout.
`?autostart` saute l'écran titre.

Tous les chiffres (PV, dégâts, coûts) sont des valeurs de départ à équilibrer : voir `js/data.js`.
Les cartes sont dans `js/maps.js` (cartes 1, 2, 3, 4 et 6 générées avec une graine fixe, carte 5 dessinée à la main).

Les sprites sont préparés par `tools/fetch_sprites.py` et `tools/bake_sprites.py` à partir des feuilles de PMDCollab ; ils se chargent par espèce, au besoin.

## Crédits

- Sprites : [PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licence **CC BY-NC 4.0**. Merci à tous les artistes du projet (crédits par sprite dans le dépôt PMDCollab).
- Pokémon est une marque de Nintendo / Creatures Inc. / GAME FREAK inc. Ce projet n'est ni affilié ni approuvé par eux.
- Code et sons de synthèse : ce dépôt.

## Musique

Système de musique en place (`js/music.js`) : une piste par contexte (écran titre / feu de camp, choix du starter, cartes 1 à 6, gros mob, oiseaux, rois, Mewtwo phases 1 et 2, Mew), fondus de 1 s (0,5 s pour les boss), jingles feu / mort / victoire à lecture unique, volume « Musique » réglable dans Pause et dans Commandes, page Crédits.
Les fichiers OGG ne sont pas dans le dépôt : voir `assets/audio/music/README.md`. Sans fichier, le jeu reste silencieux.
