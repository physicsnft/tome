"""Tome launcher icon + launch screen. A white book with an amber bookmark on indigo ink."""
import os, glob
from PIL import Image, ImageDraw, ImageFont
import pathlib
RES=str(pathlib.Path(__file__).resolve().parents[1] / 'packages/player-web/android/app/src/main/res')
INK=(43,74,203); PAPER=(247,248,250); AMBER=(194,106,0); SPINE=(214,221,247); WHITE=(255,255,255)
N=1024  # master canvas = 108dp

def glyph(d, scale=1.0, cx=512, cy=512):
    s=scale
    w,h=300*s,400*s; x0,y0=cx-w/2,cy-h/2
    d.rounded_rectangle([x0,y0,x0+w,y0+h], radius=30*s, fill=WHITE)
    d.rounded_rectangle([x0,y0,x0+58*s,y0+h], radius=30*s, fill=SPINE)
    d.rectangle([x0+30*s,y0,x0+58*s,y0+h], fill=SPINE)
    # bookmark ribbon, hanging past the bottom edge? no: from the top edge, with a notch
    rx=x0+w-110*s; rw=56*s; top=y0-2*s; bot=y0+190*s
    d.polygon([(rx,top),(rx+rw,top),(rx+rw,bot),(rx+rw/2,bot-34*s),(rx,bot)], fill=AMBER)
    # three title lines
    for i,lw in enumerate([150,110]):
        yy=y0+250*s+i*44*s
        d.rounded_rectangle([x0+96*s,yy,x0+96*s+lw*s,yy+18*s], radius=9*s, fill=(205,212,240))

def foreground():
    im=Image.new('RGBA',(N,N),(0,0,0,0)); glyph(ImageDraw.Draw(im)); return im
def monochrome():
    im=Image.new('RGBA',(N,N),(0,0,0,0)); d=ImageDraw.Draw(im)
    s=1; w,h=300,400; x0,y0=512-w/2,512-h/2
    d.rounded_rectangle([x0,y0,x0+w,y0+h], radius=30, fill=WHITE)
    rx=x0+w-110; rw=56
    d.polygon([(rx,y0),(rx+rw,y0),(rx+rw,y0+190),(rx+rw/2,y0+156),(rx,y0+190)], fill=(0,0,0,0))
    return im
def legacy(round_=False):
    # legacy icons: the 108dp design with 18dp trimmed each side = 72dp, then masked
    full=Image.new('RGBA',(N,N),INK+(255,)); full.alpha_composite(foreground())
    crop=full.crop((171,171,853,853)).resize((N,N),Image.LANCZOS)
    mask=Image.new('L',(N,N),0); md=ImageDraw.Draw(mask)
    if round_: md.ellipse([16,16,N-16,N-16],fill=255)
    else: md.rounded_rectangle([40,40,N-40,N-40],radius=190,fill=255)
    out=Image.new('RGBA',(N,N),(0,0,0,0)); out.paste(crop,(0,0),mask); return out

DENS={'mdpi':1,'hdpi':1.5,'xhdpi':2,'xxhdpi':3,'xxxhdpi':4}
fg=foreground(); mono=monochrome(); lg=legacy(); rd=legacy(True)
for k,m in DENS.items():
    d=f'{RES}/mipmap-{k}'
    fg.resize((int(108*m),)*2,Image.LANCZOS).save(f'{d}/ic_launcher_foreground.png')
    mono.resize((int(108*m),)*2,Image.LANCZOS).save(f'{d}/ic_launcher_monochrome.png')
    lg.resize((int(48*m),)*2,Image.LANCZOS).save(f'{d}/ic_launcher.png')
    rd.resize((int(48*m),)*2,Image.LANCZOS).save(f'{d}/ic_launcher_round.png')

# Launch screen for Android < 12 (12+ draws its own from the theme): paper, icon, wordmark.
font_path='/usr/share/fonts/opentype/inter/Inter-Bold.otf'  # any bold sans works
for f in glob.glob(f'{RES}/drawable*/splash.png'):
    W,H=Image.open(f).size
    im=Image.new('RGB',(W,H),PAPER); u=min(W,H)
    ic=rd.resize((int(u*0.28),)*2,Image.LANCZOS)
    im.paste(ic,((W-ic.width)//2,int(H/2-ic.height*0.75)),ic)
    d=ImageDraw.Draw(im); fnt=ImageFont.truetype(font_path,int(u*0.075))
    t='Tome'; tw=d.textlength(t,font=fnt)
    d.text(((W-tw)/2,H/2+ic.height*0.4),t,font=fnt,fill=(27,32,48))
    im.save(f)
# Web app (installable PWA): home-screen icons, including a maskable one that is safe to crop to any shape.
WEB = str(pathlib.Path(RES).parents[4] / 'public' / 'icons')
os.makedirs(WEB, exist_ok=True)
for size in (192, 512): lg.resize((size, size), Image.LANCZOS).save(f'{WEB}/icon-{size}.png')
full = Image.new('RGBA', (N, N), INK + (255,)); full.alpha_composite(fg)
full.resize((512, 512), Image.LANCZOS).save(f'{WEB}/maskable-512.png')
full.convert('RGB').resize((180, 180), Image.LANCZOS).save(f'{WEB}/apple-touch-icon.png')

# Store listing / README image
big=rd.resize((512,512),Image.LANCZOS); big.save(f'{RES}/../../../../icon-512.png')  # for the Play listing
print('ok')
