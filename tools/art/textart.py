from PIL import Image, ImageDraw, ImageFont
SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def text_grid(t, size, col, font=SERIF, band=False, width=None, pad=2, shadow='f', spacing=1):
    f = ImageFont.truetype(font, size)
    # draw char by char for letter spacing
    widths = [f.getbbox(c)[2] - f.getbbox(c)[0] if c != ' ' else size // 3 for c in t]
    tw = sum(widths) + spacing * (len(t) - 1)
    asc, desc = f.getmetrics()
    W = width or tw + pad * 2 + 2
    H = asc + desc + pad * 2
    im = Image.new('1', (W, H), 0)
    d = ImageDraw.Draw(im); d.fontmode = '1'
    x = (W - tw) // 2
    for c, w in zip(t, widths):
        if c != ' ':
            d.text((x - f.getbbox(c)[0], pad), c, font=f, fill=1)
        x += w + spacing
    # crop vertical
    bbox = im.getbbox()
    top, bot = bbox[1], bbox[3]
    g = [['.'] * W for _ in range(bot - top + 4)]
    for y in range(top, bot):
        for x in range(W):
            if im.getpixel((x, y)): g[y - top + 2][x] = col
    # shadow/outline
    out = [r[:] for r in g]
    for y in range(len(g)):
        for x in range(W):
            if g[y][x] == '.':
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < len(g) and 0 <= xx < W and g[yy][xx] == col:
                        out[y][x] = shadow; break
    if band:
        for y in range(len(out)):
            for x in range(W):
                if out[y][x] == '.':
                    edge = min(x, W - 1 - x)
                    if edge > 14 or (edge > 4 and (x + y) % 2 == 0): out[y][x] = 'f'
    return out

def stack(a, b):
    w = max(len(a[0]), len(b[0]))
    def padto(g):
        l = (w - len(g[0])) // 2
        return [['.'] * l + r + ['.'] * (w - len(r) - l) for r in g]
    return padto(a) + padto(b)

def lit(grid):
    return 'img`\n' + '\n'.join('    ' + ' '.join(r) for r in grid) + '\n`'
