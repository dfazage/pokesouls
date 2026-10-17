import sys; sys.path.insert(0, '.')
from engine import sheet_preview
import recipes_edo as R
S='/tmp/claude-0/-home-claude/31c44b16-209b-55f9-af76-107638ee7a1e/scratchpad/'
fr=[R.lantern(p, t/4) for p in ('bell','ember','mirror','ilex') for t in (0,1)]
sheet_preview(fr, 7).save(S+'t1.png')
