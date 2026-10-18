"""Flags demo-video frames where a whole tile/card failed to paint.

Compares a supersampled capture against a 1x reference render of the same
frames and reports any frame that differs in a localized block. Global
resampling noise stays far below the threshold; a missing card or artifact
does not.

  python3 scripts/check-demo-video-frames.py <ref_dir> <frames_dir> <first> <last>

Needs Pillow. See .claude/skills/demo-video/references/renderer-constraints.md.
"""
import sys

from PIL import Image, ImageChops

ref_dir, new_dir, first, last = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
W, H, BLOCK, THRESHOLD = 960, 540, 20, 15
flagged = []
for i in range(first, last + 1):
    ref = Image.open(f"{ref_dir}/{i:04d}.png").convert("L").resize((W, H), Image.BILINEAR)
    new = Image.open(f"{new_dir}/{i:04d}.png").convert("L").resize((W, H), Image.BILINEAR)
    blocks = ImageChops.difference(ref, new).resize((W // BLOCK, H // BLOCK), Image.BOX)
    worst = max(blocks.getdata())
    if worst > THRESHOLD:
        flagged.append((i, worst))
print(f"frames checked: {last - first + 1} | flagged: {flagged if flagged else 'none'}")
sys.exit(1 if flagged else 0)
