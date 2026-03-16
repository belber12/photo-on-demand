# Product photo retouching pipeline

Automates **background removal**, **studio-style background**, and **soft shadow** for e-commerce product shots. Object geometry, labels, QR codes, and text are preserved at full resolution.

## What it does

- **Background**: Removes existing background and composites the product onto a clean, neutral studio surface (slight low-angle table look, optional warm tint).
- **Shadow**: Adds a soft, natural shadow under the object (sunlight-from-the-side style).
- **Quality**: Keeps original resolution; optional light clarity/contrast only (no smoothing of labels or textures).

## What to do manually

- **Dust / scratches / sensor spots**: Remove in Photoshop, GIMP, or Photopea with a healing brush or clone stamp **only on non-label areas** so QR codes, serials, and logos stay sharp.
- **Heavy retouch**: For perfect catalog results, run this pipeline first, then do final dust cleanup and micro contrast on the product in your editor.

## Setup

```bash
cd product_retouch
pip install -r requirements.txt
```

First run may download the rembg model (~200 MB).

## Usage

```bash
# Basic (input image → input_retouched.png in same folder)
python retouch_product.py path/to/your/product_photo.png

# Custom output path
python retouch_product.py path/to/photo.png -o path/to/retouched.png

# Neutral gray background (no warm tint)
python retouch_product.py photo.png --no-warm

# No shadow
python retouch_product.py photo.png --no-shadow

# Slightly stronger clarity/contrast
python retouch_product.py photo.png --clarity 1.08 --contrast 1.05
```

## Options

| Option | Description |
|--------|-------------|
| `-o, --output` | Output file path (default: `*_retouched.png`) |
| `--no-shadow` | Do not add soft shadow |
| `--warm` / `--no-warm` | Warm or neutral studio background (default: warm) |
| `--clarity` | Sharpness factor (default: 1.05) |
| `--contrast` | Contrast factor (default: 1.03) |

## Preservation rules (automated step)

- Object shape and proportions are not changed.
- All engraved text, numbers, serial codes, QR codes, and logos are kept as-is (no blur or distortion).
- Manufacturing texture (brushed metal, machining marks) is preserved; the script does not apply beauty smoothing or heavy denoising.

For maximum fidelity on labels and QR codes, do dust/scratch removal manually and avoid applying strong filters over those areas.
