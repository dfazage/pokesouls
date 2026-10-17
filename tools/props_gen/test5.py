import sys; sys.path.insert(0, '.')
from engine import sheet_preview, set_pitch
import recipes_lab as R
S='/tmp/claude-0/-home-claude/31c44b16-209b-55f9-af76-107638ee7a1e/scratchpad/'
for p in ('hi','lo'):
    set_pitch(p)
    fr=[R.tank(False,0),R.tank(False,.5),R.tank(True,0),R.tank(True,.34),R.console('lab',0),R.console('lab',.4),R.console('plant',.2),R.mirror(0),R.mirror(.5),R.generator(0),R.generator(.3),R.generator(.6)]
    sheet_preview(fr, 4).save(S+f't5_{p}.png')
