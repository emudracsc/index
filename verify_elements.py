import sys
import os
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'uploads/in_1789813828804_merged-from-zip-1789760618985-replaced-replaced (1).pdf'
doc = pymupdf.open(pdf_path)

print(f"Inspecting elements of Page 1 & 2 in original document...")

for pno in [0, 1]:
    page = doc[pno]
    print(f"\n=== PAGE {pno+1} ELEMENT COUNTS ===")
    print(f"Images count: {len(page.get_images())}")
    print(f"Drawings/Lines count: {len(page.get_drawings())}")
    
    # Check QR code bbox
    for img_info in page.get_images():
        xref = img_info[0]
        for img_rect in page.get_image_rects(xref):
            print(f"Image xref {xref} rect: {img_rect}")
            
    # Check table rects / lines
    drawings = page.get_drawings()
    print(f"Total vector drawing paths (tables/borders/lines): {len(drawings)}")
