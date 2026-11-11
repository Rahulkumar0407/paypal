import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
N = 1024; OUT = 256
FB = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
FS = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'

def lin(c1, c2, size=(N, N), angle=90):
    w, h = size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    a = math.radians(angle)
    t = (x * math.cos(a) + y * math.sin(a)); t = (t - t.min()) / (t.max() - t.min() + 1e-6)
    c1 = np.array(c1, np.float32); c2 = np.array(c2, np.float32)
    rgb = c1[None, None, :] * (1 - t[..., None]) + c2[None, None, :] * t[..., None]
    return Image.fromarray(np.dstack([rgb, np.full((h, w), 255)]).astype(np.uint8), 'RGBA')

def rad(c1, c2, cx, cy, r, size=(N, N)):
    w, h = size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    t = np.clip(np.hypot(x - cx, y - cy) / r, 0, 1)
    c1 = np.array(c1, np.float32); c2 = np.array(c2, np.float32)
    rgb = c1[None, None, :] * (1 - t[..., None]) + c2[None, None, :] * t[..., None]
    return Image.fromarray(np.dstack([rgb, np.full((h, w), 255)]).astype(np.uint8), 'RGBA')

def put(base, fill, mask):
    f = fill.copy(); f.putalpha(ImageChops.multiply(fill.getchannel('A'), mask)); base.alpha_composite(f)

def shadow(base, mask, off=(0, 18), blur=26, alpha=150):
    s = Image.new('RGBA', base.size, (0, 0, 0, 0))
    m = Image.new('L', base.size, 0); m.paste(mask, off)
    m = m.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: v * alpha // 255)
    s.putalpha(m); base.alpha_composite(s)

