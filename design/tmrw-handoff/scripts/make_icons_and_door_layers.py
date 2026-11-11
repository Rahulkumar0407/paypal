import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops, ImageOps
exec(open('icons.py').read().split('# 1 Settings')[0])   # reuse helpers (lin, rad, put, shadow, rim, gear_poly, save)
# ---------- scene layers ----------
o = Image.open('train_open2.png').convert('RGB'); c = Image.open('train_closed2.png').convert('RGB')
o.save('train_open2.webp', 'WEBP', quality=86)
c.crop((0, 205, 1672, 760)).save('train_band2.webp', 'WEBP', quality=88)
c.crop((667, 304, 837, 716)).save('door_L.webp', 'WEBP', quality=92)
c.crop((836, 304, 1006, 716)).save('door_R.webp', 'WEBP', quality=92)
Image.open('bench2.png').convert('RGB').save('bench2.webp', 'WEBP', quality=86)
# re-cut seat window: stop the side windows above the seat backs
win = Image.open('window.webp').convert('RGBA'); W, H = win.size; S = 4
m = Image.new('L', (W*S, H*S), 0); d = ImageDraw.Draw(m)
def rr(x0,y0,x1,y1,r): d.rounded_rectangle([x0*S,y0*S,x1*S,y1*S], r*S, fill=255)
rr(479, 66, 1194, 622, 52); d.rectangle([711*S, 60*S, 917*S, 106*S], fill=0)
rr(-40, 66, 331, 375, 30); rr(-40, 402, 331, 548, 30)
rr(1342, 66, 1712, 375, 30); rr(1342, 402, 1712, 545, 30)
m = m.resize((W, H), Image.LANCZOS)
a = np.array(win); a[..., 3] = 255 - np.array(m); Image.fromarray(a).save('window_cut2.webp', 'WEBP', quality=90)

# ---------- icons: the object only, no tile ----------
def canvas(): return Image.new('RGBA', (N, N), (0, 0, 0, 0))

# settings gear
b = canvas()
g = Image.new('L', (N, N), 0); dg = ImageDraw.Draw(g)
dg.polygon(gear_poly(512, 512, 430, 370, 40, 0.5), fill=255)
dg.ellipse([210, 210, 814, 814], fill=0); dg.ellipse([250, 250, 774, 774], fill=255)
cut = Image.new('L', (N, N), 0); dc = ImageDraw.Draw(cut)
for k in range(3):
    a1 = -90 + k * 120 + 15; a2 = -90 + (k + 1) * 120 - 15
    dc.pieslice([300, 300, 724, 724], a1, a2, fill=255)
hubm = Image.new('L', (N, N), 0); ImageDraw.Draw(hubm).ellipse([432, 432, 592, 592], fill=255)
cut = ImageChops.subtract(cut, hubm); g = ImageChops.subtract(g, cut)
hole = Image.new('L', (N, N), 0); ImageDraw.Draw(hole).ellipse([486, 486, 538, 538], fill=255); g = ImageChops.subtract(g, hole)
shadow(b, g, (0, 18), 18, 170)
put(b, lin((244, 246, 250), (118, 122, 130), angle=65), g)
put(b, rad((255, 255, 255), (160, 162, 168), 400, 360, 560), Image.eval(g, lambda v: v * .4))
rim(b, g, k=6, la=170, da=150); save(b, 'g_settings.png')

