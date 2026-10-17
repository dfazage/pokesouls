import sys; sys.path.insert(0, '.')
from engine import sheet_preview
import recipes_edo as R
S='/tmp/claude-0/-home-claude/31c44b16-209b-55f9-af76-107638ee7a1e/scratchpad/'
fr=[R.tree('ember',0),R.tree('ember',1,.3),R.tree('mirror',0),R.tree('mirror',1,.5),R.tree('ilex',0),R.tree('ilex',2),R.tree('mystic',0),R.tree('mystic',1,.4)]
sheet_preview(fr, 4).save(S+'t3.png')
fr=[R.statue('ilex'),R.statue('mystic'),R.statue('mystic',t=.4),R.statue('storm'),R.statue('storm',t=.5)]
sheet_preview(fr, 6).save(S+'t3b.png')
