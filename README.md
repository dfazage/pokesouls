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

- **Équipe de trois, un seul Pokémon en jeu** : au départ, vous choisissez un starter Feu, un Eau et un Plante parmi toutes les générations. Un seul est sur le terrain ; les deux autres attendent en réserve (ils ne combattent pas, ne subissent rien et ne se régénèrent pas). Relève avec Tab ou 1 à 3 : invulnérabilité brève, délai de 1,2 s avant la relève suivante, altérations d'état effacées. Si le Pokémon actif tombe K.O., le suivant entre automatiquement ; la partie est perdue quand les trois sont K.O. Ils évoluent aux niveaux 16 et 36.
- **Monde** : mini mobs, mobs moyens, gros mob (mini-boss, donne un Super Bonbon). Les mobs vaincus réapparaissent après 2 minutes environ, hors de l'écran (les gros mobs et les boss ne reviennent pas). Tout revient au repos à un feu.
- **Altérations d'état** : Brûlure (dégâts continus, −20 % de dégâts infligés), Poison (dégâts continus, ne tue pas), Gel (immobilisé 1,8 s), Paralysie (−40 % de vitesse, endurance plus lente), Confusion (déplacements et visées déviés). Certains ennemis, les boss et plusieurs CT les infligent ; les baies, Synthèse, Glas de Soin et le feu de camp les guérissent. Le gel et la confusion n'affectent pas les gros mobs ni les boss.
- **Fioles d'endurance (Huile)** : touche F, endurance pleine et CT rechargée (3 par défaut, rechargées au feu). Les coffres donnent des Huiles et des Huiles Max (+1 fiole).
- **Objets** : Super Bonbons (+1 niveau), Rappel (réveille un Pokémon K.O.), baies, vitamines (PV Plus, Protéine, Fer, Calcium, Carbone, Zinc, 5 par Pokémon) et 19 CT. Une CT n'est apprenable que par les bons Pokémon : selon le type (le deuxième type compte après évolution) et parfois un stade d'évolution minimal ; le sac affiche la compatibilité. Soins de zone : Soin et Synthèse (toute l'équipe, réserve comprise), Glas de Soin, Anneau Hydro (régénération). Le sac (B) montre l'équipe et permet d'utiliser les objets.
- **Animations d'attaque** : elles viennent des sprites PMDCollab de chaque Pokémon (Attack, Strike, Swing, Shoot, Rotate, Hop, Double, Kick…), choisies selon la nature de l'attaque.
- **Téléportation** (M) : vers l'entrée de toute carte débloquée ou vers un feu allumé, sauf pendant un boss.

- **Lien (ulti)** : une jauge se remplit en touchant, esquivant à la dernière seconde et parant. Pleine, la touche V (ou LB + RB) fait apparaître les deux autres Pokémon pendant 8 s : invulnérables, ils attaquent seuls (moitié de dégâts contre les boss). Ensuite ils reviennent à 85 % de leurs PV et le Pokémon actif est essoufflé 3 s (endurance et esquive pénalisées). La jauge repart de zéro ; un feu la remonte à moitié.
- **Combos** : léger, léger, lourd en moins de 0,5 s déclenche l'attaque signature du Pokémon (une par type et par stade d'évolution : Croix Ardente, Roue de Flammes, Grand Brasier, Jet Perforant, Tourbillon Marin, Déluge, Fouet Croisé, Tempête de Feuilles, Fléau Solaire). Elle coûte plus d'endurance, sans temps de recharge. Une parade relance le combo (riposte). Dégâts réduits contre les boss, effets de contrôle conservés.
- **Phases de boss** : écran animé à 60 % et 25 % des PV (un motif et un titre par boss), puis des obstacles et éléments de terrain apparaissent, toujours annoncés par un cercle au sol : piliers de glace et sol givré (Artikodin), pylônes qui attirent la foudre (Électhor), rochers de basalte et lave (Sulfura), chutes de rochers et rafales (Dracolosse), cristaux et zones de gravité (Mewtwo), ronces et fleurs de soin (Mew). Les obstacles bloquent aussi les tirs du boss ; le feu fait fondre la glace et brûle les ronces, l'eau éteint la lave.

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
| Fiole d'endurance (Huile) | F | LT |
| Lien (appeler les alliés) | V | LB + RB |
| Verrouillage | T | clic stick droit |
| Relève du Pokémon | Tab ou 1 à 3 | RT |
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
- Effets d'attaque : **Dämmerlicht BFX** de KotatsuAkira (crédit obligatoire) ; **PIPO Fire** de PIPOSCHPATZ (CC BY 4.0) ; **Water Cannon** d'Anton Chi. Planches dans `assets/fx/`, décrites par `assets/fx.json` et jouées par `js/fx.js`. En mode `?dev`, **F8 / F9** font défiler les effets devant le chef.
- Pokémon est une marque de Nintendo / Creatures Inc. / GAME FREAK inc. Ce projet n'est ni affilié ni approuvé par eux.
- Code et sons de synthèse : ce dépôt.

## Musique

Système de musique en place (`js/music.js`) : une piste par contexte (écran titre / feu de camp, choix du starter, cartes 1 à 6, gros mob, oiseaux, rois, Mewtwo phases 1 et 2, Mew), fondus de 1 s (0,5 s pour les boss), jingles feu / mort / victoire à lecture unique, volume « Musique » réglable dans Pause et dans Commandes, page Crédits.
Les fichiers OGG ne sont pas dans le dépôt : voir `assets/audio/music/README.md`. Sans fichier, le jeu reste silencieux.

## Musique

Une piste par contexte (menu, cartes, gros mobs, boss, jingles), fondus et boucles. Deux sources :
1. **YouTube** (reprises 8-bit, projet perso) : via l'API IFrame, deux lecteurs A/B pour les fondus ; configuration dans `assets/audio/music_map.json` (`youtube`, `start`, `end`, `fallback_audio`). Actif seulement en local (`localhost`) ; `?yt=1` / `?yt=0` force le choix. Les lecteurs restent visibles dans un coin (bouton ⇄ pour changer de coin), comme l'exigent les conditions de l'API. Une vidéo absente, privée ou non intégrable déclenche le repli et un message dans la console.
2. **Repli libre** (OpenGameArt, `assets/audio/music/`), seul utilisé sur le site publié. Le dossier facultatif `assets/audio/music_perso/` (ignoré par git) peut contenir des fichiers perso OGG prioritaires sur le repli.
Les jingles sont toujours des fichiers locaux. Rien ne démarre avant le premier clic. Volume musique réglable dans la page Commandes.
