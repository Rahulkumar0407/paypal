"""Cuts the v2 paintings into the layers the web app uses. Run from the repo root:  python design/tmrw-handoff/scripts/cut_v2.py"""
from PIL import Image, ImageChops
import numpy as np

SRC = "design/tmrw-handoff/source-art/v2/"
BRAND = "design/tmrw-handoff/brand/"
OUT = "public/tmrw/"
W, H = 1672, 941

def webp(im, path, q=86):
    im.save(OUT + path, "WEBP", quality=q, method=6)
    print("wrote", path, im.size)

# Scenes: the empty platform (station, and the train's background) and the train with its doors open.
platform = Image.open(SRC + "platform-empty.png").convert("RGB").resize((W, H), Image.LANCZOS)
webp(platform, "scenes/platform-empty.webp")
opened = Image.open(SRC + "train-doors-open.png").convert("RGB")
closed = Image.open(SRC + "train-doors-closed.png").convert("RGB")
webp(opened, "scenes/train-open.webp")
# (the doors-closed painting is only used to cut the door leaves)

# Door leaves, cut from the doors-closed painting so that, closed, they match it pixel for pixel.
DOOR = (664, 300, 1008, 722)          # x0, y0, x1, y1 in the 1672 x 941 painting
SPLIT = 836
webp(closed.crop((DOOR[0], DOOR[1], SPLIT, DOOR[3])), "layers/door2-left.webp", 92)
webp(closed.crop((SPLIT, DOOR[1], DOOR[2], DOOR[3])), "layers/door2-right.webp", 92)

# The moving train: the carriage rows of the long strip, scaled to the painting's train height.
# Strip roof at y 228 to wheels at y 530; in the painting the same span is y 222 to 748.
strip = Image.open(SRC + "train-strip.png").convert("RGB")
band = strip.crop((0, 228, strip.width, 530))
scale = (748 - 222) / band.height
band = band.resize((round(strip.width * scale), 748 - 222), Image.LANCZOS)
webp(band, "layers/train-strip.webp", 84)

# The view from the window: the panorama next to its mirror image, so it loops with no seam.
pano = Image.open(SRC + "panorama.png").convert("RGB")
pano = pano.resize((round(pano.width * 540 / pano.height), 540), Image.LANCZOS)
tile = Image.new("RGB", (pano.width * 2, pano.height))
tile.paste(pano, (0, 0))
tile.paste(pano.transpose(Image.FLIP_LEFT_RIGHT), (pano.width, 0))
webp(tile, "layers/panorama-tile.webp", 82)

# Logos: trimmed to their content (white or navy margins removed).
def trim(path, bg):
    im = Image.open(path).convert("RGB")
    diff = ImageChops.difference(im, Image.new("RGB", im.size, bg))
    box = diff.convert("L").point(lambda v: 255 if v > 18 else 0).getbbox()
    pad = 24
    return im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))
trim(BRAND + "logo-light.png", (255, 255, 255)).save(OUT + "brand/logo-light.png", optimize=True)
dark = Image.open(BRAND + "logo-dark.png").convert("RGB")
trim(BRAND + "logo-dark.png", dark.getpixel((5, 5))).save(OUT + "brand/logo-dark.png", optimize=True)

# App icons: the blue tile, filled out to a full square (phones round the corners themselves).
tile_im = Image.open(BRAND + "app-tile.png").convert("RGB")
a = np.asarray(tile_im).astype(int)
blue = (a[..., 2] > a[..., 0] + 60)
ys, xs = np.where(blue)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
sq = tile_im.crop((x0, y0, x1 + 1, y1 + 1))
s = min(sq.size)
sq = sq.resize((s, s), Image.LANCZOS)
from PIL import ImageDraw
arr = np.asarray(sq).astype(float)
# The tile's own gradient, sampled down the middle, painted behind; the tile on top through a rounded mask set a
# little inside its edge, so the original rounded corners (and their light rim) never show.
top, bottom = arr[int(s * 0.06), s // 2], arr[int(s * 0.94), s // 2]
t = np.linspace(0, 1, s)[:, None, None]
grad = (top[None, None, :] * (1 - t) + bottom[None, None, :] * t) * np.ones((s, s, 3))
mask = Image.new("L", (s, s), 0)
inset = int(s * 0.03)
ImageDraw.Draw(mask).rounded_rectangle((inset, inset, s - inset, s - inset), radius=int(s * 0.2), fill=255)
mask = np.asarray(mask.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(3))).astype(float)[..., None] / 255
out = arr * mask + grad * (1 - mask)
icon = Image.fromarray(out.clip(0, 255).astype("uint8"))
for size, name in [(1024, "icon-1024.png"), (512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-180.png"), (64, "icon-64.png")]:
    icon.resize((size, size), Image.LANCZOS).save(OUT + "brand/" + name, optimize=True)
# Maskable: the plane inside the safe zone (80%), on the tile's blue.
m = Image.new("RGB", (512, 512), tuple(int(v) for v in arr[s // 2, 8]))
m.paste(icon.resize((410, 410), Image.LANCZOS), (51, 51))
m.save(OUT + "brand/maskable-512.png", optimize=True)
print("icons done; tile box", (x0, y0, x1, y1))
