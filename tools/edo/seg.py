import sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
def load(path):
    a=np.array(Image.open(path).convert('RGBA'))
    # ombres cuites : noir semi-transparent
    sh=(a[...,3]>0)&(a[...,3]<=110)&(a[...,:3].max(axis=2)<=24)
    a[sh]=0
    return a
def comps(a, region, dil=2, min_area=60):
    x0,y0,x1,y1=region; sub=a[y0:y1,x0:x1]
    m=sub[...,3]>0
    lab,n=ndi.label(ndi.binary_dilation(m,iterations=dil),structure=np.ones((3,3)))
    out=[]
    for i,sl in enumerate(ndi.find_objects(lab),1):
        mm=(lab[sl]==i)&m[sl]
        if mm.sum()<min_area: continue
        ys,xs=sl
        out.append((x0+xs.start,y0+ys.start,x0+xs.stop,y0+ys.stop))
    return sorted(out,key=lambda b:(b[1]//40,b[0]))
def sheet(a, boxes, out, bgc=(236,226,206,255), scale=2, cols=8):
    cells=[]
    for i,(x0,y0,x1,y1) in enumerate(boxes):
        c=Image.fromarray(a[y0:y1,x0:x1]); cells.append(c)
    W=max(c.width for c in cells)*scale+8; H=max(c.height for c in cells)*scale+22
    rows=(len(cells)+cols-1)//cols
    im=Image.new('RGBA',(W*cols,H*rows),bgc); d=ImageDraw.Draw(im)
    for i,c in enumerate(cells):
        cx,cy=(i%cols)*W,(i//cols)*H
        im.alpha_composite(c.resize((c.width*scale,c.height*scale),Image.NEAREST),(cx+4,cy+18))
        d.text((cx+4,cy+3),f"{i} {boxes[i]}",fill=(0,0,0,255))
    im.save(out)
