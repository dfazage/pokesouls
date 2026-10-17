# PokéSouls

Fan game **non commercial** : action-RPG souls-like en temps réel, pixel art sur un monde HD-2D.

**Chapitre 1 : Génération 1** · quatre cartes et une carte secrète, trois compagnons, les oiseaux légendaires, un roi de Kanto, Mewtwo et Mew.

Jouer : https://dfazage.github.io/pokesouls/

## Quête secrète : Fala et la réserve du feu

Un Genesect nommé **Fala** dort dans une salle cachée de la Lisière de la Centrale abandonnée (carte 2) : un « ? » flotte sur un mur qui scintille, un coup porté près de lui dissipe le faux mur. Fala demande de retrouver ses quatre **Modules** (Aqua, Pyro, Cryo, Choc), éparpillés dans quatre zones de la carte (sans marqueur : sa plaque « chauffe » à l'approche, la lueur du Module grandit). Chaque Module rapporté donne un petit objet. Le journal des quêtes est dans l'onglet **Quêtes** du menu Équipe.

La quête terminée, **Fala rejoint la réserve du feu** : à chaque feu de camp, le bouton **Réserve** permet de l'échanger gratuitement contre l'un des trois compagnons. Celui qui sort garde niveau, vitamines et CT. Le Module équipé (Aqua, Pyro, Cryo ou Choc, changeable à la réserve ou au feu) donne l'élément de l'attaque de relais de Fala. Tout est dans la sauvegarde de la partie : une nouvelle partie recommence la quête. Les autres cartes pourront accueillir un Pokémon bonus (`EXTRA_BY_MAP` dans `js/reserve.js`).
Code : `js/fala.js` (quête, dialogues), `js/reserve.js` (réserve, échange), génération de la cellule secrète dans `js/maps.js` (`generateFree`, `openSecret`).

## Le chapitre

Chaque chapitre correspond à une génération. Les cartes sont des zones ouvertes (cavernes ou cours organiques reliées par de larges passages, boucles, un raccourci qui s'ouvre de l'autre côté, un seul passage de brume), générées avec une graine fixe ; seul le Laboratoire oublié de Kanto est dessiné à la main. Chaque chapitre compte quatre cartes et une carte secrète (qui n'apparaît qu'après le boss final), reliées par une carte du monde de téléportation.

| # | Carte | Boss | Gros mob |
|---|---|---|---|
| 1 | Îles Écume | Artikodin | Lokhlass |
| 2 | Centrale abandonnée | Électhor | Élektek |
| 3 | Mont Braise | Sulfura | Dracolosse (mini-boss, roi de Kanto) |
| 4 | Laboratoire oublié | Mewtwo (boss final) | Électrode Alpha |
| Secret | Île Mystère | Mew | Noadkoko |

**Chapitre II : Johto** (en construction, direction artistique Japon d'Edo, une sauvegarde par chapitre). Cartes prévues : Tour Carillon (Raikou, jouable), Tour Brûlée (Entei), Lac du Miroir (Suicune), Îles Tourbillon (Lugia, boss final), Forêt d'Ilex (Celebi, secret). Pour tester en développement : `?dev&autostart&chapter=johto`.

- **Équipe de trois, un seul Pokémon en jeu** : au départ, vous choisissez trois compagnons libres parmi 39 lignées, rangées en quatre gabarits (Assaut, Rempart, Distance, Soutien, `js/pool.js`). Le gabarit fixe le style de combat, le type fixe l'élément. Un seul est sur le terrain ; les deux autres attendent en réserve (ils ne combattent pas, ne subissent rien et ne se régénèrent pas). Relève avec Tab ou 1 à 3 : invulnérabilité brève, délai de 1,2 s avant la relève suivante, altérations d'état effacées. Si le Pokémon actif tombe K.O., le suivant entre automatiquement ; la partie est perdue quand les trois sont K.O. Ils évoluent aux niveaux 16 et 36.
- **Tutoriel de combat** : à la première partie, une zone d'entraînement avec un mannequin (`js/tutorial.js`). Dix étapes, chacune validée par l'action du joueur : course, coups léger et lourd, esquive juste, parade, combo signature, CT, relais, Lien, baie, verrouillage. Le bouton « Passer » est toujours là ; l'état est enregistré dans la sauvegarde (`tut`). Les parties existantes ne le lancent pas.
- **Monde** : mini mobs, mobs moyens, gros mob (mini-boss, donne un Super Bonbon). Les mobs vaincus réapparaissent après 2 minutes environ, hors de l'écran (les gros mobs et les boss ne reviennent pas). Tout revient au repos à un feu.
- **Fins de chapitre** (`js/outro.js`, `js/endings.js`) : le boss final (Mewtwo, Lugia) s'affaisse et s'accroupit, dialogue, cendres, puis panneau « Suivre l'appel / Rester » menant à la carte secrète. Le boss secret (Mew, Celebi) donne un épilogue, l'écran FIN (temps de jeu, défaites, niveau moyen) et le retour au menu principal ; une pastille « Fin secrète » apparaît ensuite sur l'écran titre. Le Cycle+ n'est pas implémenté.
- **Altérations d'état** : Brûlure (dégâts continus, −20 % de dégâts infligés), Poison (dégâts continus, ne tue pas), Gel (immobilisé 1,8 s), Paralysie (−40 % de vitesse, endurance plus lente), Confusion (déplacements et visées déviés). Certains ennemis, les boss et plusieurs CT les infligent ; les baies, Synthèse, Glas de Soin et le feu de camp les guérissent. Le gel et la confusion n'affectent pas les gros mobs ni les boss.
- **Fioles d'endurance (Huile)** : touche F, endurance pleine et CT rechargée (3 par défaut, rechargées au feu). Les coffres donnent des Huiles et des Huiles Max (+1 fiole).
- **Objets** : Super Bonbons (+1 niveau), Rappel (réveille un Pokémon K.O.), baies, vitamines (PV Plus, Protéine, Fer, Calcium, Carbone, Zinc, 5 par Pokémon) et 19 CT. Une CT n'est apprenable que par les bons Pokémon : selon le type (le deuxième type compte après évolution) et parfois un stade d'évolution minimal ; le sac affiche la compatibilité. Soins de zone : Soin et Synthèse (toute l'équipe, réserve comprise), Glas de Soin, Anneau Hydro (régénération). Le sac (B) montre l'équipe et permet d'utiliser les objets.
- **Animations d'attaque** : elles viennent des sprites PMDCollab de chaque Pokémon (Attack, Strike, Swing, Shoot, Rotate, Hop, Double, Kick…), choisies selon la nature de l'attaque.
- **Téléportation** (M) : vers l'entrée de toute carte débloquée ou vers un feu allumé, sauf pendant un boss.

- **Lien (ulti)** : une jauge se remplit en touchant, esquivant à la dernière seconde et parant. Pleine, la touche V (ou LB + RB sur manette) fait apparaître les deux autres Pokémon pendant 8 s : invulnérables, ils attaquent seuls (moitié de dégâts contre les boss). Ensuite ils reviennent à 85 % de leurs PV et le Pokémon actif est essoufflé 3 s (endurance et esquive pénalisées). La jauge repart de zéro ; un feu la remonte à moitié.
- **Combos** : léger, léger, lourd en moins de 0,65 s déclenche l'attaque signature du Pokémon (une par type et par stade d'évolution : Croix Ardente, Roue de Flammes, Grand Brasier, Jet Perforant, Tourbillon Marin, Déluge, Fouet Croisé, Tempête de Feuilles, Fléau Solaire). Elle coûte plus d'endurance, sans temps de recharge. Une parade relance le combo (riposte). Dégâts réduits contre les boss, effets de contrôle conservés.
- **Entrée de boss** : l'arène se trouve toujours au nord de la dernière zone et s'aborde de face, par le sud, à travers la brume. Une cinématique d'environ 10 s (caméra qui se rapproche, éveil propre à chaque boss, carton-titre) précède le combat ; elle se passe avec la touche d'interaction, et elle est rejouée en entier à chaque tentative, après une défaite aussi.
- **Phases de boss** : écran animé à 60 % et 25 % des PV (un motif et un titre par boss), puis des obstacles et éléments de terrain apparaissent, toujours annoncés par un cercle au sol : piliers de glace et sol givré (Artikodin), pylônes qui attirent la foudre (Électhor), rochers de basalte et lave (Sulfura), chutes de rochers et rafales (Dracolosse), cristaux et zones de gravité (Mewtwo), ronces et fleurs de soin (Mew). Les obstacles bloquent aussi les tirs du boss ; le feu fait fondre la glace et brûle les ronces, l'eau éteint la lave.

## Moteur d'éléments (branche `feature/moteur-elements`)

Le monde réagit aux types (code dans `js/elements.js`, valeurs de départ à équilibrer) :

- **Table des types modérée** : ×1,25 / ×1 / ×0,8 sur les dégâts, dans les deux sens. Les ennemis et boss ont des types (`ENEMY_TYPES`, `BOSS_TYPES`). Les icônes ▲/▼ sur le portrait de l'équipe donnent l'avantage contre la cible la plus proche.
- **Marques** : chaque coup élémentaire pose une marque (Trempé, Enflammé, Givré, Chargé, Enraciné, Toxique), 2 au maximum par cible. Un coup compatible déclenche une **réaction** : Conduction (Trempé + Électrik, ou Chargé + Eau), Gel net, Vapeur, Embrasement, Fumées, Fonte, Fragilisation, Isolation. Le portrait de l'équipe s'illumine quand un Pokémon peut en déclencher une.
- **Surfaces de terrain** : flaques (conduisent l'électricité), feu au sol, vapeur (aveugle), nuage toxique.
- **Boss** : Électhor entretient une aura Chargée (l'eau ou la terre la contredit), Sulfura une aura de feu (l'eau l'éteint), Artikodin une carapace de glace (le feu la brise). Un indice de lore s'affiche à l'entrée.
- **Relais** : changer de Pokémon juste après une esquive juste ou une parade déclenche l'**attaque d'entrée** propre à la lignée du nouvel arrivant (`js/relay.js`, 39 lignées). Elle pose la marque de son élément, donc les réactions s'enchaînent. Deux Pokémon du même type en **résonance** : attaque x1,25. Le relais ajoute 8 s au Lien. Les anciennes sauvegardes (Feu, Eau, Plante) sont converties automatiquement.

Les ennemis en retour : l'eau trempe l'équipe, l'électricité frappe plus fort un Pokémon trempé.

## Jouer sur téléphone (PWA)

Le jeu s'installe comme une application et se joue au toucher, téléphone en **mode paysage**.

- **Android (Chrome)** : ouvrir le site, puis « Installer l'app » sur l'écran titre (ou menu ⋮ ▸ Installer l'application).
- **iPhone / iPad (Safari)** : bouton Partager ▸ « Sur l'écran d'accueil ».
- **Commandes tactiles** : stick flottant dans la moitié gauche de l'écran ; à droite Coup, Lourd, Esquive (maintenue : course), CT, Garde, Lien, Relève, Baie, Huile, Agir, Cible ; en haut Pause, Sac, Carte. Toucher un portrait en haut à droite appelle ce Pokémon.
- **Hors ligne** : le code est mis en cache ; sprites, effets et musiques le sont au fil du jeu (ce qui a déjà été joué reste disponible sans réseau).
- La partie se met en pause si l'app passe en arrière-plan ou si l'écran est tourné en portrait. L'écran reste allumé pendant la partie.
- `?touch=1` force l'affichage des commandes tactiles (test sur ordinateur), `?touch=0` le masque.
- Code : `manifest.webmanifest`, `sw.js` (service worker, changer `VERSION` pour vider les caches), `js/touch.js`, icônes dans `assets/icons/`.

## Commandes

Page **Commandes** (écran titre ou Pause) : toutes les touches, clavier et souris, sont modifiables (3 cases par action), enregistrées dans le navigateur.

| Action | Par défaut | Manette |
|---|---|---|
| Déplacement | WASD / ZQSD / flèches | stick gauche |
| Course / Esquive | Maj / Espace | A (maintenu = course) |
| Attaque légère / lourde | J (clic gauche) / K (clic droit) | Y / X |
| Capacité spéciale (CT) | L | L |
| Garde (parade juste après l'appui) | H | ZR (maintenu) |
| Interagir | E | B |
| Baie de soin | R | R maintenu + X |
| Super Bonbon (Pokémon actif) | C | R maintenu + Y |
| Fiole d'endurance (Huile) | F | R maintenu + A |
| Rappel (relève un Pokémon épuisé) | G | R maintenu + B |
| Lien (appeler les alliés) | V | clic stick gauche |
| Verrouillage / changer de cible | T | clic stick droit / stick droit gauche-droite |
| Relève du Pokémon | Tab ou 1 à 3 | ZL |
| Carte / Sac | M / B | − / croix haut |
| Pause | Échap | + |

Libellés de la disposition Nintendo Switch ; Xbox et PlayStation suivent les mêmes positions (A = bas, B = droite, X = gauche, Y = haut côté Xbox). Maintenir R transforme les boutons de face en objets rapides (X baie, Y bonbon, A Éther, B Rappel) ; les emplacements du HUD s'éclairent pendant que R est tenu. Un schéma de la manette est affiché dans l'écran Commandes.

La manette n'a pas encore été testée.

## Rendu HD-2D

Le jeu est affiché en **HD-2D** : la même logique de jeu, les mêmes sprites pixel (PMDCollab) et les mêmes cartes, mais projetés dans un décor 3D vu de haut en perspective (caméra fixe, haut de l'écran = nord, les commandes ne changent pas).

- **Décor** : sol et murs en 3D (murs hauts au nord, parapets au sud, côtés intermédiaires), portes de boss en blocs, brume de boss animée. Les textures de sol viennent du moteur 2D (`bakeFloor`), les murs ont des textures par thème (briques, panneaux, tuyaux, filons de lave, givre, mousse…) avec un masque d'émission qui pulse.
- **Fonds** : chaque carte a son abîme sous le sol, visible au-delà des murs : aurores et cristaux (glace), fosse métallique et tours éclairées (centrale), lac de lave et colonnes de basalte (volcan), brume et stalagmites (roche), vide étoilé et monolithes flottants (laboratoire), brume bioluminescente et arbres (île mystère). Particules d'ambiance par thème (neige, braises, étincelles, poussière, lucioles).
- **Caméra de duel** : pendant un combat de boss, la caméra passe de l'exploration (40°, distance 13,5) à une vue presque « troisième personne » propre à chaque boss (environ 20 à 24°, distance 10 à 14), en environ 2 s ; l'intro du boss se termine exactement sur ce réglage et la caméra revient à l'exploration quand le boss tombe. Réglages par boss dans `BOSS_CAM` (`js/bosscine.js`) : tangage, distance, champ, hauteur visée, décalage vers le boss. Ne pas descendre sous ~19° : les zones d'attaque au sol s'aplatissent trop. Le pivot ±45° du stick droit reste actif.
- **Entrée des boss** : toutes les arènes (Kanto et Johto) s'abordent de face, par le sud vers le nord ; la brume est toujours dans l'axe nord (zone d'antichambre juste sous l'arène).
- **Sprites** : chaque objet (Pokémon, décors, feux, coffres…) est dessiné par les fonctions 2D existantes dans un atlas, puis posé comme billboard orienté vers la caméra ; ombres et effets au sol sont projetés sur le sol, les effets aériens, projectiles, particules et textes sur un calque écran.
- **Lumière** : la carte de lumière du moteur 2D est projetée sur le sol, les murs et les sprites. Post-traitement : tilt-shift, bloom, étalonnage par thème, vignette, grain léger.
- **Lisibilité** : les murs qui masquent le chef se dissolvent en tramage autour de lui ; qualité adaptative (la résolution de rendu baisse toute seule si l'image est trop lente).

`?2d` force l'ancien rendu 2D ; sans WebGL2, ou en cas d'erreur, le jeu retombe automatiquement dessus. **Maj + F8** bascule entre les deux en cours de partie.
Code : `js/render3d.js` (caméra, sprites, lumière, post-traitement), `js/hd2d_world.js` (terrain, textures, fonds, particules), `js/hd2d_shaders.js` (shaders). Le réglage de caméra (`CFG` dans `render3d.js` : inclinaison, distance, champ) est une valeur de départ à ajuster.

## Développement

Site statique, sans build : `python3 -m http.server` puis ouvrir `http://localhost:8000/`.
Avec `?dev` : F1 invincible, F2 devant la brume du boss, F3 +1000 essence, F4 tue les ennemis proches, F5 boss à 27 %, F6 débloque tout.
`?autostart` saute l'écran titre. `?2d` force le rendu 2D classique (voir « Rendu HD-2D »).

Tous les chiffres (PV, dégâts, coûts) sont des valeurs de départ à équilibrer : voir `js/data.js`.
Les cartes sont dans `js/maps.js` (cartes 1, 2, 3, 4 et 6 générées avec une graine fixe, carte 5 dessinée à la main).

Les sprites sont préparés par `tools/fetch_sprites.py` et `tools/bake_sprites.py` à partir des feuilles de PMDCollab ; ils se chargent par espèce, au besoin.

## Crédits

- Sprites : [PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licence **CC BY-NC 4.0**. Merci à tous les artistes du projet (crédits par sprite dans le dépôt PMDCollab).
- Effets d'attaque : planches pixel art de **PMDCollab / Pokémon Mystery Dungeon** (`RawAsset/Particle`, projet de fan non commercial), copiées dans `assets/fx/pmd/` par `tools/build_pmd_fx.py` ; elles sont affichées au plus proche voisin, à échelle entière, sans fusion additive. Repli sur **Dämmerlicht BFX** de KotatsuAkira (crédit obligatoire) ; **PIPO Fire** de PIPOSCHPATZ (CC BY 4.0) ; **Water Cannon** d'Anton Chi. Planches dans `assets/fx/`, décrites par `assets/fx.json` et jouées par `js/fx.js`. En mode `?dev`, **F8 / F9** font défiler les effets devant le chef.
- Musique de repli (OpenGameArt) : **Matthew Pablo** (http://www.matthewpablo.com), CC BY 3.0, *Colossal Boss Battle Theme* et *Dark Descent* (crédit obligatoire) ; autres pistes CC0 (TAD, qubodup, Cethiel, nene, kindland, JaggedStone, SubspaceAudio, cesisco, cynicmusic, josepharaoh99, congusbongus). Liste complète dans la page Crédits.
- Cris des boss : dépôt **PokeAPI/cries** (https://github.com/PokeAPI/cries). Les cris appartiennent à Nintendo / Game Freak ; usage fan non commercial.
- Pokémon est une marque de Nintendo / Creatures Inc. / GAME FREAK inc. Ce projet n'est ni affilié ni approuvé par eux.
- Rendu HD-2D : [three.js](https://threejs.org/) (licence MIT), embarqué dans `js/vendor/`.
- Code et sons de synthèse : ce dépôt.

## Musique

Système de musique en place (`js/music.js`) : une piste par contexte (écran titre, feu de camp, choix du starter, cartes 1 à 6, gros mob, oiseaux, rois, Mewtwo phases 1 et 2, Mew), fondus de 1 s (0,5 s pour les boss), jingles feu / mort / victoire à lecture unique, volume « Musique » réglable dans Pause et dans Commandes, page Crédits.
Les fichiers OGG ne sont pas dans le dépôt : voir `assets/audio/music/README.md`. Sans fichier, le jeu reste silencieux.

## Musique

Une piste par contexte (menu, cartes, gros mobs, boss, jingles), fondus et boucles. Configuration dans `assets/audio/music_map.json` (`start`, `end`, `fallback_audio`). Pistes libres d'OpenGameArt dans `assets/audio/music/` (voir la page Crédits), plus l'intro de l'écran titre. Le dossier facultatif `assets/audio/music_perso/` (ignoré par git) peut contenir des fichiers perso OGG, prioritaires sur ces pistes. La lecture YouTube a été retirée ; les OST originales sont à régler plus tard.
Les jingles sont toujours des fichiers locaux. Rien ne démarre avant le premier clic. Volume musique réglable dans la page Commandes.
