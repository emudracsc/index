import sys
import os
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

def is_devanagari(text: str) -> bool:
    return any('\u0900' <= ch <= '\u097F' for ch in text)

def get_marathi_font_path():
    candidates = [
        r"C:\Windows\Fonts\Nirmala.ttf",
        r"C:\Windows\Fonts\mangal.ttf",
        r"C:\Windows\Fonts\aparaj.ttf",
        r"C:\Windows\Fonts\arial.ttf"
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

marathi_font_path = get_marathi_font_path()
marathi_font_obj = pymupdf.Font(fontfile=marathi_font_path) if marathi_font_path else None
helv_font_obj = pymupdf.Font("helv")
hebo_font_obj = pymupdf.Font("hebo")

def replace_in_doc(input_pdf: str, output_pdf: str, replacement_map: dict, max_pages: int = 4):
    doc = pymupdf.open(input_pdf)
    sorted_rules = sorted(replacement_map.items(), key=lambda x: len(x[0]), reverse=True)
    
    total_finds = 0
    total_replaces = 0
    pages_mod = 0
    
    # Process only up to max_pages
    pages_to_process = list(range(min(max_pages, len(doc))))
    
    for page_idx in pages_to_process:
        page = doc[page_idx]
        page_dict = page.get_text("dict")
        page_rect = page.rect
        actions = []
        
        # Strategy A: Span-level replacement (handles in-line phrases, suffixes, full titles cleanly)
        for b_idx, block in enumerate(page_dict.get("blocks", [])):
            if block.get("type") != 0:
                continue
            for l_idx, line in enumerate(block.get("lines", [])):
                for s_idx, span in enumerate(line.get("spans", [])):
                    span_text = span.get("text", "")
                    if not span_text.strip():
                        continue
                    
                    new_text = span_text
                    matched = False
                    
                    for find_k, repl_v in sorted_rules:
                        if not find_k:
                            continue
                        if find_k in new_text:
                            new_text = new_text.replace(find_k, repl_v)
                            matched = True
                            total_finds += 1
                            total_replaces += 1
                    
                    if matched:
                        bbox = pymupdf.Rect(span["bbox"])
                        f_size = float(span.get("size", 9.0))
                        c = span.get("color", 0)
                        if isinstance(c, int):
                            r = ((c >> 16) & 255) / 255.0
                            g = ((c >> 8) & 255) / 255.0
                            b = (c & 255) / 255.0
                            color = (r, g, b)
                        else:
                            color = (0.0, 0.0, 0.0)
                        
                        origin = span.get("origin", (bbox.x0, bbox.y1 - 1.5))
                        baseline_y = origin[1]
                        font_flags = span.get("flags", 0)
                        is_bold = bool(font_flags & 2 != 0 or "bold" in str(span.get("font", "")).lower())
                        
                        # Determine if right-aligned (e.g. signature block near right edge)
                        is_right_aligned = (bbox.x1 >= page_rect.width - 70 and bbox.x0 > page_rect.width * 0.5)
                        
                        actions.append({
                            "type": "span",
                            "bbox": bbox,
                            "orig_text": span_text,
                            "new_text": new_text,
                            "font_size": f_size,
                            "color": color,
                            "baseline_y": baseline_y,
                            "origin_x": origin[0],
                            "is_bold": is_bold,
                            "is_right_aligned": is_right_aligned
                        })
        
        # Strategy B: Fallback search_for for any multi-span text that wasn't caught by span-level
        for find_k, repl_v in sorted_rules:
            if not find_k:
                continue
            rects = page.search_for(find_k)
            for r in rects:
                already_covered = False
                for act in actions:
                    intersect = r & act["bbox"]
                    if not intersect.is_empty and intersect.get_area() > 0.3 * r.get_area():
                        already_covered = True
                        break
                if already_covered:
                    continue
                
                total_finds += 1
                total_replaces += 1
                f_size = max(7.0, min(36.0, r.height * 0.85))
                color = (0.0, 0.0, 0.0)
                baseline_y = r.y1 - (r.height * 0.15)
                is_bold = False
                
                actions.append({
                    "type": "rect",
                    "bbox": r,
                    "orig_text": find_k,
                    "new_text": repl_v,
                    "font_size": f_size,
                    "color": color,
                    "baseline_y": baseline_y,
                    "origin_x": r.x0,
                    "is_bold": is_bold,
                    "is_right_aligned": False
                })

        if actions:
            pages_mod += 1
            # Step 1: 100% Complete Redaction of old text
            for act in actions:
                b = act["bbox"]
                redact_rect = pymupdf.Rect(
                    b.x0 - 0.8,
                    b.y0 - 2.0,
                    b.x1 + 0.8,
                    b.y1 + 1.8
                )
                page.add_redact_annot(redact_rect, fill=(1.0, 1.0, 1.0))
            
            page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
            
            # Step 2: Insert new text cleanly at exact font size
            for act in actions:
                new_txt = act["new_text"]
                if not new_txt:
                    continue
                
                f_size = act["font_size"]
                color = act["color"]
                is_dev = is_devanagari(new_txt)
                font_obj = marathi_font_obj if is_dev else (hebo_font_obj if act["is_bold"] else helv_font_obj)
                
                try:
                    if font_obj:
                        txt_w = font_obj.text_length(new_txt, fontsize=f_size)
                    else:
                        txt_w = len(new_txt) * (f_size * 0.55)
                except Exception:
                    txt_w = len(new_txt) * (f_size * 0.55)
                
                if act["is_right_aligned"]:
                    insert_x = max(page_rect.width * 0.4, act["bbox"].x1 - txt_w)
                else:
                    insert_x = act["origin_x"]
                    if insert_x + txt_w > page_rect.width - 15:
                        excess = (insert_x + txt_w) - (page_rect.width - 15)
                        if insert_x - excess >= 15:
                            insert_x -= excess
                
                insert_pt = pymupdf.Point(insert_x, act["baseline_y"])
                
                if is_dev:
                    if marathi_font_path and os.path.exists(marathi_font_path):
                        page.insert_text(
                            insert_pt,
                            new_txt,
                            fontname="dev_font",
                            fontfile=marathi_font_path,
                            fontsize=f_size,
                            color=color
                        )
                    else:
                        page.insert_text(insert_pt, new_txt, fontsize=f_size, color=color)
                else:
                    font_alias = "hebo" if act["is_bold"] else "helv"
                    page.insert_text(
                        insert_pt,
                        new_txt,
                        fontname=font_alias,
                        fontsize=f_size,
                        color=color
                    )

    # Save test doc of these pages
    out_doc = pymupdf.open()
    out_doc.insert_pdf(doc, from_page=0, to_page=min(max_pages-1, len(doc)-1))
    out_doc.save(output_pdf)
    
    for i in range(len(out_doc)):
        pix = out_doc[i].get_pixmap(dpi=150)
        pix.save(f"test_perfect_p{i+1}.png")
        print(f"Saved test_perfect_p{i+1}.png")
        
    out_doc.close()
    doc.close()
    print(f"Finished. Total finds: {total_finds}, Total replaces: {total_replaces}, Modified pages: {pages_mod}")

replace_in_doc(
    input_pdf="uploads/in_1789813828804_merged-from-zip-1789760618985-replaced-replaced (1).pdf",
    output_pdf="outputs/perfect_replaced_4p.pdf",
    replacement_map={
        "मतदार नोंदणी अधिकारी": "सहाय्यक मतदार नोंदणी अधिकारी",
        "ERO": "AERO",
        "Jagdish Narayan Katkar": "Vijay Dewoo Varak",
        "कणकवली": "कुडाळ",
        "Kankavli": "Kudal"
    },
    max_pages=4
)
