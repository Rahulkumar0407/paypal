"""Night versions of the v2 layers, cut exactly like the day ones (cut_v2.py). Run from the repo root."""
from PIL import Image, ImageDraw
import numpy as np

SRC = "design/tmrw-handoff/source-art/night/"
OUT = "public/tmrw/"
W, H = 1672, 941

def webp(im, path, q=86):
    im.save(OUT + path, "WEBP", quality=q, method=6)
    print("wrote", path, im.size)

def load(name):
    return Image.open(SRC + name).convert("RGB").resize((W, H), Image.LANCZOS)

webp(load("platform-empty.png"), "scenes/platform-empty-night.webp")
webp(load("train-doors-open.png"), "scenes/train-open-night.webp")
closed = load("train-doors-closed.png")
DOOR, SPLIT = (664, 300, 1008, 722), 836
webp(closed.crop((DOOR[0], DOOR[1], SPLIT, DOOR[3])), "layers/door2-left-night.webp", 92)
webp(closed.crop((SPLIT, DOOR[1], DOOR[2], DOOR[3])), "layers/door2-right-night.webp", 92)

strip = Image.open(SRC + "train-strip.png").convert("RGB")
band = strip.crop((0, 228, strip.width, 530))
band = band.resize((round(strip.width * (748 - 222) / band.height), 748 - 222), Image.LANCZOS)
webp(band, "layers/train-strip-night.webp", 84)

pano = Image.open(SRC + "panorama.png").convert("RGB")
pano = pano.resize((round(pano.width * 540 / pano.height), 540), Image.LANCZOS)
tile = Image.new("RGB", (pano.width * 2, pano.height))
tile.paste(pano, (0, 0))
tile.paste(pano.transpose(Image.FLIP_LEFT_RIGHT), (pano.width, 0))
webp(tile, "layers/panorama-tile-night.webp", 82)

# The seat with its glass cut out (same window shapes as the day seat, cut_scenery_layers.py).
win = load("seat-window.png").convert("RGBA")
S = 4
m = Image.new("L", (W * S, H * S), 0)
d = ImageDraw.Draw(m)
def rr(x0, y0, x1, y1, r):
    d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], r * S, fill=255)
rr(479, 66, 1194, 622, 52)
d.rectangle([711 * S, 60 * S, 917 * S, 106 * S], fill=0)
rr(-40, 66, 331, 375, 30); rr(-40, 402, 331, 572, 40)
rr(1342, 66, 1712, 375, 30); rr(1342, 402, 1712, 586, 40)
m = m.resize((W, H), Image.LANCZOS)
a = np.array(win)
a[..., 3] = 255 - np.array(m)
webp(Image.fromarray(a), "layers/seat-window-glass-cut-night.webp", 90)
