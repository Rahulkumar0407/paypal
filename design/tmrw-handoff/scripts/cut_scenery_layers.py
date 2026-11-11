from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np
win = Image.open('window.webp').convert('RGBA')
W, H = win.size
# glass mask (white = glass)
S = 4
m = Image.new('L', (W*S, H*S), 0); d = ImageDraw.Draw(m)
def rr(x0,y0,x1,y1,r): d.rounded_rectangle([x0*S,y0*S,x1*S,y1*S], r*S, fill=255)
rr(479, 66, 1194, 622, 52)
d.rectangle([711*S, 60*S, 917*S, 106*S], fill=0)          # keep the plate
rr(-40, 66, 331, 375, 30); rr(-40, 402, 331, 572, 40)      # left window, above/below mullion
rr(1342, 66, 1712, 375, 30); rr(1342, 402, 1712, 586, 40)  # right window
m = m.resize((W, H), Image.LANCZOS)
a = np.array(win); a[..., 3] = 255 - np.array(m)
Image.fromarray(a).save('window_cut.webp', 'WEBP', quality=90)
# scenery tiles from the main window view
src = win.crop((482, 70, 1191, 620)).convert('RGB')   # 709 x 550
sky = src.crop((0, 0, 709, 405))
sky_t = Image.new('RGB', (1418, 405)); sky_t.paste(sky, (0, 0)); sky_t.paste(ImageOps.mirror(sky), (709, 0))
sky_t.save('sky_tile.webp', 'WEBP', quality=88)
gr = src.crop((0, 360, 709, 550)).convert('RGBA')
ga = np.array(gr); h = ga.shape[0]
fade = np.clip((np.arange(h) - 10) / 40.0, 0, 1); ga[..., 3] = (fade[:, None] * 255).astype(np.uint8)
gr = Image.fromarray(ga)
gr_t = Image.new('RGBA', (1418, h), (0,0,0,0)); gr_t.paste(gr, (0,0)); gr_t.paste(ImageOps.mirror(gr), (709,0))
gr_t.save('ground_tile.webp', 'WEBP', quality=88)
# train band
tr = Image.open('train.webp').convert('RGB')
tr.crop((0, 210, 1672, 755)).save('train_band.webp', 'WEBP', quality=88)
print('ok', sky_t.size, gr_t.size)
