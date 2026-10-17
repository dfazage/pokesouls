import sys; sys.path.insert(0, '.')
from engine import sheet_preview
import recipes_stone as R
S='/tmp/claude-0/-home-claude/31c44b16-209b-55f9-af76-107638ee7a1e/scratchpad/'
fr=[R.brazier('lava',0),R.brazier('lava',.3),R.brazier('stone',.6),R.brazier('ember',.2),R.rock('lava',0),R.rock('lava',1,.4),R.rock('stone',0),R.rock('mirror',0),R.rock('mirror',1,.5),R.rock('storm',0),R.rock('storm',1,.5)]
sheet_preview(fr, 5).save(S+'t4.png')
fr=[R.crystal('lava',0),R.crystal('lava',1,.4),R.crystal('storm',0),R.crystal('mystic',1,.3),R.pillar('stone',0),R.pillar('stone',1),R.pillar('storm',0,.3),R.pillar('storm',1)]
sheet_preview(fr, 5).save(S+'t4b.png')
