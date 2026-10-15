# Liste les fichiers audio proposés par chaque page OpenGameArt (à lancer là où le réseau est ouvert).
import re, sys, urllib.request, urllib.parse, html
PAGES = {
 'hub_main': 'content/dark-shrine-loop',
 'menu_starter': 'content/the-hope',
 'map_1': 'content/laments-of-the-war',
 'map_2': 'content/mysterious',
 'map_3': 'content/forgoten-tomb-ambience',
 'map_4': 'content/dark-theme',
 'map_5': 'content/horror-atmosphere',
 'map_6': 'content/fantasy-choir-3-orchestral-pieces',
 'miniboss_a': 'content/sinister-boss-appears',
 'miniboss_b': 'content/dramatic-boss-encounter',
 'subboss_birds': 'content/boss-battle-2-symphonic-metal',
 'subboss_kings': 'content/boss-battle-music',
 'subboss_kings_alt': 'content/ancient-power-of-serpents',
 'boss_mewtwo_p1': 'content/colossal-boss-battle-theme',
 'boss_mewtwo_p2': 'content/dark-descent-extended-cut',
 'boss_mew': 'content/epic-endgame-cinematic',
 'jingle_campfire': 'content/cunning-plan-short-seamless-loop',
 'jingle_death': 'node/143357',
 'jingle_victory': 'content/victory-sting',
}
UA = {'User-Agent': 'Mozilla/5.0 (PokeSouls fan game asset fetch)'}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
if __name__ == '__main__':
    for k, p in PAGES.items():
        try:
            h = get('https://opengameart.org/' + p).decode('utf8', 'ignore')
            links = sorted(set(re.findall(r'href="(https://opengameart\.org/sites/default/files/[^"]+\.(?:ogg|mp3|wav|flac|zip))"', h)))
            t = re.search(r'<title>(.*?)</title>', h, re.S)
            lic = sorted(set(re.findall(r'creativecommons\.org/[a-z]+/[^"/]+/[0-9.]+|publicdomain/zero/1\.0', h)))
            print(k, '|', html.unescape(t.group(1).strip()) if t else '?', '|', lic)
            for l in links: print('   ', urllib.parse.unquote(l))
        except Exception as e:
            print(k, 'ERREUR', e)
