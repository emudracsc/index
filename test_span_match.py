import sys
import os
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'uploads/in_1789813828804_merged-from-zip-1789760618985-replaced-replaced (1).pdf'
doc = pymupdf.open(pdf_path)

rules = {
    "मतदार नोंदणी अधिकारी": "सहाय्यक मतदार नोंदणी अधिकारी",
    "ERO": "AERO",
    "Jagdish Narayan Katkar": "Vijay Dewoo Varak",
    "कणकवली": "कुडाळ",
    "Kankavli": "Kudal"
}

print(f"Testing replacement rules on {len(doc)} pages...")

# Test on page 0 and 1
for pno in [0, 1]:
    page = doc[pno]
    page_dict = page.get_text("dict")
    
    print(f"\n--- PAGE {pno+1} SPANS ---")
    spans_to_replace = []
    
    for block in page_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                span_text = span.get("text", "")
                if not span_text.strip():
                    continue
                
                # Check if any rule matches this span
                new_text = span_text
                matched = False
                # Sort rules by find length desc
                for f_k in sorted(rules.keys(), key=len, reverse=True):
                    r_v = rules[f_k]
                    if f_k in new_text:
                        new_text = new_text.replace(f_k, r_v)
                        matched = True
                
                if matched:
                    print(f"MATCH: '{span_text}' -> '{new_text}' | bbox: {[round(x,1) for x in span['bbox']]}")
