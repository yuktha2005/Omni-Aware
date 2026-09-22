import os
from PIL import Image, ImageDraw, ImageFont

public_dir = r"c:\Users\USER\AI-Powered-Multilingual-Public-Awareness-and-Mass-Communication-Platform-AUG-2026\frontend\public"
icons_dir = os.path.join(public_dir, "icons")
os.makedirs(icons_dir, exist_ok=True)

def create_pwa_icon(size, filename, maskable=False):
    # Create image with nice gradient/background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background
    if maskable:
        # Full square
        draw.rectangle([0, 0, size, size], fill=(2, 132, 199, 255)) # sky-600
        # Inner accent circle
        draw.ellipse([size * 0.1, size * 0.1, size * 0.9, size * 0.9], fill=(14, 165, 233, 255)) # sky-500
    else:
        # Rounded rect / circle
        radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=(2, 132, 199, 255))
        draw.rounded_rectangle([int(size * 0.04), int(size * 0.04), int(size * 0.96), int(size * 0.96)], radius=int(radius * 0.9), fill=(14, 165, 233, 255))
    
    # Center speech / broadcast glyph
    # Draw simple speaker / broadcast beacon shape with pure PIL
    cx, cy = size / 2, size / 2
    scale = size / 512.0
    
    # Central white emblem - megaphone / broadcast ring
    # Center circle
    draw.ellipse([cx - 40 * scale, cy - 40 * scale, cx + 40 * scale, cy + 40 * scale], fill=(255, 255, 255, 255))
    
    # Broadcast arcs
    for r, w in [(90 * scale, 16 * scale), (145 * scale, 18 * scale), (200 * scale, 20 * scale)]:
        bbox = [cx - r, cy - r, cx + r, cy + r]
        draw.arc(bbox, start=290, end=70, fill=(255, 255, 255, 230), width=int(w))
        draw.arc(bbox, start=110, end=250, fill=(255, 255, 255, 230), width=int(w))
        
    out_path = os.path.join(icons_dir, filename)
    img.save(out_path, "PNG")
    print(f"Generated {out_path} ({size}x{size})")

create_pwa_icon(192, "icon-192.png")
create_pwa_icon(512, "icon-512.png")
create_pwa_icon(512, "maskable-icon-512.png", maskable=True)
create_pwa_icon(180, "apple-touch-icon.png")
print("PWA icons generated successfully.")
