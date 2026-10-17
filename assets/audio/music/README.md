# Musiques

Déposer ici un fichier OGG par piste, nommé avec l'ID en minuscules (voir `js/music.js`, table `TRACKS`) :

intro_title, menu_starter, map_1 … map_6, map_j1 … map_j5, miniboss_a, miniboss_b, subboss_birds (+ _p2), subboss_kings (+ _p2), subboss_kings_alt, boss_raikou, boss_entei, boss_suicune (+ _p2), boss_lugia_p1, boss_lugia_p2,
boss_mewtwo_p1, boss_mewtwo_p2, boss_mew, jingle_death, jingle_victory (tous en `.ogg`).

Conversion : `ffmpeg -i source.mp3 -c:a libvorbis -q:a 4 menu_starter.ogg`.
Les boucles doivent être découpées au bon endroit dans le fichier (le moteur boucle sans coupure, mais ne détecte pas le point de boucle).
Une piste absente est simplement ignorée : le jeu continue sans musique.
