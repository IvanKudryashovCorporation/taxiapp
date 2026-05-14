from PIL import Image, ImageDraw
import math, os

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'mobile', 'passenger', 'assets', 'tariffs')
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 600, 360

def rounded_rect(draw, box, radius, fill, outline=None, outline_width=2):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=outline_width)

def draw_car(color_body, color_roof, color_window, accent=None, has_taxi=False, scale=1.0):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, H // 2 + 20

    bw = int(340 * scale)
    bh = int(110 * scale)
    bx0, by0 = cx - bw // 2, cy - bh // 2 + 30
    bx1, by1 = bx0 + bw, by0 + bh

    # Shadow
    sw, sh = int(bw * 0.85), int(30 * scale)
    d.ellipse([cx - sw//2, by1 - 8, cx + sw//2, by1 - 8 + sh], fill=(0,0,0,60))

    # Body
    rounded_rect(d, [bx0, by0, bx1, by1], radius=int(28 * scale), fill=color_body)

    # Gradient highlight top
    hl_h = max(1, int(bh * 0.35))
    for i in range(hl_h):
        alpha = int(80 * (1 - i / hl_h))
        d.rounded_rectangle([bx0+4, by0+4, bx1-4, by0+4+hl_h], radius=20, fill=(255,255,255,alpha))

    # Roof
    rw = int(bw * 0.58)
    rh = int(70 * scale)
    rx0 = cx - rw // 2 - int(20 * scale)
    rx1 = rx0 + rw
    ry0 = by0 - rh + 10
    ry1 = by0 + 12
    rounded_rect(d, [rx0, ry0, rx1, ry1], radius=int(20 * scale), fill=color_roof)

    # Windshield (front)
    fw = int(rw * 0.38)
    fx0 = rx1 - fw - 4
    fx1 = rx1 + int(30 * scale)
    fy0 = ry0 + 8
    fy1 = ry1 - 4
    rounded_rect(d, [fx0, fy0, fx1, fy1], radius=8, fill=color_window)

    # Rear window
    rwindow_w = int(rw * 0.28)
    rwx0 = rx0 - int(24 * scale)
    rwx1 = rwx0 + rwindow_w
    rounded_rect(d, [rwx0, fy0, rwx1, fy1], radius=8, fill=color_window)

    # Side windows (2)
    sw1x0 = rx0 + int(10 * scale)
    sw1x1 = sw1x0 + int(rw * 0.22)
    sw2x0 = sw1x1 + int(12 * scale)
    sw2x1 = sw2x0 + int(rw * 0.22)
    for wx0, wx1 in [(sw1x0, sw1x1), (sw2x0, sw2x1)]:
        rounded_rect(d, [wx0, ry0+10, wx1, ry1-4], radius=6, fill=color_window)

    # Wheels — 4 ellipses
    wr = int(38 * scale)
    wh_e = int(22 * scale)
    wheel_positions = [
        (bx0 + int(55 * scale), by1 - 8),
        (bx0 + int(55 * scale), by1 + wh_e - 4),
        (bx1 - int(55 * scale), by1 - 8),
        (bx1 - int(55 * scale), by1 + wh_e - 4),
    ]
    for i, (wx, wy) in enumerate([(bx0+int(55*scale), by1-6), (bx1-int(55*scale), by1-6)]):
        d.ellipse([wx-wr, wy, wx+wr, wy+wh_e*2], fill=(30,30,30,255))
        d.ellipse([wx-int(wr*0.55), wy+int(wh_e*0.3), wx+int(wr*0.55), wy+int(wh_e*1.7)], fill=(80,80,80,255))

    # Taxi checker pattern
    if has_taxi:
        tile = 14
        for col in range(int(bw // tile)):
            for row_t in range(2):
                if (col + row_t) % 2 == 0:
                    tx0 = bx0 + col * tile
                    ty0 = by0 + int(bh * 0.55) + row_t * tile
                    d.rectangle([tx0, ty0, tx0+tile-1, ty0+tile-1], fill=(0,0,0,100))

    # Accent stripe
    if accent:
        d.rectangle([bx0 + 8, by0 + int(bh * 0.62), bx1 - 8, by0 + int(bh * 0.72)], fill=accent)

    return img

cars = [
    ('econom.png',     (154,160,172,255), (130,135,148,255), (20,25,40,200),   None,             False, 0.92),
    ('comfort.png',    (232,232,232,255), (200,200,200,255), (30,35,50,200),   (180,185,195,200), False, 1.0),
    ('business.png',   (25,25,25,255),   (15,15,15,255),    (20,30,50,180),   (60,60,60,200),    False, 1.08),
    ('taxis_plus.png', (245,207,49,255), (220,185,40,255),  (20,25,40,200),   None,              True,  0.95),
]

for fname, body, roof, window, accent, taxi, sc in cars:
    img = draw_car(body, roof, window, accent, taxi, sc)
    img.save(os.path.join(OUT_DIR, fname))
    print(f'Saved {fname}')

print('Done! Files in mobile/passenger/assets/tariffs/')
