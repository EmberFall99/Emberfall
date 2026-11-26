import sys, io, subprocess
sys.path.insert(0, '/home/claude/emberfall')
import art
from PIL import Image
PAL = {'1': (255,255,255), '2': (255,33,33), '3': (255,147,196), '4': (255,129,53), '5': (255,246,9), '6': (36,156,163),
       '7': (120,220,82), '8': (0,63,173), '9': (135,242,255), 'a': (142,46,196), 'b': (164,131,159), 'c': (92,64,108),
       'd': (229,205,196), 'e': (145,70,61), 'f': (0,0,0)}
def raster(svg_text, scale):
    p = subprocess.run(['rsvg-convert', '-z', str(scale)], input=svg_text.encode(), capture_output=True, check=True)
    return Image.open(io.BytesIO(p.stdout)).convert('RGBA')
def nearest(rgb, allowed):
    return min(allowed, key=lambda k: sum((a - b) ** 2 for a, b in zip(PAL[k], rgb)))
def to_grid(svg_text, cx, cy, scale, box, allowed='123456789abcdef', outline=True, thresh=110):
    """box = (left, top, w, h) in OUTPUT pixels relative to feet point"""
    im = raster(svg_text, scale)
    fx, fy = cx * scale, cy * scale
    l, t, w, h = box
    grid = [['.'] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            sx, sy = int(fx + l + x), int(fy + t + y)
            if 0 <= sx < im.width and 0 <= sy < im.height:
                r, g, b, a = im.getpixel((sx, sy))
                if a >= thresh:
                    grid[y][x] = nearest((r, g, b), allowed)
    if outline:
        g2 = [row[:] for row in grid]
        for y in range(h):
            for x in range(w):
                if grid[y][x] != '.' and grid[y][x] != 'f':
                    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                        nx, ny = x+dx, y+dy
                        if not (0 <= nx < w and 0 <= ny < h) or grid[ny][nx] == '.':
                            g2[y][x] = 'f'; break
        grid = g2
    return grid
def show(grid, path, z=6):
    h, w = len(grid), len(grid[0])
    im = Image.new('RGBA', (w, h), (40, 50, 70, 255))
    for y in range(h):
        for x in range(w):
            if grid[y][x] != '.': im.putpixel((x, y), PAL[grid[y][x]] + (255,))
    im.resize((w * z, h * z), Image.NEAREST).save(path)
def sheet(grids, path, z=5):
    ims = []
    for g in grids:
        h, w = len(g), len(g[0]); im = Image.new('RGBA', (w + 2, h + 2), (40, 50, 70, 255))
        for y in range(h):
            for x in range(w):
                if g[y][x] != '.': im.putpixel((x + 1, y + 1), PAL[g[y][x]] + (255,))
        ims.append(im)
    W = sum(i.width for i in ims); H = max(i.height for i in ims)
    out = Image.new('RGBA', (W, H), (20, 20, 30, 255)); x = 0
    for i in ims: out.paste(i, (x, 0)); x += i.width
    out.resize((W * z, H * z), Image.NEAREST).save(path)
