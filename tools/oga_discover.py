# Liste les fichiers audio proposés par chaque page OpenGameArt (à lancer là où le réseau est ouvert).
import re, sys, urllib.request, urllib.parse, html
PAGES = {
 'hub_main': 'node/18078', 'menu_starter': 'node/87933', 'map_1': 'content/chiptune-exploration', 'map_2': 'node/111300', 'map_3': 'node/87564',
 'map_4': 'node/95325', 'map_5': 'node/32900', 'map_6': 'node/137421', 'miniboss_a': 'node/140852', 'miniboss_b': 'node/86839',
 'subboss_birds': 'node/178920', 'subboss_kings': 'node/137167', 'subboss_kings_alt': 'node/100781', 'boss_mewtwo_p1': 'node/114175',
 'boss_mewtwo_p2': 'node/69034', 'boss_mew': 'content/final-stand-0', 'jingle_campfire': 'content/cunning-plan-short-seamless-loop',
 'jingle_death': 'node/143357', 'jingle_victory': 'content/victory-sting',
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
