#!/usr/bin/env python3
"""Derives favicon set and OG image from the supplied brand assets.

Inputs (committed): public/brand/shield.png, public/brand/logo-horizontal.png
Outputs: src/app/icon.png, src/app/apple-icon.png, public/favicon.ico,
         public/og-image.png (1200x630)

Run: npm run assets:generate
"""
from PIL import Image

BRAND_BLUE = (0, 70, 156)      # #00469C from shield logo
BRAND_RED = (204, 19, 50)      # #CC1332
BRAND_INK = (63, 64, 58)       # #3F403A
WHITE = (255, 255, 255)

shield = Image.open("public/brand/shield.png").convert("RGBA")

# Trim the shield to its bounding box (drop transparent/white margins).
def trim(img: Image.Image) -> Image.Image:
    # Treat near-white as background
    datas = img.getdata()
    mask = Image.new("L", img.size, 0)
    mask.putdata([255 if (a > 10 and not (r > 245 and g > 245 and b > 245)) else 0 for r, g, b, a in datas])
    bbox = mask.getbbox()
    return img.crop(bbox) if bbox else img

shield_t = trim(shield)

# Favicons -------------------------------------------------------------------
def icon(size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = int(size * 0.94)
    s = shield_t.copy()
    s.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(s, ((size - s.width) // 2, (size - s.height) // 2))
    return canvas

icon(512).save("src/app/icon.png")
icon(180).convert("RGB").save("src/app/apple-icon.png")
icon(64).save("public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# OG image (1200x630) ---------------------------------------------------------
og = Image.new("RGB", (1200, 630), WHITE)
# Brand color bars top and bottom, echoing the yard-sign border treatment.
bar = 14
for y0, color in [(0, BRAND_BLUE), (bar, BRAND_RED)]:
    og.paste(color, (0, y0, 1200, y0 + bar))
for y0, color in [(630 - bar, BRAND_BLUE), (630 - 2 * bar, BRAND_RED)]:
    og.paste(color, (0, y0, 1200, y0 + bar))

# Centered horizontal lockup (shield + wordmark), scaled.
lockup = trim(Image.open("public/brand/logo-horizontal.png").convert("RGBA"))
lockup.thumbnail((900, 360), Image.LANCZOS)
og.paste(lockup, ((1200 - lockup.width) // 2, 150), lockup)

# Tagline rendered as image-safe text via PIL default fonts is ugly; instead
# draw with a bundled TrueType if present, else skip text (logo carries it).
try:
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(og)
    font = None
    for path in [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]:
        try:
            font = ImageFont.truetype(path, 40)
            break
        except OSError:
            continue
    if font:
        text = "Big Tech has lobbyists. You have neighbors."
        w = draw.textlength(text, font=font)
        draw.text(((1200 - w) / 2, 470), text, fill=BRAND_INK, font=font)
except Exception as e:
    print("tagline skipped:", e)

og.save("public/og-image.png")
print("Generated: src/app/icon.png, src/app/apple-icon.png, public/favicon.ico, public/og-image.png")
