from PIL import Image, ImageDraw, ImageFont
import math
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; M='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
S=2  # draw at 2x, downsample for smooth edges
def base(bg):
    im=Image.new('RGB',(600*S,800*S),bg); return im, ImageDraw.Draw(im)
def title(d, lines, sub, subcol):
    f=ImageFont.truetype(B, 52*S); y=800*S-60*S-len(lines)*60*S-34*S
    for l in lines: d.text((60*S,y), l, font=f, fill='white'); y+=60*S
    d.text((60*S,y+10*S), sub, font=ImageFont.truetype(R, 22*S), fill=subcol)
def arrow(d, x0,y0,x1,y1, col, w):
    d.line((x0,y0,x1,y1), fill=col, width=w)
    a=math.atan2(y1-y0,x1-x0); L=26*S
    for s in (1,-1):
        d.line((x1,y1,x1-L*math.cos(a+s*0.45),y1-L*math.sin(a+s*0.45)), fill=col, width=w)
# Vectors
im,d=base((24,32,64))
ox,oy,u=110*S,430*S,52*S
for i in range(0,9):
    d.line((ox+i*u,oy-7*u,ox+i*u,oy), fill=(44,56,100), width=2*S)
for j in range(0,8):
    d.line((ox,oy-j*u,ox+8*u,oy-j*u), fill=(44,56,100), width=2*S)
d.line((ox,oy,ox+8*u,oy), fill=(90,104,160), width=3*S); d.line((ox,oy,ox,oy-7*u), fill=(90,104,160), width=3*S)
arrow(d, ox,oy, ox+3*u,oy-4*u, (143,166,255), 7*S)
arrow(d, ox+3*u,oy-4*u, ox+7*u,oy-5*u, (240,165,74), 7*S)
d.line((ox,oy,ox+7*u,oy-5*u), fill=(230,232,239), width=3*S)
title(d, ['Vectors,','Visually'], 'arrows · lengths · dot product', (143,166,255))
im.resize((600,800), Image.LANCZOS).save('vectors.webp', quality=90)
# Python
im,d=base((20,30,28))
f=ImageFont.truetype(M, 30*S); y=120*S
rows=[('>>> ',(240,165,74),'name = "Ada"'),('>>> ',(240,165,74),'for i in range(3):'),('... ',(120,140,130),'    print(i, name)'),('',None,'0 Ada'),('',None,'1 Ada'),('',None,'2 Ada')]
d.rounded_rectangle((50*S,80*S,550*S,470*S), radius=18*S, fill=(12,18,17), outline=(46,70,62), width=2*S)
for p,c,t in rows:
    x=80*S
    if p: d.text((x,y),p,font=f,fill=c); x+=d.textlength(p,font=f)
    d.text((x,y),t,font=f,fill=(214,240,226) if p else (120,200,160)); y+=48*S
d.rectangle((80*S, y+6*S, 96*S, y+34*S), fill=(214,240,226))
title(d, ['Python:','First Steps'], 'print · variables · loops', (120,200,160))
im.resize((600,800), Image.LANCZOS).save('python.webp', quality=90)
