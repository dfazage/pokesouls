# Musiques

Déposer ici un fichier OGG par piste, nommé avec l'ID en minuscules (voir `js/music.js`, table `TRACKS`) :

hub_main, menu_starter, map_1 … map_6, miniboss_a, miniboss_b, subboss_birds, subboss_kings, subboss_kings_alt,
boss_mewtwo_p1, boss_mewtwo_p2, boss_mew, jingle_campfire, jingle_death, jingle_victory (tous en `.ogg`).

Conversion : `ffmpeg -i source.mp3 -c:a libvorbis -q:a 4 hub_main.ogg`.
Les boucles doivent être découpées au bon endroit dans le fichier (le moteur boucle sans coupure, mais ne détecte pas le point de boucle).
Une piste absente est simplement ignorée : le jeu continue sans musique.
