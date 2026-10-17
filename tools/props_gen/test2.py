import sys; sys.path.insert(0, '.')
from engine import sheet_preview
import recipes_edo as R
S='/tmp/claude-0/-home-claude/31c44b16-209b-55f9-af76-107638ee7a1e/scratchpad/'
fr=[R.bell('bell',0),R.bell('bell',.25),R.bell('ember',0),R.torii('bell'),R.torii('ember',.3),R.torii('mirror'),R.torii('ilex')]
sheet_preview(fr, 5).save(S+'t2.png')
