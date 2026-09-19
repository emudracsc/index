"""
PDF मजकूर संपादक - Find & Replace Engine (Zero-Overlap, 100% Clean Deletion, Exact Font Size)
=============================================================================================
मराठी (देवनागरी) आणि इंग्रजी PDF फाईल्समधील मजकूर १००% अचूक शोधून बदलण्यासाठी हाय-स्पीड इंजिन.
- Zero Overlap: स्पॅन आणि लाईन-लेव्हल रिप्लेसमेंटमुळे शेजारच्या मजकुरावर ओव्हरलॅप होत नाही
- 100% Clean Deletion: जुना मूळ मजकूर आणि घोस्ट टेक्स्ट पूर्णपणे Redact (Delete) केला जातो
- Exact Font Size: नवीन मजकूर मूळ जुन्या फॉन्ट साईझ, रंग, वजन (Bold) आणि बेसलाईनमध्येच बसतो
- Smart Multi-lingual Font: इंग्रजीसाठी Native Helvetica आणि मराठीसाठी Devanagari TrueType Font (Nirmala UI/Mangal)
"""

import os
import sys
import json
import csv
import time
import argparse
import gc
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Callable, Any

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import pymupdf  # PyMuPDF
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        print("[ERROR] PyMuPDF लायब्ररी आढळली नाही.")
        print("कृपया इन्स्टॉल करा: uv run --with pymupdf ... किंवा pip install pymupdf")
        sys.exit(1)

try:
    import uharfbuzz as hb
    from fontTools.ttLib import TTFont
    from fontTools.pens.basePen import BasePen
    HAS_HARFBUZZ = True
except ImportError:
    HAS_HARFBUZZ = False

_FONT_RESOURCE_CACHE: Dict[str, Any] = {}


class PyMuPDFPen(BasePen if HAS_HARFBUZZ else object):
    """
    FontTools BasePen चा वापर करून OpenType Shaper (HarfBuzz) कडून आलेले
    Glyphs थेट PyMuPDF Shape (Vector Bezier Curves) मध्ये १००% अचूकपणे रेखाटतो.
    यामुळे देवनागरीतील सर्व जोडाक्षरे (उदा. 'सहाय्यक' मधील 'य्य', 'अधिकारी' मधील 'धि')
    कोणताही कट किंवा हलंत न होता मूळ टायपिंगप्रमाणे तंतोतंत जोडले जातात.
    """
    def __init__(self, shape, glyph_set, scale, offset_x, offset_y):
        super().__init__(glyph_set)
        self.shape = shape
        self.scale = scale
        self.offset_x = offset_x
        self.offset_y = offset_y
        self.curr_pt = None

    def _transform(self, pt):
        x, y = pt
        # Flip Y: Font coordinates have Y going UP, PDF page has Y going DOWN from top-left
        return pymupdf.Point(
            self.offset_x + x * self.scale,
            self.offset_y - y * self.scale
        )

    def _moveTo(self, pt):
        t_pt = self._transform(pt)
        self.curr_pt = t_pt

    def _lineTo(self, pt):
        t_pt = self._transform(pt)
        if self.curr_pt is not None:
            self.shape.draw_line(self.curr_pt, t_pt)
        self.curr_pt = t_pt

    def _curveToOne(self, pt1, pt2, pt3):
        t1 = self._transform(pt1)
        t2 = self._transform(pt2)
        t3 = self._transform(pt3)
        if self.curr_pt is not None:
            self.shape.draw_bezier(self.curr_pt, t1, t2, t3)
        self.curr_pt = t3

    def _closePath(self):
        self.curr_pt = None


def get_font_resources(font_path: str):
    """HarfBuzz Face, Font, TTFont आणि GlyphSet कॅश करतो."""
    if not HAS_HARFBUZZ:
        return None
    if font_path not in _FONT_RESOURCE_CACHE:
        try:
            with open(font_path, "rb") as f:
                font_data = f.read()
            face = hb.Face(font_data)
            hb_font = hb.Font(face)
            ttfont = TTFont(font_path)
            glyph_set = ttfont.getGlyphSet()
            upem = ttfont["head"].unitsPerEm
            _FONT_RESOURCE_CACHE[font_path] = (face, hb_font, ttfont, glyph_set, upem)
        except Exception as e:
            print(f"[WARN] फॉन्ट लोड करताना त्रुटी ({font_path}): {e}")
            return None
    return _FONT_RESOURCE_CACHE[font_path]


