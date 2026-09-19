import sys
import os
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

def is_devanagari(text: str) -> bool:
    return any('\u0900' <= ch <= '\u097F' for ch in text)

# Lohit Marathi font
lohit_path = os.path.join(os.path.dirname(__file__), "Lohit-Marathi.ttf")
marathi_font_path = lohit_path if os.path.exists(lohit_path) else r"C:\Windows\Fonts\Nirmala.ttf"
if not os.path.exists(marathi_font_path):
    marathi_font_path = r"C:\Windows\Fonts\mangal.ttf"

pdf_path = 'uploads/in_1789813828804_merged-from-zip-1789760618985-replaced-replaced (1).pdf'
doc = pymupdf.open(pdf_path)

# Let's extract first 2 pages into a test doc
test_doc = pymupdf.open()
test_doc.insert_pdf(doc, from_page=0, to_page=1)

rules = {
    "मतदार नोंदणी अधिकारी": "सहाय्यक मतदार नोंदणी अधिकारी",
    "ERO": "AERO",
    "Jagdish Narayan Katkar": "Vijay Dewoo Varak",
    "कणकवली": "कुडाळ",
    "Kankavli": "Kudal"
}

sorted_rules = sorted(rules.items(), key=lambda x: len(x[0]), reverse=True)

for page_idx in range(len(test_doc)):
    page = test_doc[page_idx]
    page_dict = page.get_text("dict")
    
    actions = []
    
    for block in page_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                span_text = span.get("text", "")
                if not span_text.strip():
                    continue
                
                # Check if any rule matches
                new_text = span_text
                matched = False
                for find_k, repl_v in sorted_rules:
                    if find_k in new_text:
                        new_text = new_text.replace(find_k, repl_v)
                        matched = True
                
                if matched:
                    bbox = pymupdf.Rect(span["bbox"])
                    f_size = float(span.get("size", 10.0))
                    c = span.get("color", 0)
                    if isinstance(c, int):
                        r = ((c >> 16) & 255) / 255.0
                        g = ((c >> 8) & 255) / 255.0
                        b = (c & 255) / 255.0
                        color = (r, g, b)
                    else:
                        color = (0.0, 0.0, 0.0)
                    
                    baseline_y = span.get("origin", (bbox.x0, bbox.y1 - 2.0))[1]
                    font_flags = span.get("flags", 0)
                    is_bold = bool(font_flags & 2 != 0 or "bold" in str(span.get("font", "")).lower())
                    
                    actions.append({
                        "bbox": bbox,
                        "orig_text": span_text,
                        "new_text": new_text,
                        "font_size": f_size,
                        "color": color,
                        "baseline_y": baseline_y,
                        "is_bold": is_bold,
                        "origin_x": span.get("origin", (bbox.x0, 0))[0]
                    })

    # Redact all matched spans completely
    for act in actions:
        b = act["bbox"]
        # generous clean redaction box
        redact_rect = pymupdf.Rect(b.x0 - 0.5, b.y0 - 1.5, b.x1 + 0.5, b.y1 + 1.2)
        page.add_redact_annot(redact_rect, fill=(1.0, 1.0, 1.0))
        
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
    
    # Insert new text
    for act in actions:
        txt = act["new_text"]
        if not txt:
            continue
        
        insert_pt = pymupdf.Point(act["origin_x"], act["baseline_y"])
        f_size = act["font_size"]
        color = act["color"]
        
        if is_devanagari(txt):
            page.insert_text(
                insert_pt,
                txt,
                fontname="dev_font",
                fontfile=marathi_font_path,
                fontsize=f_size,
                color=color
            )
        else:
            font_alias = "hebo" if act["is_bold"] else "helv"
            page.insert_text(
                insert_pt,
                txt,
                fontname=font_alias,
                fontsize=f_size,
                color=color
            )

out_test = "test_span_replaced.pdf"
test_doc.save(out_test)
print(f"Saved {out_test}")

# Render to images
for i, page in enumerate(test_doc):
    pix = page.get_pixmap(dpi=150)
    img_name = f"test_span_replaced_p{i+1}.png"
    pix.save(img_name)
    print(f"Saved {img_name}")

test_doc.close()
doc.close()
