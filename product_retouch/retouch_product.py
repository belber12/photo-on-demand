#!/usr/bin/env python3
"""
Product photo retouching pipeline for e-commerce:
- Removes background (preserves object at full resolution)
- Composites onto a clean studio-style surface (low-angle table look)
- Adds soft natural shadow
- Optional light clarity/contrast (no smoothing of labels/text)
"""

from pathlib import Path
import argparse
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

# Optional: rembg for background removal (install with: pip install rembg pillow)
try:
    from rembg import remove as rembg_remove
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False


def remove_background(image: Image.Image) -> Image.Image:
    """Remove background; keep object and alpha at original resolution."""
    if not HAS_REMBG:
        raise RuntimeError(
            "rembg is required for background removal. Install with: pip install rembg"
        )
    # rembg preserves input size; use session for consistent quality
    return rembg_remove(image, alpha_matting=True, alpha_matting_foreground_threshold=270, alpha_matting_background_threshold=20)


def make_studio_background(width: int, height: int, warm: bool = True) -> Image.Image:
    """
    Create a clean, neutral studio surface with slight low-angle perspective:
    darker toward bottom (closer), slightly lighter toward top.
    Optional warm tint for sunlight feel.
    """
    arr = np.zeros((height, width, 3), dtype=np.uint8)
    # Base: neutral light gray (table)
    base_r, base_g, base_b = 248, 247, 246
    if warm:
        base_r, base_g, base_b = 250, 248, 245  # Slight warm
    for y in range(height):
        # Gradient: bottom slightly darker (closer to camera), top slightly lighter
        t = y / max(height, 1)
        factor = 0.92 + 0.08 * t  # 0.92 at bottom, 1.0 at top
        r = int(base_r * factor)
        g = int(base_g * factor)
        b = int(base_b * factor)
        arr[y, :] = [r, g, b]
    return Image.fromarray(arr, mode="RGB")


def get_object_mask(rgba: Image.Image) -> np.ndarray:
    """Return alpha as 0-255 mask (H, W)."""
    return np.array(rgba.split()[-1], dtype=np.uint8)


def add_soft_shadow(
    background: Image.Image,
    mask: np.ndarray,
    obj_x: int,
    obj_y: int,
    shadow_offset: tuple[int, int] = (30, 25),
    blur_radius: int = 45,
    shadow_opacity: float = 0.35,
    shadow_color: tuple[int, int, int] = (200, 198, 196),
) -> Image.Image:
    """
    Draw a soft natural shadow under the object.
    mask: (H,W) alpha of object; obj_x, obj_y: position of object on background.
    """
    bg_arr = np.array(background)
    mh, mw = mask.shape
    dy, dx = shadow_offset
    sh_x0 = obj_x + dx
    sh_y0 = obj_y + dy
    sh_x1 = min(bg_arr.shape[1], obj_x + mw + dx)
    sh_y1 = min(bg_arr.shape[0], obj_y + mh + dy)
    sh_x0 = max(0, sh_x0)
    sh_y0 = max(0, sh_y0)
    # Crop mask to overlap region
    mx0 = max(0, -dx)
    my0 = max(0, -dy)
    mx1 = min(mw, bg_arr.shape[1] - obj_x - dx)
    my1 = min(mh, bg_arr.shape[0] - obj_y - dy)
    if mx1 <= mx0 or my1 <= my0:
        return background
    mask_crop = mask[my0:my1, mx0:mx1]
    mask_pil = Image.fromarray(mask_crop)
    for _ in range(blur_radius // 8):
        mask_pil = mask_pil.filter(ImageFilter.GaussianBlur(radius=4))
    shadow_patch = np.array(mask_pil) * (shadow_opacity / 255.0)
    patch_h, patch_w = shadow_patch.shape
    for c in range(3):
        bg_arr[sh_y0 : sh_y0 + patch_h, sh_x0 : sh_x0 + patch_w, c] = (
            bg_arr[sh_y0 : sh_y0 + patch_h, sh_x0 : sh_x0 + patch_w, c] * (1 - shadow_patch)
            + shadow_color[c] * shadow_patch
        ).astype(np.uint8)
    return Image.fromarray(bg_arr)


def composite_object(
    background: Image.Image,
    rgba: Image.Image,
    pad: int,
    center: bool = True,
) -> tuple[Image.Image, np.ndarray, int, int]:
    """
    Composite RGBA object onto background with padding.
    Returns (result_image, object_alpha_mask, obj_x, obj_y).
    """
    bw, bh = background.size
    ow, oh = rgba.size
    x = max(0, (bw - ow) // 2)
    y = max(0, (bh - oh) // 2)
    mask = get_object_mask(rgba)
    background.paste(rgba, (x, y), rgba)
    return background, mask, x, y


def enhance_clarity(image: Image.Image, clarity: float = 1.08, contrast: float = 1.05) -> Image.Image:
    """Slight clarity and contrast only; no smoothing. Use sparingly."""
    img = image
    if contrast != 1.0:
        img = ImageEnhance.Contrast(img).enhance(contrast)
    if clarity != 1.0:
        img = ImageEnhance.Sharpness(img).enhance(clarity)
    return img


def main():
    parser = argparse.ArgumentParser(description="Product photo retouch: background + studio + shadow")
    parser.add_argument("input", type=Path, help="Input product image path")
    parser.add_argument("-o", "--output", type=Path, default=None, help="Output path (default: input_retouched.png)")
    parser.add_argument("--no-shadow", action="store_true", help="Skip adding soft shadow")
    parser.add_argument("--warm", action="store_true", default=True, help="Warm studio background (default: True)")
    parser.add_argument("--no-warm", action="store_false", dest="warm", help="Neutral gray background")
    parser.add_argument("--clarity", type=float, default=1.05, help="Sharpness factor (default 1.05)")
    parser.add_argument("--contrast", type=float, default=1.03, help="Contrast factor (default 1.03)")
    args = parser.parse_args()

    input_path = args.input
    if not input_path.is_file():
        raise SystemExit(f"Input file not found: {input_path}")

    output_path = args.output or input_path.parent / f"{input_path.stem}_retouched.png"
    output_path = Path(output_path)

    print("Loading image...")
    img = Image.open(input_path).convert("RGB")
    orig_size = img.size

    print("Removing background (this may take a moment)...")
    rgba = remove_background(img)
    rgba = rgba.convert("RGBA")

    # Studio background: same size as original so we keep resolution
    w, h = orig_size
    pad = max(w, h) // 8  # Padding for shadow and centering
    bg = make_studio_background(w + 2 * pad, h + 2 * pad, warm=args.warm)

    # Position object (centered on padded bg)
    bw, bh = bg.size
    ow, oh = rgba.size
    obj_x = (bw - ow) // 2
    obj_y = (bh - oh) // 2
    mask = get_object_mask(rgba)
    # Shadow first (under the object), then paste object on top
    if not args.no_shadow:
        bg = add_soft_shadow(
            bg,
            mask,
            obj_x,
            obj_y,
            shadow_offset=(int(w * 0.02), int(h * 0.025)),
            blur_radius=40,
            shadow_opacity=0.32,
            shadow_color=(210, 208, 205),
        )
    bg.paste(rgba, (obj_x, obj_y), rgba)
    result = bg

    # Light clarity/contrast (do not touch alpha or labels)
    result = enhance_clarity(result, clarity=args.clarity, contrast=args.contrast)

    result.save(output_path, "PNG", compress_level=6)
    print(f"Saved: {output_path}")
    print("Done. For dust/scratch removal on the product, use manual retouching to preserve labels and QR codes.")


if __name__ == "__main__":
    main()