def rim(base, mask, light=(255, 255, 255), dark=(0, 0, 0), k=6, la=90, da=120):
    up = Image.new('L', base.size, 0); up.paste(mask, (0, k))
    hi = ImageChops.subtract(mask, up).filter(ImageFilter.GaussianBlur(2)).point(lambda v: v * la // 255)
    dn = Image.new('L', base.size, 0); dn.paste(mask, (0, -k))
    lo = ImageChops.subtract(mask, dn).filter(ImageFilter.GaussianBlur(2)).point(lambda v: v * da // 255)
    l = Image.new('RGBA', base.size, light + (0,)); l.putalpha(hi); base.alpha_composite(l)
    d = Image.new('RGBA', base.size, dark + (0,)); d.putalpha(lo); base.alpha_composite(d)

def tile(top, bottom):
    base = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    m = Image.new('L', (N, N), 0); ImageDraw.Draw(m).rounded_rectangle([40, 40, N - 40, N - 40], 230, fill=255)
    shadow(base, m, (0, 20), 30, 160)
    put(base, lin(top, bottom), m)
    # glossy top sheen
    sh = Image.new('L', (N, N), 0); ImageDraw.Draw(sh).ellipse([-200, -620, N + 200, 470], fill=26)
    sh = ImageChops.multiply(sh.filter(ImageFilter.GaussianBlur(40)), m)
    w = Image.new('RGBA', (N, N), (255, 255, 255, 0)); w.putalpha(sh); base.alpha_composite(w)
    rim(base, m, k=5, la=70, da=160)
    return base, m

def save(img, name):
    img.resize((OUT, OUT), Image.LANCZOS).save(name, 'PNG')

def gear_poly(cx, cy, R, r, teeth, tw=0.45):
    pts = []
    for i in range(teeth):
        a0 = 2 * math.pi * i / teeth; step = 2 * math.pi / teeth
        for (aa, rr) in [(a0, r), (a0 + step * (0.5 - tw / 2) , r), (a0 + step * (0.5 - tw / 2) + step * .06, R), (a0 + step * (0.5 + tw / 2) - step * .06, R), (a0 + step * (0.5 + tw / 2), r)]:
            pts.append((cx + rr * math.cos(aa), cy + rr * math.sin(aa)))
    return pts

# 1 Settings: graphite tile, recessed well, machined gear
b, tm = tile((86, 88, 94), (36, 37, 41))
well = Image.new('L', (N, N), 0); ImageDraw.Draw(well).ellipse([170, 170, 854, 854], fill=255)
put(b, lin((20, 20, 23), (58, 59, 64)), well); rim(b, well, k=8, la=40, da=0)
inner = Image.new('L', (N, N), 0); ImageDraw.Draw(inner).ellipse([185, 185, 839, 839], fill=255)
sh = ImageChops.subtract(inner, Image.new('L', (N, N), 0)); 
g = Image.new('L', (N, N), 0); dg = ImageDraw.Draw(g)
dg.polygon(gear_poly(512, 512, 320, 280, 44, 0.5), fill=255)
dg.ellipse([262, 262, 762, 762], fill=0)
dg.ellipse([292, 292, 732, 732], fill=255)
for k in range(3):
    a = math.radians(-90 + k * 120)
    dg.line([(512, 512), (512 + 230 * math.cos(a), 512 + 230 * math.sin(a))], fill=0, width=1)
cut = Image.new('L', (N, N), 0); dc = ImageDraw.Draw(cut)
for k in range(3):
    a1 = math.radians(-90 + k * 120 + 14); a2 = math.radians(-90 + (k + 1) * 120 - 14)
    dc.pieslice([322, 322, 702, 702], math.degrees(a1), math.degrees(a2), fill=255)
cut2 = Image.new('L', (N, N), 0); ImageDraw.Draw(cut2).ellipse([452, 452, 572, 572], fill=255)
cut = ImageChops.subtract(cut, cut2)
g = ImageChops.subtract(g, cut)
hub = Image.new('L', (N, N), 0); ImageDraw.Draw(hub).ellipse([490, 490, 534, 534], fill=255); g = ImageChops.subtract(g, hub)
shadow(b, g, (0, 14), 16, 200)
put(b, lin((236, 238, 242), (120, 123, 130), angle=70), g)
put(b, rad((255, 255, 255), (150, 152, 158), 420, 380, 520), Image.eval(g, lambda v: v * 0.45))
rim(b, g, k=5, la=160, da=140)
save(b, 'ic_settings.png')

# 2 Daily brief: dusk tile, glowing sun rising over a horizon
b, tm = tile((40, 44, 92), (14, 16, 34))
glow = rad((255, 170, 70), (40, 44, 92), 512, 640, 520)
gm = Image.new('L', (N, N), 0); ImageDraw.Draw(gm).ellipse([92, 220, 932, 1060], fill=170); gm = ImageChops.multiply(gm.filter(ImageFilter.GaussianBlur(60)), tm)
put(b, glow, gm)
sun = Image.new('L', (N, N), 0); ImageDraw.Draw(sun).ellipse([292, 400, 732, 840], fill=255)
hz = Image.new('L', (N, N), 0); ImageDraw.Draw(hz).rectangle([0, 0, N, 640], fill=255)
sun = ImageChops.multiply(sun, hz)
put(b, rad((255, 236, 170), (255, 130, 40), 512, 560, 260), sun)
rim(b, sun, k=5, la=120, da=0)
for i, (y, w) in enumerate([(688, 520), (748, 400), (806, 260)]):
    bar = Image.new('L', (N, N), 0); ImageDraw.Draw(bar).rounded_rectangle([512 - w // 2, y, 512 + w // 2, y + 26], 13, fill=255)
    put(b, lin((255, 190, 110), (210, 110, 50)), Image.eval(bar, lambda v, i=i: v * (0.95 - i * 0.22)))
save(b, 'ic_brief.png')

# 3 Requests: dark tile, porcelain envelope with a blue letter
b, tm = tile((58, 60, 70), (22, 23, 28))
env = Image.new('L', (N, N), 0); ImageDraw.Draw(env).rounded_rectangle([200, 310, 824, 740], 46, fill=255)
letter = Image.new('L', (N, N), 0); ImageDraw.Draw(letter).rounded_rectangle([270, 230, 754, 560], 26, fill=255)
shadow(b, letter, (0, 10), 14, 140)
put(b, lin((255, 255, 255), (214, 220, 230)), letter)
for y in (300, 350, 400):
    ln = Image.new('L', (N, N), 0); ImageDraw.Draw(ln).rounded_rectangle([320, y, 704 - (y - 300), y + 18], 9, fill=255)
    put(b, lin((0, 112, 224), (0, 80, 180)), Image.eval(ln, lambda v: v * .85))
shadow(b, env, (0, 18), 22, 170)
put(b, lin((248, 248, 250), (196, 200, 210)), env)
fl = Image.new('L', (N, N), 0); ImageDraw.Draw(fl).polygon([(200, 330), (512, 560), (824, 330), (824, 740), (200, 740)], fill=255)
fl = ImageChops.multiply(fl, env)
put(b, lin((232, 234, 240), (178, 184, 196)), fl)
v = Image.new('L', (N, N), 0); ImageDraw.Draw(v).line([(206, 736), (512, 520), (818, 736)], fill=255, width=10); v = ImageChops.multiply(v.filter(ImageFilter.GaussianBlur(3)), env)
put(b, Image.new('RGBA', (N, N), (120, 126, 140, 255)), Image.eval(v, lambda x: x * .6))
rim(b, env, k=4, la=200, da=90)
save(b, 'ic_requests.png')

# 4 Plus: black tile, faceted gold star
b, tm = tile((40, 34, 24), (10, 9, 8))
def star(cx, cy, R, r):
    return [(cx + (R if i % 2 == 0 else r) * math.cos(math.radians(-90 + i * 36)), cy + (R if i % 2 == 0 else r) * math.sin(math.radians(-90 + i * 36))) for i in range(10)]
sp = star(512, 530, 330, 150)
sm = Image.new('L', (N, N), 0); ImageDraw.Draw(sm).polygon(sp, fill=255)
shadow(b, sm, (0, 16), 20, 200)
put(b, lin((255, 226, 130), (184, 124, 30), angle=60), sm)
for i in range(10):
    p1 = sp[i]; p2 = sp[(i + 1) % 10]
    f = Image.new('L', (N, N), 0); ImageDraw.Draw(f).polygon([(512, 530), p1, p2], fill=255)
    tone = (255, 244, 200) if i % 2 == 0 else (150, 96, 20)
    put(b, Image.new('RGBA', (N, N), tone + (255,)), Image.eval(f, lambda v: v * .38))
rim(b, sm, k=4, la=170, da=120)
save(b, 'ic_plus.png')

# 5 Calendar (large, for the window)
b, tm = tile((44, 44, 48), (20, 20, 22))
page = Image.new('L', (N, N), 0); ImageDraw.Draw(page).rounded_rectangle([150, 170, 874, 874], 90, fill=255)
shadow(b, page, (0, 16), 24, 190)
put(b, lin((252, 252, 254), (220, 222, 228)), page)
head = Image.new('L', (N, N), 0); ImageDraw.Draw(head).rectangle([150, 170, 874, 380], fill=255); head = ImageChops.multiply(head, page)
put(b, lin((255, 92, 76), (196, 28, 22)), head)
rim(b, page, k=5, la=150, da=110)
for x in (300, 724):
    ring = Image.new('L', (N, N), 0); ImageDraw.Draw(ring).rounded_rectangle([x - 26, 120, x + 26, 250], 26, fill=255)
    shadow(b, ring, (0, 8), 8, 160)
    put(b, lin((230, 232, 238), (120, 124, 132)), ring); rim(b, ring, k=3, la=200, da=120)
d = ImageDraw.Draw(b)
d.text((512, 292), 'THU', font=ImageFont.truetype(FS, 96), fill=(255, 255, 255, 255), anchor='mm')
d.text((512, 640), '5', font=ImageFont.truetype(FB, 380), fill=(28, 28, 30, 255), anchor='mm')
for y in (520, 780):
    pass
save(b, 'ic_calendar.png')

# 6 Grow & Insights: deep green tile, a seedling growing out of a gold coin
b, tm = tile((22, 64, 46), (6, 24, 18))
coin = Image.new('L', (N, N), 0); ImageDraw.Draw(coin).ellipse([232, 560, 792, 820], fill=255)
edge = Image.new('L', (N, N), 0); ImageDraw.Draw(edge).ellipse([232, 600, 792, 860], fill=255)
shadow(b, edge, (0, 14), 18, 200)
put(b, lin((176, 120, 26), (110, 70, 12)), edge)
put(b, lin((255, 222, 120), (206, 150, 40), angle=20), coin)
inn = Image.new('L', (N, N), 0); ImageDraw.Draw(inn).ellipse([292, 586, 732, 794], fill=255)
put(b, lin((234, 178, 60), (255, 216, 110), angle=20), Image.eval(inn, lambda v: v * .8)); rim(b, coin, k=4, la=180, da=80)
stem = Image.new('L', (N, N), 0); ImageDraw.Draw(stem).line([(512, 690), (512, 470), (500, 420)], fill=255, width=34, joint='curve')
put(b, lin((120, 200, 90), (40, 120, 50)), stem)
def leaf(box, ang):
    L = Image.new('L', (N, N), 0); ImageDraw.Draw(L).ellipse(box, fill=255)
    return L.rotate(ang, center=((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), resample=Image.BICUBIC)
for box, ang, c1, c2 in [((520, 300, 820, 440), 28, (150, 230, 110), (50, 150, 60)), ((200, 330, 500, 460), -24, (130, 214, 100), (40, 130, 52))]:
    L = leaf(box, ang); shadow(b, L, (0, 10), 12, 150)
    put(b, lin(c1, c2, angle=70), L); rim(b, L, k=4, la=150, da=90)
    vein = Image.new('L', (N, N), 0); cx = (box[0] + box[2]) / 2; cy = (box[1] + box[3]) / 2
    ImageDraw.Draw(vein).line([(box[0] + 30, cy), (box[2] - 30, cy)], fill=255, width=8)
    vein = vein.rotate(ang, center=(cx, cy), resample=Image.BICUBIC)
    put(b, Image.new('RGBA', (N, N), (210, 250, 190, 255)), Image.eval(ImageChops.multiply(vein, L), lambda v: v * .5))
sp = Image.new('L', (N, N), 0); ImageDraw.Draw(sp).ellipse([700, 200, 760, 260], fill=255)
put(b, rad((255, 255, 220), (255, 220, 120), 730, 230, 40), sp)
save(b, 'ic_grow.png')
print('done')
