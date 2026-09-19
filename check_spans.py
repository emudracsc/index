import sys
import os
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'uploads/in_1789813828804_merged-from-zip-1789760618985-replaced-replaced (1).pdf'
if not os.path.exists(pdf_path):
    print("PDF not found")
    sys.exit(0)

doc = pymupdf.open(pdf_path)
print("Total pages in upload:", len(doc))

for pno in range(min(2, len(doc))):
    p = doc[pno]
    print(f"\n=== PAGE {pno+1} SPANS between y=270 and 340 ===")
    d = p.get_text("dict")
    for b in d["blocks"]:
        if b.get("type") == 0:
            for l in b["lines"]:
                for s in l["spans"]:
                    if 270 <= s["bbox"][1] <= 340:
                        print(f"Span bbox: {[round(x,1) for x in s['bbox']]}, font: {s['font']}, size: {s['size']:.2f}, text: '{s['text']}'")
