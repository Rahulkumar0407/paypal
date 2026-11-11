import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
exec(open('icons.py').read().split('# 1 Settings')[0])
def canvas(): return Image.new('RGBA', (N, N), (0, 0, 0, 0))

# Ventures: an arrow landing in a target board
b = canvas()
board = Image.new('L', (N, N), 0); ImageDraw.Draw(board).ellipse([90, 150, 830, 890], fill=255)
edge = Image.new('L', (N, N), 0); ImageDraw.Draw(edge).ellipse([90, 180, 830, 920], fill=255)
shadow(b, edge, (0, 20), 26, 180)
put(b, lin((160, 160, 168), (90, 90, 98)), edge)
cx, cy = 460, 520
rings = [(370, (255, 255, 255), (226, 228, 234)), (300, (255, 69, 58), (196, 24, 20)), (230, (255, 255, 255), (226, 228, 234)), (160, (255, 69, 58), (196, 24, 20)), (90, (255, 255, 255), (230, 232, 238)), (40, (255, 69, 58), (196, 24, 20))]
for r, c1, c2 in rings:
    m = Image.new('L', (N, N), 0); ImageDraw.Draw(m).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    put(b, lin(c1, c2, angle=70), m)
rim(b, board, k=6, la=200, da=120)
sheen = Image.new('L', (N, N), 0); ImageDraw.Draw(sheen).ellipse([150, 170, 600, 470], fill=70)
put(b, Image.new('RGBA', (N, N), (255, 255, 255, 255)), ImageChops.multiply(sheen.filter(ImageFilter.GaussianBlur(40)), board))
# arrow shaft from upper right into the centre
ang = math.radians(-38); L = 470
tx, ty = cx + 6, cy - 4
ex, ey = tx + L * math.cos(ang), ty + L * math.sin(ang)
shaft = Image.new('L', (N, N), 0); ImageDraw.Draw(shaft).line([(tx, ty), (ex, ey)], fill=255, width=30)
hole = Image.new('L', (N, N), 0); ImageDraw.Draw(hole).ellipse([tx - 22, ty - 22, tx + 22, ty + 22], fill=255)
put(b, Image.new('RGBA', (N, N), (60, 10, 10, 255)), Image.eval(hole.filter(ImageFilter.GaussianBlur(4)), lambda v: v * .8))
sh2 = Image.new('L', (N, N), 0); sh2.paste(shaft, (14, 22)); put(b, Image.new('RGBA', (N, N), (0, 0, 0, 255)), Image.eval(sh2.filter(ImageFilter.GaussianBlur(10)), lambda v: v * .45))
put(b, lin((40, 60, 110), (12, 22, 52), angle=128), shaft)
hi = Image.new('L', (N, N), 0); px, py = -math.sin(ang) * 7, math.cos(ang) * 7
ImageDraw.Draw(hi).line([(tx - px, ty - py), (ex - px, ey - py)], fill=255, width=8)
put(b, Image.new('RGBA', (N, N), (160, 190, 255, 255)), Image.eval(hi, lambda v: v * .5))
# fletching
for k, off in enumerate([-1, 1]):
    nx, ny = -math.sin(ang) * off, math.cos(ang) * off
    base = (ex - 110 * math.cos(ang), ey - 110 * math.sin(ang))
    poly = [(ex, ey), (ex + 40 * math.cos(ang) + 70 * nx, ey + 40 * math.sin(ang) + 70 * ny), (base[0] + 60 * nx, base[1] + 60 * ny), base]
    f = Image.new('L', (N, N), 0); ImageDraw.Draw(f).polygon(poly, fill=255)
    put(b, lin((0, 132, 255), (0, 70, 190), angle=120), f); rim(b, f, k=3, la=160, da=100)
save(b, 'g_ventures2.png')

# Pulse: a magnifying glass showing a pulse line
b = canvas()
hx0, hy0, hx1, hy1 = 600, 600, 900, 900
handle = Image.new('L', (N, N), 0); ImageDraw.Draw(handle).line([(hx0, hy0), (hx1, hy1)], fill=255, width=96)
ImageDraw.Draw(handle).ellipse([hx1 - 48, hy1 - 48, hx1 + 48, hy1 + 48], fill=255)
shadow(b, handle, (0, 18), 18, 170)
put(b, lin((48, 50, 58), (12, 12, 16), angle=45), handle); rim(b, handle, k=4, la=120, da=80)
neck = Image.new('L', (N, N), 0); ImageDraw.Draw(neck).line([(560, 560), (640, 640)], fill=255, width=70)
put(b, lin((236, 238, 244), (130, 134, 142), angle=45), neck)
ring = Image.new('L', (N, N), 0); ImageDraw.Draw(ring).ellipse([90, 90, 690, 690], fill=255)
shadow(b, ring, (0, 20), 24, 180)
put(b, lin((246, 248, 252), (120, 124, 132), angle=60), ring); rim(b, ring, k=6, la=220, da=140)
glass = Image.new('L', (N, N), 0); ImageDraw.Draw(glass).ellipse([140, 140, 640, 640], fill=255)
put(b, rad((236, 246, 255), (176, 208, 236), 330, 300, 360), glass)
pulse = Image.new('L', (N, N), 0)
pts = [(170, 400), (300, 400), (340, 330), (390, 500), (440, 250), (490, 440), (520, 400), (610, 400)]
ImageDraw.Draw(pulse).line(pts, fill=255, width=26, joint='curve')
pulse = ImageChops.multiply(pulse, glass)
put(b, Image.new('RGBA', (N, N), (255, 255, 255, 255)), Image.eval(pulse.filter(ImageFilter.GaussianBlur(10)), lambda v: v * .6))
put(b, lin((255, 80, 70), (200, 20, 30), angle=0), pulse)
gl = Image.new('L', (N, N), 0); ImageDraw.Draw(gl).ellipse([190, 170, 470, 330], fill=150)
put(b, Image.new('RGBA', (N, N), (255, 255, 255, 255)), ImageChops.multiply(gl.filter(ImageFilter.GaussianBlur(30)), glass))
inner = Image.new('L', (N, N), 0); ImageDraw.Draw(inner).ellipse([140, 140, 640, 640], outline=255, width=8)
put(b, Image.new('RGBA', (N, N), (90, 96, 108, 255)), Image.eval(inner.filter(ImageFilter.GaussianBlur(3)), lambda v: v * .6))
save(b, 'g_pulse.png')
print('ok')
