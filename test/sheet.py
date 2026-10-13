import sys, os, glob
from PIL import Image, ImageDraw
d, out, cols, title = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
fs = sorted(glob.glob(d + '/*.png'))
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = ims[0].size; s = 300 / max(w, h); tw, th = int(w * s), int(h * s)
rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (cols * tw, rows * th + 22), (20, 20, 24)); dr = ImageDraw.Draw(sh); dr.text((6, 5), title, fill=(255, 255, 255))
for i, im in enumerate(ims):
    x, y = (i % cols) * tw, (i // cols) * th + 22
    sh.paste(im.resize((tw, th)), (x, y)); dr.rectangle([x, y, x + tw - 1, y + th - 1], outline=(0, 0, 0)); dr.text((x + 4, y + 3), os.path.basename(fs[i])[:-4], fill=(255, 255, 0))
sh.save(out)
