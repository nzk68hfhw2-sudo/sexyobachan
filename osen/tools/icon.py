# アイコン仕上げ：背景＋3Dのキャラ＋ロゴ＋色収差（1:1）
import sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops
S = 1024
char = Image.open(sys.argv[1]).convert('RGBA')
logo = Image.open(sys.argv[2]).convert('RGBA')
out = sys.argv[3]
# 背景：むらさき→ピンクの丸いグラデーション＋光の粒
bg = Image.new('RGBA', (S, S))
px = bg.load()
for y in range(S):
    for x in range(S):
        d = math.hypot(x - S * 0.5, y - S * 0.42) / (S * 0.75)
        t = min(1, d)
        r = int(255 * (1 - t) + 40 * t); g = int(120 * (1 - t) + 10 * t); b = int(230 * (1 - t) + 90 * t)
        px[x, y] = (r, g, b, 255)
dr = ImageDraw.Draw(bg)
random.seed(8)
for i in range(70):
    x, y, s = random.randint(0, S), random.randint(0, int(S * 0.75)), random.randint(4, 12)
    c = random.choice([(255, 240, 150), (255, 190, 240), (180, 240, 255), (255, 255, 255)])
    dr.polygon([(x, y - s), (x + s * 0.35, y), (x, y + s), (x - s * 0.35, y)], fill=c + (220,))
    dr.polygon([(x - s, y), (x, y + s * 0.35), (x + s, y), (x, y - s * 0.35)], fill=c + (220,))
img = bg.copy()
# キャラの後ろに白い光
glow = Image.new('L', (S, S), 0); ImageDraw.Draw(glow).ellipse((150, 330, 874, 1000), fill=150); glow = glow.filter(ImageFilter.GaussianBlur(80))
img = Image.composite(Image.new('RGBA', (S, S), (255, 230, 255, 255)), img, glow)
img.alpha_composite(char)
# ロゴ（上）：白いふちどり
lw = int(S * 0.8); lh = int(logo.height * lw / logo.width); lg = logo.resize((lw, lh), Image.LANCZOS)
a = lg.getchannel('A').point(lambda v: 255 if v > 90 else 0).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(2))
halo = Image.new('RGBA', lg.size, (255, 255, 255, 0)); halo.putalpha(a.point(lambda v: min(255, int(v * 1.6))))
ox, oy = (S - lw) // 2, int(S * 0.03)
img.alpha_composite(halo, (ox, oy)); img.alpha_composite(lg, (ox, oy))
# 色収差：赤は外へ、青は内へ（まわりほど強く）
rgb = img.convert('RGB'); R, G, B = rgb.split()
def scale(ch, k):
    w = int(S * k); c = ch.resize((w, w), Image.BICUBIC); o = (w - S) // 2
    return c.crop((o, o, o + S, o + S)) if k > 1 else Image.new('L', (S, S)).__class__.paste
R2 = R.resize((int(S * 1.012),) * 2, Image.BICUBIC); o = (R2.width - S) // 2; R2 = R2.crop((o, o, o + S, o + S))
B2 = B.resize((int(S * 0.988),) * 2, Image.BICUBIC); Bc = Image.new('L', (S, S)); o = (S - B2.width) // 2; Bc.paste(B.resize((S, S)), (0, 0)); Bc.paste(B2, (o, o))
R2 = ImageChops.offset(R2, -3, 0); Bc = ImageChops.offset(Bc, 3, 0)
fin = Image.merge('RGB', (R2, G, Bc))
fin.save(out, optimize=True)
fin.resize((512, 512), Image.LANCZOS).save(out.replace('.png', '_512.png'), optimize=True)
print('saved', out)