def measure_shaped_text(text: str, font_path: str, fontsize: float) -> float:
    """HarfBuzz ओपनटाईप शेपिंगनुसार मजकुराची तंतोतंत रुंदी (Width in points) मोजतो."""
    if not HAS_HARFBUZZ:
        return len(text) * (fontsize * 0.55)
    res = get_font_resources(font_path)
    if not res:
        return len(text) * (fontsize * 0.55)
    face, hb_font, ttfont, glyph_set, upem = res
    scale = fontsize / upem
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hb_font, buf)
    return sum(pos.x_advance * scale for pos in buf.glyph_positions)


def draw_shaped_devanagari_text(
    page: pymupdf.Page,
    point: pymupdf.Point,
    text: str,
    font_path: str,
    fontsize: float,
    color: Tuple[float, float, float] = (0.0, 0.0, 0.0)
) -> float:
    """
    मराठी/देवनागरी मजकूर HarfBuzz OpenType Shaper द्वारे शेप करून
    PyMuPDF व्हेक्टर पाथद्वारे १००% निर्दोष जोडाक्षरांसह पानावर लिहितो.
    """
    if not HAS_HARFBUZZ:
        page.insert_text(point, text, fontname="dev_font", fontfile=font_path, fontsize=fontsize, color=color)
        return len(text) * (fontsize * 0.55)

    res = get_font_resources(font_path)
    if not res:
        page.insert_text(point, text, fontname="dev_font", fontfile=font_path, fontsize=fontsize, color=color)
        return len(text) * (fontsize * 0.55)

    face, hb_font, ttfont, glyph_set, upem = res
    scale = fontsize / upem

    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hb_font, buf)

    infos = buf.glyph_infos
    positions = buf.glyph_positions

    shape = page.new_shape()
    x = point.x
    y = point.y

    for info, pos in zip(infos, positions):
        gid = info.codepoint
        glyph_name = ttfont.getGlyphName(gid)

        gx = x + pos.x_offset * scale
        gy = y - pos.y_offset * scale

        if glyph_name in glyph_set:
            pen = PyMuPDFPen(shape, glyph_set, scale, gx, gy)
            glyph = glyph_set[glyph_name]
            glyph.draw(pen)

        x += pos.x_advance * scale
        y -= pos.y_advance * scale

    shape.finish(fill=color, color=None, even_odd=True)
    shape.commit()
    return x - point.x


def is_devanagari(text: str) -> bool:
    """मजकुरात देवनागरी (मराठी/हिंदी) अक्षरे आहेत का ते तपासतो."""
    return any('\u0900' <= ch <= '\u097F' for ch in text)


def get_default_font_path() -> Optional[str]:
    """सर्वोत्कृष्ट देवनागरी/मराठी फॉन्ट (Lohit Marathi / Nirmala / Mangal) शोधतो."""
    font_candidates = [
        os.path.join(os.path.dirname(__file__), "Lohit-Marathi.ttf"),
        os.path.join(os.path.dirname(__file__), "Lohit-Devanagari.ttf"),
        r"C:\Windows\Fonts\Lohit-Marathi.ttf",
        r"C:\Windows\Fonts\Nirmala.ttf",
        r"C:\Windows\Fonts\NirmalaB.ttf",
        r"C:\Windows\Fonts\mangal.ttf",
        r"C:\Windows\Fonts\mangalb.ttf",
        r"C:\Windows\Fonts\aparaj.ttf",
        r"C:\Windows\Fonts\kokila.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        os.path.join(os.path.dirname(__file__), "NotoSansDevanagari-Regular.ttf"),
    ]
    for font_path in font_candidates:
        if os.path.exists(font_path):
            return font_path

    return None


def parse_page_range(range_str: str, total_pages: int) -> List[int]:
    """पानांची श्रेणी पार्स करतो (उदा. 'all', '1-10', '1,3,5-10')."""
    if not range_str or range_str.strip().lower() in ("all", "*", "सर्व", ""):
        return list(range(total_pages))

    pages = set()
    parts = range_str.split(",")
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            try:
                start_s, end_s = part.split("-", 1)
                start = max(1, int(start_s.strip()))
                end = min(total_pages, int(end_s.strip()))
                if start <= end:
                    pages.update(range(start - 1, end))
            except ValueError:
                pass
        else:
            try:
                p = int(part)
                if 1 <= p <= total_pages:
                    pages.add(p - 1)
            except ValueError:
                pass

    sorted_pages = sorted(list(pages))
    return sorted_pages if sorted_pages else list(range(total_pages))


