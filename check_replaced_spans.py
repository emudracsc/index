import sys
import os
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open('test_span_replaced.pdf')
for pno in range(len(doc)):
    p = doc[pno]
    print(f"\n=== PAGE {pno+1} SPANS between y=260 and 340 ===")
    d = p.get_text("dict")
    for b in d["blocks"]:
        if b.get("type") == 0:
            for l in b["lines"]:
                for s in l["spans"]:
                    if 260 <= s["bbox"][1] <= 340:
                        print(f"Span bbox: {[round(x,1) for x in s['bbox']]}, font: {s['font']}, size: {s['size']:.2f}, text: '{s['text']}'")
