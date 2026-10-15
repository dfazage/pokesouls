# Télécharge les pistes depuis OpenGameArt, choisit un fichier par piste, convertit en OGG (ffmpeg) dans assets/audio/music.
import os, re, sys, subprocess, urllib.parse, zipfile, io, json, shutil
from oga_discover import PAGES, get
OUT = 'assets/audio/music'; TMP = '/tmp/oga'; os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
PICK = json.load(open('tools/music_picks.json')) if os.path.exists('tools/music_picks.json') else {}   # id -> sous-chaîne du nom de fichier voulu
EXT = ('.ogg', '.mp3', '.wav', '.flac'); RANK = {'.ogg': 0, '.flac': 1, '.wav': 2, '.mp3': 3}
def choose(cands, tid):
    want = PICK.get(tid)
    if want:
        m = [c for c in cands if want.lower() in c[0].lower()]
        if m: return m[0]
    loops = [c for c in cands if 'loop' in c[0].lower()]
    pool = loops or cands
    return sorted(pool, key=lambda c: (RANK[os.path.splitext(c[0])[1].lower()], -len(c[1])))[0]
report = []
for tid, page in PAGES.items():
    if len(sys.argv) > 1 and tid not in sys.argv[1:]: continue
    try:
        h = get('https://opengameart.org/' + page).decode('utf8', 'ignore')
        links = sorted(set(re.findall(r'href="(https://opengameart\.org/sites/default/files/[^"]+\.(?:ogg|mp3|wav|flac|zip))"', h)))
        cands = []
        for l in links:
            name = urllib.parse.unquote(l.rsplit('/', 1)[1]); data = get(l.replace(' ', '%20'))
            if name.lower().endswith('.zip'):
                z = zipfile.ZipFile(io.BytesIO(data))
                for zi in z.namelist():
                    if zi.lower().endswith(EXT) and not zi.startswith('__MACOSX'): cands.append((zi, z.read(zi)))
            else: cands.append((name, data))
        name, data = choose(cands, tid)
        src = os.path.join(TMP, tid + os.path.splitext(name)[1].lower()); open(src, 'wb').write(data)
        dst = os.path.join(OUT, tid + '.ogg')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-c:a', 'libvorbis', '-q:a', '3', '-ac', '2', dst], check=True)
        dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout.strip()
        report.append(f'{tid} OK <- {name} ({len(data)//1024} Ko) -> {os.path.getsize(dst)//1024} Ko, {float(dur):.0f} s | choix possibles: {[c[0] for c in cands]}')
    except Exception as e:
        report.append(f'{tid} ERREUR {e}')
open('tools/music_report.txt', 'w').write('\n'.join(report) + '\n'); print('\n'.join(report))