# daily brief: sun on the horizon
b = canvas()
glow = Image.new('L', (N, N), 0); ImageDraw.Draw(glow).ellipse([232, 330, 792, 830], fill=150)
glow = glow.filter(ImageFilter.GaussianBlur(55))
put(b, Image.new('RGBA', (N, N), (255, 170, 60, 255)), Image.eval(glow, lambda v: int(v * .7)))
sun = Image.new('L', (N, N), 0); ImageDraw.Draw(sun).ellipse([262, 330, 762, 830], fill=255)
hz = Image.new('L', (N, N), 0); ImageDraw.Draw(hz).rectangle([0, 0, N, 600], fill=255); sun = ImageChops.multiply(sun, hz)
put(b, rad((255, 240, 180), (255, 120, 30), 512, 520, 300), sun); rim(b, sun, k=6, la=150, da=0)
for i, (y, w) in enumerate([(652, 640), (722, 480), (790, 300)]):
    bar = Image.new('L', (N, N), 0); ImageDraw.Draw(bar).rounded_rectangle([512 - w // 2, y, 512 + w // 2, y + 34], 17, fill=255)
    put(b, lin((255, 196, 110), (230, 110, 40)), Image.eval(bar, lambda v, i=i: v * (1 - i * 0.2)))
save(b, 'g_brief.png')

# requests: envelope with letter
b = canvas()
env = Image.new('L', (N, N), 0); ImageDraw.Draw(env).rounded_rectangle([120, 330, 904, 830], 56, fill=255)
letter = Image.new('L', (N, N), 0); ImageDraw.Draw(letter).rounded_rectangle([200, 200, 824, 600], 30, fill=255)
shadow(b, letter, (0, 10), 14, 120); put(b, lin((255, 255, 255), (220, 226, 236)), letter)
for y in (280, 345, 410):
    ln = Image.new('L', (N, N), 0); ImageDraw.Draw(ln).rounded_rectangle([270, y, 754 - (y - 280), y + 24], 12, fill=255)
    put(b, lin((0, 112, 224), (0, 78, 176)), ln)
shadow(b, env, (0, 22), 24, 190); put(b, lin((250, 250, 252), (196, 202, 214)), env)
fl = Image.new('L', (N, N), 0); ImageDraw.Draw(fl).polygon([(120, 352), (512, 620), (904, 352), (904, 830), (120, 830)], fill=255)
put(b, lin((236, 238, 244), (176, 182, 196)), ImageChops.multiply(fl, env))
v = Image.new('L', (N, N), 0); ImageDraw.Draw(v).line([(130, 824), (512, 590), (894, 824)], fill=255, width=12)
put(b, Image.new('RGBA', (N, N), (120, 126, 140, 255)), Image.eval(ImageChops.multiply(v.filter(ImageFilter.GaussianBlur(3)), env), lambda x: x * .55))
rim(b, env, k=5, la=220, da=100); save(b, 'g_requests.png')

# pro: a cut sapphire
b = canvas()
top = 300; mid = 430; bot = 900; L, R = 140, 884; tl, tr = 310, 714
outline = [(tl, top), (tr, top), (R, mid), (512, bot), (L, mid)]
gm = Image.new('L', (N, N), 0); ImageDraw.Draw(gm).polygon(outline, fill=255)
shadow(b, gm, (0, 20), 22, 190)
put(b, lin((70, 140, 255), (8, 40, 140), angle=80), gm)
facets = [
    ([(tl, top), (tr, top), (640, mid), (384, mid)], (170, 210, 255)),
    ([(tl, top), (384, mid), (L, mid)], (60, 120, 240)),
    ([(tr, top), (R, mid), (640, mid)], (30, 80, 200)),
    ([(L, mid), (384, mid), (512, bot)], (40, 100, 230)),
    ([(384, mid), (640, mid), (512, bot)], (90, 160, 255)),
    ([(640, mid), (R, mid), (512, bot)], (12, 50, 160)),
]
for poly, col in facets:
    f = Image.new('L', (N, N), 0); ImageDraw.Draw(f).polygon(poly, fill=255)
    put(b, Image.new('RGBA', (N, N), col + (255,)), Image.eval(f, lambda v: v * .6))
lines = Image.new('L', (N, N), 0); dl = ImageDraw.Draw(lines)
for a_, b_ in [((L, mid), (R, mid)), ((384, mid), (512, bot)), ((640, mid), (512, bot)), ((tl, top), (384, mid)), ((tr, top), (640, mid))]:
    dl.line([a_, b_], fill=255, width=5)
put(b, Image.new('RGBA', (N, N), (220, 236, 255, 255)), Image.eval(lines, lambda v: v * .55))
spark = Image.new('L', (N, N), 0); ImageDraw.Draw(spark).ellipse([400, 320, 470, 390], fill=255)
put(b, Image.new('RGBA', (N, N), (255, 255, 255, 255)), spark.filter(ImageFilter.GaussianBlur(10)))
rim(b, gm, k=5, la=180, da=120); save(b, 'g_pro.png')

# calendar page (no tile)
b = canvas()
page = Image.new('L', (N, N), 0); ImageDraw.Draw(page).rounded_rectangle([110, 150, 914, 914], 100, fill=255)
shadow(b, page, (0, 22), 28, 160); put(b, lin((255, 255, 255), (222, 224, 230)), page)
head = Image.new('L', (N, N), 0); ImageDraw.Draw(head).rectangle([110, 150, 914, 380], fill=255); head = ImageChops.multiply(head, page)
put(b, lin((255, 92, 76), (196, 28, 22)), head); rim(b, page, k=6, la=170, da=110)
for x in (290, 734):
    ring = Image.new('L', (N, N), 0); ImageDraw.Draw(ring).rounded_rectangle([x - 28, 90, x + 28, 230], 28, fill=255)
    shadow(b, ring, (0, 8), 8, 150); put(b, lin((232, 234, 240), (118, 122, 130)), ring); rim(b, ring, k=3, la=200, da=120)
dr = ImageDraw.Draw(b)
dr.text((512, 272), 'THU', font=ImageFont.truetype(FS, 104), fill=(255, 255, 255, 255), anchor='mm')
dr.text((512, 650), '5', font=ImageFont.truetype(FB, 420), fill=(28, 28, 30, 255), anchor='mm')
save(b, 'g_calendar.png')

# ventures: a brass compass
b = canvas()
ring = Image.new('L', (N, N), 0); ImageDraw.Draw(ring).ellipse([100, 100, 924, 924], fill=255)
shadow(b, ring, (0, 22), 26, 190)
put(b, lin((255, 222, 140), (150, 96, 28), angle=60), ring); rim(b, ring, k=7, la=200, da=150)
bezel = Image.new('L', (N, N), 0); ImageDraw.Draw(bezel).ellipse([160, 160, 864, 864], fill=255)
put(b, lin((128, 84, 24), (230, 190, 100), angle=60), bezel)
dial = Image.new('L', (N, N), 0); ImageDraw.Draw(dial).ellipse([190, 190, 834, 834], fill=255)
put(b, rad((252, 246, 230), (226, 214, 186), 470, 430, 420), dial)
dd = ImageDraw.Draw(b)
for i in range(72):
    a_ = math.radians(i * 5); r1 = 310; r2 = 290 if i % 18 else 262
    dd.line([(512 + r1 * math.cos(a_), 512 + r1 * math.sin(a_)), (512 + r2 * math.cos(a_), 512 + r2 * math.sin(a_))], fill=(90, 70, 40, 255), width=6 if i % 18 == 0 else 3)
fnt = ImageFont.truetype(FB, 64)
for t, (x, y) in [('N', (512, 288)), ('E', (736, 512)), ('S', (512, 736)), ('W', (288, 512))]:
    dd.text((x, y), t, font=fnt, fill=(70, 52, 28, 255), anchor='mm')
ang = math.radians(-50)
tip = (512 + 230 * math.cos(ang), 512 + 230 * math.sin(ang)); tail = (512 - 230 * math.cos(ang), 512 - 230 * math.sin(ang))
px, py = -math.sin(ang) * 46, math.cos(ang) * 46
red = Image.new('L', (N, N), 0); ImageDraw.Draw(red).polygon([tip, (512 + px, 512 + py), (512 - px, 512 - py)], fill=255)
nav = Image.new('L', (N, N), 0); ImageDraw.Draw(nav).polygon([tail, (512 + px, 512 + py), (512 - px, 512 - py)], fill=255)
shadow(b, ImageChops.add(red, nav), (0, 10), 10, 150)
put(b, lin((255, 90, 70), (180, 20, 20), angle=40), red); put(b, lin((70, 90, 140), (16, 30, 70), angle=40), nav)
half = Image.new('L', (N, N), 0); ImageDraw.Draw(half).polygon([tip, (512 + px, 512 + py), (512, 512)], fill=255)
put(b, Image.new('RGBA', (N, N), (255, 255, 255, 255)), Image.eval(half, lambda v: v * .25))
cap = Image.new('L', (N, N), 0); ImageDraw.Draw(cap).ellipse([484, 484, 540, 540], fill=255)
put(b, rad((255, 236, 170), (170, 120, 40), 500, 500, 40), cap)
glass = Image.new('L', (N, N), 0); ImageDraw.Draw(glass).ellipse([210, 160, 700, 560], fill=70)
put(b, Image.new('RGBA', (N, N), (255, 255, 255, 255)), ImageChops.multiply(glass.filter(ImageFilter.GaussianBlur(40)), dial))
save(b, 'g_ventures.png')

# almanac: a leather-bound book with gold tooling and a ribbon
b = canvas()
pages = Image.new('L', (N, N), 0); ImageDraw.Draw(pages).rounded_rectangle([240, 150, 884, 868], 24, fill=255)
cover = Image.new('L', (N, N), 0); ImageDraw.Draw(cover).rounded_rectangle([160, 120, 840, 890], 40, fill=255)
shadow(b, cover, (0, 24), 28, 190)
put(b, lin((252, 246, 232), (214, 204, 182)), pages)
for y in range(170, 860, 14):
    ln = Image.new('L', (N, N), 0); ImageDraw.Draw(ln).line([(846, y), (880, y)], fill=255, width=3)
    put(b, Image.new('RGBA', (N, N), (180, 168, 140, 255)), Image.eval(ln, lambda v: v * .5))
put(b, lin((40, 70, 140), (10, 22, 60), angle=70), cover)
spine = Image.new('L', (N, N), 0); ImageDraw.Draw(spine).rounded_rectangle([160, 120, 270, 890], 40, fill=255)
put(b, lin((14, 26, 64), (30, 52, 110), angle=0), spine)
for y in (220, 790):
    band = Image.new('L', (N, N), 0); ImageDraw.Draw(band).rectangle([168, y, 262, y + 22], fill=255)
    put(b, lin((255, 222, 140), (170, 120, 40)), band)
frame = Image.new('L', (N, N), 0); ImageDraw.Draw(frame).rounded_rectangle([330, 210, 770, 800], 20, outline=255, width=10)
put(b, lin((255, 226, 150), (180, 130, 50)), frame)
orn = Image.new('L', (N, N), 0); od = ImageDraw.Draw(orn)
od.ellipse([470, 420, 630, 580], outline=255, width=12)
od.polygon([(550, 380), (566, 484), (670, 500), (566, 516), (550, 620), (534, 516), (430, 500), (534, 484)], fill=255)
put(b, lin((255, 230, 160), (190, 136, 50)), orn)
rib = Image.new('L', (N, N), 0); ImageDraw.Draw(rib).polygon([(640, 860), (690, 860), (690, 990), (665, 960), (640, 990)], fill=255)
shadow(b, rib, (0, 6), 6, 120); put(b, lin((230, 50, 50), (140, 16, 20)), rib)
rim(b, cover, k=6, la=110, da=140)
gl = Image.new('L', (N, N), 0); ImageDraw.Draw(gl).polygon([(300, 120), (520, 120), (300, 520)], fill=40)
put(b, Image.new('RGBA', (N, N), (255, 255, 255, 255)), ImageChops.multiply(gl.filter(ImageFilter.GaussianBlur(30)), cover))
save(b, 'g_almanac.png')
print('assets ok')