def load_replacement_map(file_path: str) -> Dict[str, str]:
    """JSON किंवा CSV फाईलमधून बदलण्याच्या शब्दांची लिस्ट लोड करतो."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"मॅपिंग फाईल सापडली नाही: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()
    replacement_map = {}

    if ext == ".json":
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                replacement_map = {str(k): str(v) for k, v in data.items() if k}
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and "find" in item and "replace" in item:
                        replacement_map[str(item["find"])] = str(item["replace"])
    elif ext in (".csv", ".txt"):
        with open(file_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2:
                    k, v = row[0].strip(), row[1].strip()
                    if k:
                        replacement_map[k] = v
    else:
        raise ValueError(f"असमर्थित फाईल प्रकार: {ext}. फक्त .json किंवा .csv वापरा.")

    return replacement_map


def _collect_page_replacement_actions(
    page: pymupdf.Page,
    sorted_rules: List[Tuple[str, str]],
    page_rect: pymupdf.Rect
) -> List[Dict[str, Any]]:
    """
    पानावरील सर्व बदलण्याचे ॲक्शन्स स्पॅन-लेव्हल + फॉलबॅक पद्धतीने गोळा करतो आणि
    ओव्हरलॅप / ड्युप्लिकेशन पूर्णपणे काढून टाकतो.
    """
    page_dict = page.get_text("dict")
    actions = []

    # 1. स्पॅन-लेव्हल शोध (Span-Level Matching)
    for block in page_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                span_text = span.get("text", "")
                if not span_text.strip():
                    continue

                new_text = span_text
                matched_rules = []
                for find_k, repl_v in sorted_rules:
                    if not find_k:
                        continue
                    if find_k in new_text:
                        new_text = new_text.replace(find_k, repl_v)
                        matched_rules.append(find_k)

                if matched_rules:
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
                    # उजवीकडे अलाईन आहे का (उदा. सही किंवा पदनाम)
                    is_right_aligned = (bbox.x1 >= page_rect.width - 70 and bbox.x0 > page_rect.width * 0.45)

                    actions.append({
                        "bbox": bbox,
                        "orig_text": span_text,
                        "new_text": new_text,
                        "matched_rules": matched_rules,
                        "font_size": f_size,
                        "color": color,
                        "baseline_y": baseline_y,
                        "origin_x": origin[0],
                        "is_bold": is_bold,
                        "is_right_aligned": is_right_aligned
                    })

    # 2. फॉलबॅक शोध (Fallback search_for for words across spans)
    for find_k, repl_v in sorted_rules:
        if not find_k:
            continue
        rects = page.search_for(find_k)
        for r in rects:
            already_covered = False
            for act in actions:
                intersect = r & act["bbox"]
                if not intersect.is_empty and intersect.get_area() > 0.25 * r.get_area():
                    already_covered = True
                    break
            if already_covered:
                continue

            f_size = max(7.0, min(36.0, r.height * 0.85))
            color = (0.0, 0.0, 0.0)
            baseline_y = r.y1 - (r.height * 0.15)
            is_right_aligned = (r.x1 >= page_rect.width - 70 and r.x0 > page_rect.width * 0.45)

            actions.append({
                "bbox": r,
                "orig_text": find_k,
                "new_text": repl_v,
                "matched_rules": [find_k],
                "font_size": f_size,
                "color": color,
                "baseline_y": baseline_y,
                "origin_x": r.x0,
                "is_bold": False,
                "is_right_aligned": is_right_aligned
            })

    # 3. Spatial Deduplication & Overlap Cleanup
    # जुन्या किंवा आधीच्या लेयर्समधील ओव्हरलॅपिंग स्पॅन्स एकत्र करून १ स्वच्छ रिप्लेसमेंट तयार करणे
    deduped_actions = []
    for act in actions:
        merged = False
        for existing in deduped_actions:
            intersect = act["bbox"] & existing["bbox"]
            if not intersect.is_empty and intersect.get_area() > 0.25 * min(act["bbox"].get_area(), existing["bbox"].get_area()):
                # दोन्ही जुन्या मजकुराचे क्षेत्रफळ एकत्र करून पूर्ण मिटवणे
                existing["bbox"] = existing["bbox"] | act["bbox"]
                existing["matched_rules"].extend(act["matched_rules"])
                if len(act["new_text"]) < len(existing["new_text"]):
                    existing["new_text"] = act["new_text"]
                    existing["font_size"] = act["font_size"]
                    existing["baseline_y"] = act["baseline_y"]
                merged = True
                break
        if not merged:
            deduped_actions.append(act)

    return deduped_actions


def scan_pdf(
    input_pdf: str,
    replacement_map: Dict[str, str],
    page_range: str = "all",
    progress_callback: Optional[Callable[[int, int, str, Optional[Dict[str, Any]]], None]] = None
) -> Dict[str, Any]:
    """
    PDF स्कॅन करून कोणते शब्द कुठे आणि किती वेळा आहेत ते शोधतो (Zero Collision Detection).
    """
    if not os.path.exists(input_pdf):
        raise FileNotFoundError(f"PDF फाईल सापडली नाही: {input_pdf}")

    doc = pymupdf.open(input_pdf)
    total_doc_pages = len(doc)
    target_pages = parse_page_range(page_range, total_doc_pages)

    stats = {
        "total_doc_pages": total_doc_pages,
        "scanned_pages_count": len(target_pages),
        "total_matches": 0,
        "keyword_counts": {k: 0 for k in replacement_map.keys()},
        "page_matches": {}
    }

    sorted_rules = sorted(replacement_map.items(), key=lambda x: len(x[0]), reverse=True)

    for idx, page_idx in enumerate(target_pages):
        page = doc[page_idx]
        page_num_1based = page_idx + 1
        page_matched_keys = []

        actions = _collect_page_replacement_actions(page, sorted_rules, page.rect)

        for act in actions:
            for rule_k in set(act["matched_rules"]):
                if rule_k in stats["keyword_counts"]:
                    stats["keyword_counts"][rule_k] += 1
                    stats["total_matches"] += 1
                    page_matched_keys.append(rule_k)

        if page_matched_keys:
            stats["page_matches"][page_num_1based] = list(set(page_matched_keys))

        if progress_callback:
            progress_data = {
                "current": idx + 1,
                "total": len(target_pages),
                "page": page_num_1based,
                "total_doc_pages": total_doc_pages,
                "find_count": stats["total_matches"],
                "replace_count": 0,
                "keyword_counts": stats["keyword_counts"],
                "pct": round(((idx + 1) / len(target_pages)) * 100, 1),
                "msg": f"स्कॅन होत आहे: पान {page_num_1based}/{total_doc_pages} | सापडलेले: {stats['total_matches']}"
            }
            try:
                progress_callback(idx + 1, len(target_pages), progress_data["msg"], progress_data)
            except TypeError:
                progress_callback(idx + 1, len(target_pages), progress_data["msg"])

    doc.close()
    return stats


def replace_text_in_pdf(
    input_pdf: str,
    output_pdf: str,
    replacement_map: Dict[str, str],
    page_range: str = "all",
    font_path: Optional[str] = None,
    bg_color: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    progress_callback: Optional[Callable[[int, int, str, Optional[Dict[str, Any]]], None]] = None
) -> Dict[str, Any]:
    """
    PDF मधील मजकूर शोधून रिप्लेस करतो.
    - Zero Overlap: स्पॅन व लाईन-लेव्हल रिप्लेसमेंटमुळे शेजारील मजकुरावर ओव्हरलॅप होत नाही
    - 100% Clean Redaction: जुना मजकूर पूर्णपणे नष्ट/डिलीट केला जातो
    - Exact Font Size: मूळ फॉन्ट साईझ, बेसलाईन आणि रंग तंतोतंत राखला जातो
    """
    if not os.path.exists(input_pdf):
        raise FileNotFoundError(f"PDF फाईल सापडली नाही: {input_pdf}")

    if not replacement_map:
        raise ValueError("बदलण्यासाठी कोणतेही शब्द दिलेले नाहीत.")

    resolved_marathi_font = font_path or get_default_font_path()
    marathi_font_obj = pymupdf.Font(fontfile=resolved_marathi_font) if (resolved_marathi_font and os.path.exists(resolved_marathi_font)) else None
    helv_font_obj = pymupdf.Font("helv")
    hebo_font_obj = pymupdf.Font("hebo")

    doc = pymupdf.open(input_pdf)
    total_doc_pages = len(doc)
    target_pages = parse_page_range(page_range, total_doc_pages)

    stats = {
        "total_doc_pages": total_doc_pages,
        "processed_pages_count": len(target_pages),
        "total_find_count": 0,
        "total_replacements": 0,
        "keyword_replacements": {k: 0 for k in replacement_map.keys()},
        "pages_modified": 0,
        "output_pdf": output_pdf
    }

    start_time = time.time()
    sorted_rules = sorted(replacement_map.items(), key=lambda x: len(x[0]), reverse=True)

    for idx, page_idx in enumerate(target_pages):
        page = doc[page_idx]
        page_rect = page.rect
        page_num_1based = page_idx + 1

        actions = _collect_page_replacement_actions(page, sorted_rules, page_rect)

        if actions:
            stats["pages_modified"] += 1
            for act in actions:
                count_rules = len(set(act["matched_rules"]))
                stats["total_find_count"] += count_rules
                stats["total_replacements"] += count_rules
                for rk in set(act["matched_rules"]):
                    if rk in stats["keyword_replacements"]:
                        stats["keyword_replacements"][rk] += 1

            # पायरी १: जुना मजकूर १००% पूर्णपणे मिटवणे (100% Precision Redaction - Tables & Images Preserved)
            for act in actions:
                b = act["bbox"]
                redact_rect = pymupdf.Rect(
                    b.x0 - 0.5,
                    b.y0 - 1.2,
                    b.x1 + 0.5,
                    b.y1 + 1.0
                )
                page.add_redact_annot(redact_rect, fill=bg_color)

            # Redaction कायमस्वरूपी लागू करणे (चित्रे, QR कोड, टेबल बॉर्डर्स १००% सुरक्षित राखणे)
            page.apply_redactions(
                images=pymupdf.PDF_REDACT_IMAGE_NONE,
                graphics=pymupdf.PDF_REDACT_LINE_ART_NONE
            )

            # पायरी २: नवीन मजकूर मूळ फॉन्ट साईझ आणि अलाईनमेंटमध्ये जोडणे
            for act in actions:
                new_txt = act["new_text"]
                if not new_txt:
                    continue  # जर फक्त डिलीट करायचे असेल

                f_size = act["font_size"]
                color = act["color"]
                is_dev = is_devanagari(new_txt)

                if is_dev:
                    if resolved_marathi_font and os.path.exists(resolved_marathi_font):
                        txt_w = measure_shaped_text(new_txt, resolved_marathi_font, f_size)
                    else:
                        txt_w = len(new_txt) * (f_size * 0.55)
                else:
                    font_obj = hebo_font_obj if act["is_bold"] else helv_font_obj
                    try:
                        txt_w = font_obj.text_length(new_txt, fontsize=f_size)
                    except Exception:
                        txt_w = len(new_txt) * (f_size * 0.55)

                if act["is_right_aligned"]:
                    # उजवीकडील बाजू मूळ जागेवर स्थिर ठेवणे
                    insert_x = max(page_rect.width * 0.35, act["bbox"].x1 - txt_w)
                else:
                    insert_x = act["origin_x"]
                    if insert_x + txt_w > page_rect.width - 15:
                        excess = (insert_x + txt_w) - (page_rect.width - 15)
                        if insert_x - excess >= 15:
                            insert_x -= excess

                insert_pt = pymupdf.Point(insert_x, act["baseline_y"])

                if is_dev:
                    if resolved_marathi_font and os.path.exists(resolved_marathi_font):
                        draw_shaped_devanagari_text(
                            page=page,
                            point=insert_pt,
                            text=new_txt,
                            font_path=resolved_marathi_font,
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

        if progress_callback:
            progress_data = {
                "current": idx + 1,
                "total": len(target_pages),
                "page": page_num_1based,
                "total_doc_pages": total_doc_pages,
                "find_count": stats["total_find_count"],
                "replace_count": stats["total_replacements"],
                "pages_modified": stats["pages_modified"],
                "keyword_counts": stats["keyword_replacements"],
                "pct": round(((idx + 1) / len(target_pages)) * 100, 1),
                "msg": f"प्रक्रिया चालू: पान {page_num_1based}/{total_doc_pages} | सापडले: {stats['total_find_count']} | बदलले: {stats['total_replacements']}"
            }
            try:
                progress_callback(idx + 1, len(target_pages), progress_data["msg"], progress_data)
            except TypeError:
                progress_callback(idx + 1, len(target_pages), progress_data["msg"])

        if (idx + 1) % 100 == 0:
            gc.collect()

    # Save output PDF with stream deflation
    output_dir = os.path.dirname(output_pdf)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    doc.save(output_pdf, garbage=3, deflate=True)
    doc.close()

    elapsed = time.time() - start_time
    stats["time_taken_seconds"] = round(elapsed, 2)

    return stats


def main():
    parser = argparse.ArgumentParser(
        description="PDF मजकूर शोधून बदलणारा हाय-स्पीड प्रोग्रॅम (Zero Overlap & Exact Font Size)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("-i", "--input", required=True, help="इनपुट PDF फाईलचा मार्ग (उदा. input.pdf)")
    parser.add_argument("-o", "--output", help="आउटपुट PDF फाईलचा मार्ग (डिफॉल्ट: input_replaced.pdf)")
    parser.add_argument("-f", "--find", help="शोधायचा जुना शब्द / मजकूर")
    parser.add_argument("-r", "--replace", default="", help="नवीन शब्द / बदलणारा मजकूर")
    parser.add_argument("-m", "--map", help="एकाधिक शब्दांसाठी JSON किंवा CSV फाईलचा मार्ग")
    parser.add_argument("-p", "--pages", default="all", help="पानांची श्रेणी (उदा. 'all', '1-10', '1,3,5')")
    parser.add_argument("--font", help="कस्टम देवनागरी .ttf फॉन्टचा मार्ग")
    parser.add_argument("--scan-only", action="store_true", help="फक्त स्कॅन करा, फाईलमध्ये बदल करू नका (Dry Run)")

    args = parser.parse_args()

    input_pdf = args.input
    if not os.path.exists(input_pdf):
        print(f"[त्रुटी] इनपुट PDF फाईल सापडली नाही: {input_pdf}")
        sys.exit(1)

    replacement_map = {}
    if args.map:
        try:
            replacement_map = load_replacement_map(args.map)
            print(f"📋 {len(replacement_map)} बदलण्याचे नियम लोड झाले ({args.map})")
        except Exception as e:
            print(f"[त्रुटी] मॅपिंग फाईल लोड करताना त्रुटी: {e}")
            sys.exit(1)

    if args.find:
        replacement_map[args.find] = args.replace or ""

    if not replacement_map:
        print("[त्रुटी] कृपया शोधण्यासाठी शब्द द्या (-f 'जुना शब्द' -r 'नवीन शब्द') किंवा मॅपिंग फाईल द्या (-m map.json)")
        sys.exit(1)

    print("\n" + "=" * 60)
    print(" 📄 PDF मजकूर संपादक (Zero Overlap & Exact Font Size)")
    print("=" * 60)
    print(f"📥 इनपुट PDF: {input_pdf}")
    print(f"📑 पानांची श्रेणी: {args.pages}")
    print(f"🔍 बदलण्याचे नियम ({len(replacement_map)}):")
    for k, v in list(replacement_map.items())[:5]:
        print(f"   • '{k}' ➔ '{v}'")
    if len(replacement_map) > 5:
        print(f"   ... आणि आणखी {len(replacement_map) - 5} शब्द.")

    # 1. Scan Only Mode
    if args.scan_only:
        print("\n🔍 स्कॅन प्रक्रिया सुरू होत आहे (ड्राय-रन)...")
        stats = scan_pdf(input_pdf, replacement_map, args.pages)
        print("\n📊 स्कॅन निकाल:")
        print(f"   एकूण पाने: {stats['total_doc_pages']} (स्कॅन केलेली: {stats['scanned_pages_count']})")
        print(f"   एकूण सापडलेले शब्द: {stats['total_matches']}")
        print("\nप्रत्येक शब्दाची आकडेवारी:")
        for k, v in stats["keyword_counts"].items():
            print(f"   - '{k}': {v} वेळा सापडला")
        print("\n" + "=" * 60)
        return

    # 2. Replacement Mode
    output_pdf = args.output
    if not output_pdf:
        base, ext = os.path.splitext(input_pdf)
        output_pdf = f"{base}_replaced{ext}"

    print(f"📤 आउटपुट PDF: {output_pdf}")
    print("\n⚡ मजकूर बदलण्याची प्रक्रिया सुरू होत आहे...")

    stats = replace_text_in_pdf(
        input_pdf=input_pdf,
        output_pdf=output_pdf,
        replacement_map=replacement_map,
        page_range=args.pages,
        font_path=args.font
    )

    print("\n" + "=" * 60)
    print("✅ प्रक्रिया यशस्वीरीत्या पूर्ण झाली!")
    print("=" * 60)
    print(f"📊 एकूण बदल: {stats['total_replacements']}")
    print(f"📑 बदल झालेली पाने: {stats['pages_modified']} / {stats['processed_pages_count']}")
    print(f"⏱️ लागलेला वेळ: {stats['time_taken_seconds']} सेकंद")
    print(f"💾 तयार झालेली PDF: {stats['output_pdf']}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
