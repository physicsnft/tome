"""Cover for the chess course: the royal fork from lesson 1 (knight e5 attacks king g6 and queen c6).

    python3 tools/gen_cover_chess.py packages/player-web/public/courses/chess/assets/images/cover.png
"""
import math
import sys
from PIL import Image, ImageDraw, ImageFont

S = 2  # draw at twice the size, then scale down for smooth edges
W, H = 600 * S, 800 * S
GREEN, LIGHT, DARK = (45, 90, 61), (240, 230, 210), (168, 115, 74)
INK, ORANGE = (27, 32, 48), (240, 140, 80)
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

SQ = 57 * S
X0, Y0 = (W - 8 * SQ) // 2, 70 * S

def centre(square):
    col, row = ord(square[0]) - ord('a'), 8 - int(square[1])
    return X0 + col * SQ + SQ / 2, Y0 + row * SQ + SQ / 2

im = Image.new('RGB', (W, H), GREEN)
d = ImageDraw.Draw(im)

# Board
for row in range(8):
    for col in range(8):
        x, y = X0 + col * SQ, Y0 + row * SQ
        d.rectangle((x, y, x + SQ - 1, y + SQ - 1), fill=LIGHT if (row + col) % 2 == 0 else DARK)

# The fork: lines from the knight to both targets, under the pieces
def arrow(a, b):
    (x0, y0), (x1, y1) = centre(a), centre(b)
    ang = math.atan2(y1 - y0, x1 - x0)
    x1, y1 = x1 - math.cos(ang) * SQ * 0.5, y1 - math.sin(ang) * SQ * 0.5  # stop at the piece's edge
    d.line((x0, y0, x1, y1), fill=ORANGE, width=7 * S)
    head = 18 * S
    pts = [(x1 + math.cos(ang) * head * 0.6, y1 + math.sin(ang) * head * 0.6)]
    for s in (1, -1):
        pts.append((x1 - math.cos(ang + s * 0.6) * head * 0.5, y1 - math.sin(ang + s * 0.6) * head * 0.5))
    d.polygon(pts, fill=ORANGE)

arrow('e5', 'g6')
arrow('e5', 'c6')

# Pieces, each centred on its square by the glyph's own ink box
piece_font = ImageFont.truetype(REG, int(SQ * 1.08))
def piece(square, glyph, fill, stroke):
    cx, cy = centre(square)
    left, top, right, bottom = d.textbbox((0, 0), glyph, font=piece_font, stroke_width=2 * S)
    d.text((cx - (left + right) / 2, cy - (top + bottom) / 2), glyph, font=piece_font, fill=fill, stroke_width=2 * S, stroke_fill=stroke)

piece('g6', '♚', INK, LIGHT)
piece('c6', '♛', INK, LIGHT)
piece('e5', '♞', (255, 255, 255), INK)  # a white knight: the filled glyph in white with a dark outline

# Title, in the same place and type as the other covers
title = ImageFont.truetype(BOLD, 52 * S)
lines = ['Chess Tactics:', 'Forks & Pins']
y = H - 60 * S - len(lines) * 60 * S - 34 * S
for line in lines:
    d.text((60 * S, y), line, font=title, fill='white')
    y += 60 * S
d.text((60 * S, y + 10 * S), 'find the move', font=ImageFont.truetype(REG, 22 * S), fill=(190, 225, 200))

im.resize((W // S, H // S), Image.LANCZOS).save(sys.argv[1] if len(sys.argv) > 1 else 'cover.png')
