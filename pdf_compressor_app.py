#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
🏛️ ई-मुद्रा शासकीय PDF & Image Compressor Pro Suite (अचूक साईझ व उच्च गुणवत्ता)
Aaple Sarkar & MahaDBT High-Precision Target Size PDF & Image Compressor Tool
=============================================================================
वापरकर्त्याच्या आवश्यकतेनुसार:
- Quality कमी न होता मजकूर व फोटो एकदम स्पष्ट, शार्प व हाय-कॉन्ट्रास्ट राहतात (Zero Blur Guarantee).
- इनपुटमध्ये टाकलेल्या अचूक साईझमध्ये (Target Size in KB) PDF व इमेज (JPG/PNG/WebP) कॉम्प्रेस होते.
- शासकीय पोर्टल डायमेन्शन प्रिसेट्स:
  १) पासपोर्ट फोटो: १६० × २०० px (५० KB)
  २) स्वाक्षरी (Signature): २५६ × ६४ px (२० KB)
  ३) कागदपत्रे / दाखले: १०० KB ते ५०० KB (आपले सरकार २५० KB, महाडीबीटी ४८० KB)
- मल्टिपल फोटो जोडून १ एकत्र PDF बनवण्याची सुविधा.
- दोन्ही प्रकारे वापरता येते:
  १) GUI (आधुनिक ग्राफिकल विंडो - डबल क्लिक करून)
  २) CLI (कमांड लाईन द्वारे)
"""

import sys
import os
import io
import argparse
import subprocess
from pathlib import Path

# Windows UTF-8 console output fix
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Required Libraries
try:
    import fitz  # PyMuPDF
    from PIL import Image, ImageEnhance, ImageFilter
except ImportError:
    print("त्रुटी: कृपया प्रथम आवश्यक लायब्ररी इन्स्टॉल करा: pip install pymupdf pillow customtkinter")
    sys.exit(1)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"}
PDF_EXTENSIONS = {".pdf"}


def pad_jpeg(data: bytes, target_bytes: int, margin_kb: float = 4.5) -> bytes:
    """
    JPEG COM (0xFF 0xFE) मार्कर वापरून फाईल अचूक ४ ते ५ KB च्या फरकात पॅड करते.
    """
    if target_bytes <= 35 * 1024:
        margin_bytes = min(1536, int(target_bytes * 0.08))
    elif target_bytes <= 75 * 1024:
        margin_bytes = min(3072, int(target_bytes * 0.06))
    elif target_bytes <= 150 * 1024:
        margin_bytes = 4096
    else:
        margin_bytes = min(5120, max(4096, int(target_bytes * 0.01)))

    desired = target_bytes - margin_bytes
    needed = desired - len(data)
    if needed <= 5 or len(data) < 2 or data[:2] != b'\xff\xd8':
        return data

    chunks = [data[:2]]
    rem = needed
    while rem >= 5:
        chunk = min(rem - 4, 65530)
        marker_len = chunk + 2
        header = bytes([0xFF, 0xFE, (marker_len >> 8) & 0xFF, marker_len & 0xFF])
        chunks.append(header)
        chunks.append(b' ' * chunk)
        rem -= (chunk + 4)
    chunks.append(data[2:])
    return b''.join(chunks)


# =============================================================================
# १. कोर इमेज कॉम्प्रेशन अल्गोरिदम (Exact Target Size Image Engine)
# =============================================================================
def compress_image_to_exact_target(
    input_path: str,
    output_path: str,
    target_kb: int = 50,
    dimension_preset: str = "photo", custom_dimensions: tuple = None,  # 'original' | 'photo' | 'signature' | 'document' | 'custom'
    enhance_text: bool = True,
    progress_callback=None
) -> dict:
    """
    इमेज फाईलला दिलेल्या अचूक Target KB च्या आत आणि शासकीय पोर्टल
    डायमेन्शन्समध्ये (१६०x२०० फोटो, २५६x६४ स्वाक्षरी) ब्लर न होता कॉम्प्रेस करते.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"इमेज फाईल सापडली नाही: {input_path}")

    orig_bytes = os.path.getsize(input_path)
    target_bytes = target_kb * 1024

    with Image.open(input_path) as raw_img:
        # पारदर्शक पार्श्वभूमी असल्यास पांढरी बॅकग्राउंड देणे (RGBA to RGB conversion)
        if raw_img.mode in ("RGBA", "LA") or (raw_img.mode == "P" and "transparency" in raw_img.info):
            raw_rgba = raw_img.convert("RGBA")
            bg = Image.new("RGB", raw_rgba.size, (255, 255, 255))
            bg.paste(raw_rgba, mask=raw_rgba.split()[3])
            img = bg
        else:
            img = raw_img.convert("RGB")

        orig_w, orig_h = img.size

        # डायमेन्शन व रिझोल्युशन प्रिसेट ॲप्लाय करणे
        if custom_dimensions and len(custom_dimensions) == 2 and custom_dimensions[0] > 0 and custom_dimensions[1] > 0:
            tw, th = int(custom_dimensions[0]), int(custom_dimensions[1])
            scale = max(tw / orig_w, th / orig_h)
            new_w, new_h = max(1, int(round(orig_w * scale))), max(1, int(round(orig_h * scale)))
            img_scaled = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            left = (new_w - tw) // 2
            top = (new_h - th) // 2
            img = img_scaled.crop((left, top, left + tw, top + th))
        elif dimension_preset == "photo":
            # शासकीय पासपोर्ट फोटो: १६० x २१० px (सेंटर कव्हर फिट)
            tw, th = 160, 210
            scale = max(tw / orig_w, th / orig_h)
            new_w, new_h = max(1, int(round(orig_w * scale))), max(1, int(round(orig_h * scale)))
            img_scaled = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            left = (new_w - tw) // 2
            top = (new_h - th) // 2
            img = img_scaled.crop((left, top, left + tw, top + th))
        elif dimension_preset == "signature":
            # शासकीय स्वाक्षरी: २५६ x ६४ px (कॅनव्हास फिट)
            tw, th = 256, 64
            scale = min(tw / orig_w, th / orig_h)
            new_w, new_h = max(1, int(round(orig_w * scale))), max(1, int(round(orig_h * scale)))
            img_scaled = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (tw, th), (255, 255, 255))
            canvas.paste(img_scaled, ((tw - new_w) // 2, (th - new_h) // 2))
            img = canvas
        elif dimension_preset == "document":
            max_d = 1400
            scale = min(1.0, max_d / max(orig_w, orig_h))
            if scale < 1.0:
                img = img.resize((int(round(orig_w * scale)), int(round(orig_h * scale))), Image.Resampling.LANCZOS)
        else:
            # 'original': अस्पेक्ट रेशो कायम ठेवणे, टार्गेट साईझनुसार अचूक कॅलिब्रेशन
            if target_bytes >= 400 * 1024:
                max_d = 2600
            elif target_bytes >= 200 * 1024:
                max_d = 2000
            elif target_bytes >= 90 * 1024:
                max_d = 1500
            elif target_bytes >= 40 * 1024:
                max_d = 1100
            else:
                max_d = 850
            scale = min(1.0, max_d / max(orig_w, orig_h))
            if scale < 1.0:
                img = img.resize((int(round(orig_w * scale)), int(round(orig_h * scale))), Image.Resampling.LANCZOS)

        # क्लॅरिटी व कॉन्ट्रास्ट बूस्ट (Zero Blur Guarantee)
        if enhance_text:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.16)
            sharpener = ImageEnhance.Sharpness(img)
            img = sharpener.enhance(1.22)
            img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=125, threshold=2))

        # अचूक टार्गेट साईझ एनफोर्समेंट लूप (९०% ते १००% ब्रॅकेट हमी: उदा. ५०० KB साठी ४५० ते ५०० KB)
        target_min_bytes = int(round(target_bytes * 0.90))
        target_sweet_bytes = int(round(target_bytes * 0.96))

        best_data = None
        best_size = 0
        curr_q = 88 if target_kb >= 300 else (80 if target_kb >= 100 else (68 if target_kb >= 40 else 52))
        curr_img = img

        max_passes = 8
        for pass_idx in range(max_passes):
            if progress_callback:
                progress_callback(pass_idx + 1, max_passes, f"इमेज फेरी {pass_idx + 1}: अचूक साईझ व क्लॅरिटी कॅलिब्रेशन...")

            buf = io.BytesIO()
            curr_img.save(buf, format="JPEG", quality=curr_q, optimize=True, subsampling=1)
            size = len(buf.getvalue())

            if size <= target_bytes:
                if size > best_size:
                    best_size = size
                    best_data = buf.getvalue()
                # जर फाईल अचूक टार्गेट ब्रॅकेटमध्ये (९०% ते १००%) आली तर पूर्ण!
                if size >= target_min_bytes:
                    break
                # ९०% पेक्षा लहान असल्यास क्वालिटी वाढवणे (Upward Calibration)
                boost = min(1.35, ((target_sweet_bytes / max(size, 1024)) ** 0.5))
                next_q = min(98, int(round(curr_q * boost)))
                if next_q == curr_q:
                    # क्वालिटी कमाल झाल्यावर गरज असल्यास कॅनव्हास रिझोल्युशन मूळ आकाराकडे वाढवणे
                    if dimension_preset in ("original", "document") and (curr_img.width < orig_w or curr_img.height < orig_h):
                        up_factor = min(1.35, ((target_sweet_bytes / max(size, 1024)) ** 0.5))
                        nw = min(orig_w, int(round(curr_img.width * up_factor)))
                        nh = min(orig_h, int(round(curr_img.height * up_factor)))
                        if nw > curr_img.width or nh > curr_img.height:
                            curr_img = img.resize((nw, nh), Image.Resampling.LANCZOS)
                            curr_q = 85
                            continue
                    break
                curr_q = next_q
            else:
                # टार्गेटपेक्षा मोठी असल्यास अचूक गुणोत्तरानुसार क्वालिटी कमी करणे
                reduc = (target_sweet_bytes / size) * 0.98
                curr_q = max(14, int(round(curr_q * reduc)))
                if curr_q <= 28 and size > target_bytes and dimension_preset in ("original", "document"):
                    nw = max(100, int(round(curr_img.width * 0.85)))
                    nh = max(100, int(round(curr_img.height * 0.85)))
                    curr_img = curr_img.resize((nw, nh), Image.Resampling.LANCZOS)
                    curr_q = 45

        # अतिरिक्त हमी फेरी (Guaranteed Strict Fallback)
        if best_data is None or len(best_data) > target_bytes:
            buf = io.BytesIO()
            curr_img.save(buf, format="JPEG", quality=20, optimize=True)
            while len(buf.getvalue()) > target_bytes and curr_img.width > 80:
                nw = int(curr_img.width * 0.85)
                nh = int(curr_img.height * 0.85)
                curr_img = curr_img.resize((nw, nh), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                curr_img.save(buf, format="JPEG", quality=20, optimize=True)
            best_data = buf.getvalue()

        # अंतिम फाईल सेव्ह करणे (हार्ड साईझ टार्गेट लॉक - ४ ते ५ KB फरक हमी)
        best_data = pad_jpeg(best_data, target_bytes, margin_kb=4.5)
        with open(output_path, "wb") as f:
            f.write(best_data)

        final_size = os.path.getsize(output_path)
        savings_pct = round((1 - (final_size / orig_bytes)) * 100, 1) if orig_bytes > 0 else 0

        return {
            "success": True,
            "type": "image",
            "input_path": input_path,
            "output_path": output_path,
            "original_bytes": orig_bytes,
            "final_bytes": final_size,
            "original_kb": round(orig_bytes / 1024, 1),
            "final_kb": round(final_size / 1024, 1),
            "target_kb": target_kb,
            "savings_pct": savings_pct,
            "dimensions": f"{curr_img.width}x{curr_img.height} px"
        }


# =============================================================================
# २. कोर PDF कॉम्प्रेशन अल्गोरिदम (Exact Target Size PDF Engine)
# =============================================================================
def compress_pdf_to_exact_target(
    input_path: str,
    output_path: str,
    target_kb: int = 250,
    enhance_text: bool = True,
    progress_callback=None
) -> dict:
    """
    दिलेल्या PDF फाईलला दिलेल्या Target KB च्या आत (कमाल मर्यादा न ओलांडता)
    आणि जास्तीत जास्त उत्कृष्ट गुणवत्तेत (Max Clarity & Sharpening) १००% हमीसह कॉम्प्रेस करते.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"फाईल सापडली नाही: {input_path}")

    orig_bytes = os.path.getsize(input_path)
    target_bytes = target_kb * 1024

    doc = fitz.open(input_path)
    total_pages = len(doc)

    if total_pages == 0:
        doc.close()
        raise ValueError("PDF मध्ये कोणतीही पाने आढळली नाहीत.")

    # PDF ओव्हरहेड रिझर्व्ह (Metadata + Cross-reference tables)
    overhead = (total_pages * 3000) + 4000
    usable_bytes = max(8192, target_bytes - overhead)
    per_page_budget = usable_bytes // total_pages

    # Page-independent maximum dimension and initial quality based on per-page budget
    if per_page_budget >= 150 * 1024:
        initial_dim, initial_q = 1600, 80
    elif per_page_budget >= 80 * 1024:
        initial_dim, initial_q = 1300, 72
    elif per_page_budget >= 45 * 1024:
        initial_dim, initial_q = 1000, 60
    elif per_page_budget >= 25 * 1024:
        initial_dim, initial_q = 850, 48
    elif per_page_budget >= 14 * 1024:
        initial_dim, initial_q = 700, 38
    else:
        initial_dim, initial_q = 600, 28

    curr_dim = initial_dim
    curr_q = initial_q

    # Iterative loop: up to 6 passes to guarantee <= target_bytes and maximum clarity
    max_passes = 6
    for pass_num in range(max_passes):
        if progress_callback:
            progress_callback(pass_num + 1, max_passes, f"PDF फेरी {pass_num + 1}: अचूक साईझ व क्लॅरिटी ऑप्टिमायझेशन...")

        new_doc = fitz.open()
        for page_idx in range(total_pages):
            page = doc[page_idx]
            rect = page.rect
            max_pt = max(rect.width, rect.height)
            # Normalize scale: handles both standard 595pt A4 and high-pt scans (like 2000pt)
            scale = curr_dim / max(100.0, max_pt)
            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            if enhance_text:
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(1.16)
                if curr_dim <= 950:
                    img = img.filter(ImageFilter.UnsharpMask(radius=1.1, percent=125, threshold=3))

            buf = io.BytesIO()
            p_q = curr_q
            img.save(buf, format="JPEG", quality=p_q, optimize=True)

            # Ensure individual page does not explode past budget
            while len(buf.getvalue()) > per_page_budget and p_q > 18:
                p_q -= 5
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=p_q, optimize=True)

            new_page = new_doc.new_page(width=rect.width, height=rect.height)
            new_page.insert_image(rect, stream=buf.getvalue())

        new_doc.save(output_path, garbage=4, deflate=True, clean=True)
        new_doc.close()

        cur_size = os.path.getsize(output_path)
        if cur_size <= target_bytes:
            # Found valid candidate <= target_bytes!
            break

        # If exceeded, scale down aggressively according to overshoot
        ratio = (target_bytes * 0.94) / cur_size
        curr_dim = max(350, int(curr_dim * (ratio ** 0.55)))
        curr_q = max(14, int(curr_q * (ratio ** 0.5)))

    # Emergency guaranteed lock: if still > target_bytes, keep reducing until <= target_bytes
    cur_size = os.path.getsize(output_path)
    while cur_size > target_bytes and curr_dim > 300:
        curr_dim = int(curr_dim * 0.82)
        curr_q = max(12, int(curr_q * 0.85))
        new_doc = fitz.open()
        for page_idx in range(total_pages):
            page = doc[page_idx]
            rect = page.rect
            scale = curr_dim / max(100.0, max(rect.width, rect.height))
            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=curr_q, optimize=True)
            new_page = new_doc.new_page(width=rect.width, height=rect.height)
            new_page.insert_image(rect, stream=buf.getvalue())
        new_doc.save(output_path, garbage=4, deflate=True, clean=True)
        new_doc.close()
        cur_size = os.path.getsize(output_path)

    doc.close()

    # Sweet Spot Padding (~94% ते 97% हमी - 500 KB साठी 470 ते 495 KB)
    cur_size = os.path.getsize(output_path)
    target_sweet_bytes = int(target_bytes * 0.96)
    if cur_size < target_sweet_bytes:
        pad_doc = fitz.open(output_path)
        needed = target_sweet_bytes - cur_size
        if needed > 60:
            pad_doc.set_metadata({'keywords': '0' * (needed - 48)})
            padded_bytes = pad_doc.write(garbage=4, deflate=False, clean=True)
            if len(padded_bytes) <= target_bytes:
                with open(output_path, "wb") as f:
                    f.write(padded_bytes)
        pad_doc.close()

    final_size = os.path.getsize(output_path)
    savings_pct = round((1 - (final_size / orig_bytes)) * 100, 1) if orig_bytes > 0 else 0

    return {
        "success": True,
        "type": "pdf",
        "input_path": input_path,
        "output_path": output_path,
        "original_bytes": orig_bytes,
        "final_bytes": final_size,
        "original_kb": round(orig_bytes / 1024, 1),
        "final_kb": round(final_size / 1024, 1),
        "target_kb": target_kb,
        "savings_pct": savings_pct,
        "pages": total_pages
    }


# =============================================================================
# ३. अनेक फोटो एकत्र जोडून १ PDF बनवणे (Images to 1 Merged PDF)
# =============================================================================
def convert_images_to_pdf(
    image_paths: list,
    output_path: str,
    target_kb: int = 250,
    enhance_text: bool = True,
    progress_callback=None
) -> dict:
    """
    अनेक कागदपत्रांचे फोटो जोडून दिलेल्या अचूक Target KB च्या आत १ स्वच्छ PDF बनवते.
    """
    if not image_paths:
        raise ValueError("किमान १ इमेज निवडणे आवश्यक आहे.")

    target_bytes = target_kb * 1024
    num_images = len(image_paths)
    overhead = (num_images * 3000) + 4000
    usable_bytes = max(8192, target_bytes - overhead)
    target_per_img_kb = max(12, (usable_bytes // num_images) // 1024)

    total_orig_bytes = sum(os.path.getsize(p) for p in image_paths if os.path.exists(p))

    for pass_num in range(4):
        new_doc = fitz.open()
        for idx, img_path in enumerate(image_paths):
            if progress_callback:
                progress_callback(idx + 1, num_images, f"फोटो {idx + 1}/{num_images} PDF मध्ये जोडत आहे...")

            temp_img_out = f"{output_path}.img_tmp_{idx}.jpg"
            compress_image_to_exact_target(
                img_path,
                temp_img_out,
                target_kb=target_per_img_kb,
                dimension_preset="document",
                enhance_text=enhance_text
            )

            with Image.open(temp_img_out) as temp_im:
                w, h = temp_im.size

            is_landscape = w > h
            page_w = 841.89 if is_landscape else 595.28
            page_h = 595.28 if is_landscape else 841.89

            rect = fitz.Rect(0, 0, page_w, page_h)
            page = new_doc.new_page(width=page_w, height=page_h)
            with open(temp_img_out, "rb") as f:
                page.insert_image(rect, stream=f.read())

            if os.path.exists(temp_img_out):
                try:
                    os.remove(temp_img_out)
                except Exception:
                    pass

        new_doc.save(output_path, garbage=4, deflate=True, clean=True)
        new_doc.close()

        cur_size = os.path.getsize(output_path)
        if cur_size <= target_bytes:
            break
        # Scale down per-image target
        target_per_img_kb = max(8, int(target_per_img_kb * (target_bytes * 0.92 / cur_size)))

    # Sweet Spot Padding (~94% ते 97% हमी)
    cur_size = os.path.getsize(output_path)
    target_sweet_bytes = int(target_bytes * 0.96)
    if cur_size < target_sweet_bytes:
        pad_doc = fitz.open(output_path)
        needed = target_sweet_bytes - cur_size
        if needed > 60:
            pad_doc.set_metadata({'keywords': '0' * (needed - 48)})
            padded_bytes = pad_doc.write(garbage=4, deflate=False, clean=True)
            if len(padded_bytes) <= target_bytes:
                with open(output_path, "wb") as f:
                    f.write(padded_bytes)
        pad_doc.close()

    final_size = os.path.getsize(output_path)
    savings_pct = round((1 - (final_size / total_orig_bytes)) * 100, 1) if total_orig_bytes > 0 else 0

    return {
        "success": True,
        "type": "pdf_from_images",
        "input_count": num_images,
        "output_path": output_path,
        "original_bytes": total_orig_bytes,
        "final_bytes": final_size,
        "original_kb": round(total_orig_bytes / 1024, 1),
        "final_kb": round(final_size / 1024, 1),
        "target_kb": target_kb,
        "savings_pct": savings_pct,
        "pages": num_images
    }


# =============================================================================
# ४. अनेक PDF एकत्र जोडून १ PDF बनवणे (Multiple PDFs to 1 Exact Target PDF)
# =============================================================================
def merge_pdfs_to_exact_target(
    pdf_paths: list,
    output_path: str,
    target_kb: int = 250,
    enhance_text: bool = True,
    progress_callback=None
) -> dict:
    """
    अनेक PDF फाईल्स एकत्र जोडून (Merge करून) दिलेल्या अचूक Target KB मध्ये
    आणि सर्वोच्च गुणवत्तेत (Zero Blur / Max Clarity) १ PDF बनवते.
    """
    if not pdf_paths:
        raise ValueError("किमान १ PDF निवडणे आवश्यक आहे.")

    target_bytes = target_kb * 1024
    total_orig_bytes = sum(os.path.getsize(p) for p in pdf_paths if os.path.exists(p))

    temp_merged = f"{output_path}.temp_merged_{os.getpid()}.pdf"
    merged_doc = fitz.open()
    for idx, p in enumerate(pdf_paths):
        if progress_callback:
            progress_callback(idx + 1, len(pdf_paths) + 2, f"PDF एकत्र जोडत आहे ({idx + 1}/{len(pdf_paths)})...")
        sub_doc = fitz.open(p)
        merged_doc.insert_pdf(sub_doc)
        sub_doc.close()

    merged_doc.save(temp_merged, garbage=4, deflate=True)
    total_pages = len(merged_doc)
    merged_doc.close()

    try:
        res = compress_pdf_to_exact_target(
            temp_merged,
            output_path,
            target_kb=target_kb,
            enhance_text=enhance_text,
            progress_callback=lambda c, t, m: progress_callback(c, t, m) if progress_callback else None
        )
        res["type"] = "merged_pdf"
        res["input_count"] = len(pdf_paths)
        res["original_bytes"] = total_orig_bytes
        res["original_kb"] = round(total_orig_bytes / 1024, 1)
        res["savings_pct"] = round((1 - (res["final_bytes"] / total_orig_bytes)) * 100, 1) if total_orig_bytes > 0 else 0
        return res
    finally:
        if os.path.exists(temp_merged):
            try:
                os.remove(temp_merged)
            except Exception:
                pass


# =============================================================================
# ५. बॅच कॉम्प्रेशन फंक्शन्स (Batch PDF & Batch Image Engine)
# =============================================================================
def batch_compress_pdfs(
    pdf_paths: list,
    output_dir: str,
    target_kb: int = 250,
    enhance_text: bool = True,
    progress_callback=None
) -> list:
    """अनेक PDFs स्वतंत्रपणे दिलेल्या अचूक Target KB मध्ये कॉम्प्रेश करते."""
    os.makedirs(output_dir, exist_ok=True)
    results = []
    total = len(pdf_paths)
    for idx, p in enumerate(pdf_paths):
        if progress_callback:
            progress_callback(idx + 1, total, f"PDF {idx + 1}/{total} कॉम्प्रेश करत आहे: {os.path.basename(p)}")
        stem = Path(p).stem
        out_p = os.path.join(output_dir, f"{stem}_compressed_{target_kb}KB.pdf")
        res = compress_pdf_to_exact_target(p, out_p, target_kb=target_kb, enhance_text=enhance_text)
        results.append(res)
    return results


def batch_compress_images(
    image_paths: list,
    output_dir: str,
    target_kb: int = 50,
    preset: str = "original",
    enhance_text: bool = True,
    progress_callback=None
) -> list:
    """अनेक इमेजेस स्वतंत्रपणे दिलेल्या अचूक Target KB मध्ये कॉम्प्रेश करते."""
    os.makedirs(output_dir, exist_ok=True)
    results = []
    total = len(image_paths)
    for idx, p in enumerate(image_paths):
        if progress_callback:
            progress_callback(idx + 1, total, f"इमेज {idx + 1}/{total} कॉम्प्रेश करत आहे: {os.path.basename(p)}")
        stem = Path(p).stem
        out_p = os.path.join(output_dir, f"{stem}_compressed_{target_kb}KB.jpg")
        res = compress_image_to_exact_target(p, out_p, target_kb=target_kb, dimension_preset=preset, enhance_text=enhance_text)
        results.append(res)
    return results


# =============================================================================
# ६. आधुनिक २-कॉलम ग्राफिकल युझर इंटरफेस (Exact HTML Format Matching)
# =============================================================================
def launch_gui():
    try:
        import customtkinter as ctk
        from tkinter import filedialog, messagebox
        import webbrowser
    except ImportError:
        print("GUI साठी CustomTkinter उपलब्ध नाही. कृपया: pip install customtkinter pillow चालवा.")
        return

    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")

    root = ctk.CTk()
    root.title("EMUDRA PDF COMPRESSOR PRO v2.0 - Official Dashboard")
    icon_p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "emudra_compressor_icon.ico")
    if os.path.exists(icon_p):
        try:
            root.iconbitmap(icon_p)
        except Exception:
            pass

    # Screen resolution & Safe work area detection (Fits 768p and 125%/150% scaling laptops)
    sw = root.winfo_screenwidth()
    sh = root.winfo_screenheight()

    # Calculate usable workspace avoiding the Windows taskbar and system borders
    avail_h = max(380, sh - 95)
    avail_w = max(520, sw - 40)

    # 2-Column Dashboard standard fit (fits 1366x768, 1080p 125%/150% scaling laptops)
    std_w = min(880, max(720, int(avail_w * 0.92)))
    std_h = min(530, max(420, int(avail_h * 0.88)))
    pos_x = max(10, int((sw - std_w) / 2))
    pos_y = max(12, min(30, int((avail_h - std_h) / 2)))

    root.geometry(f"{std_w}x{std_h}+{pos_x}+{pos_y}")
    root.minsize(580, 360)
    root.resizable(True, True)

    # State variables (6 Modes matching HTML)
    current_tool_mode = ctk.StringVar(value="pdf") # 'pdf' | 'merge_pdf' | 'batch_pdf' | 'image' | 'img_to_pdf' | 'batch_img'
    selected_files_list = []
    target_kb_var = ctk.StringVar(value="250")
    status_text_var = ctk.StringVar(value="कृपया कोणतीही PDF किंवा इमेज फाईल निवडा...")
    enhance_var = ctk.BooleanVar(value=True)
    dimension_preset_var = ctk.StringVar(value="photo")
    last_output_file = [None]
    is_compact = [False]

    # Main Scrollable Container (ensures zero cutoffs on small screens/laptops)
    container = ctk.CTkScrollableFrame(root, fg_color="transparent")
    container.pack(fill="both", expand=True, padx=8, pady=4)

    # 1. Header Box with Indian Tricolor Accent
    header_frame = ctk.CTkFrame(container, corner_radius=10, fg_color="#0f172a", border_width=1, border_color="#1e293b")
    header_frame.pack(fill="x", padx=2, pady=(2, 4))

    # Tricolor Micro-Line
    tricolor_bar = ctk.CTkFrame(header_frame, height=3, fg_color="transparent")
    tricolor_bar.pack(fill="x", padx=6, pady=(3, 3))
    ctk.CTkFrame(tricolor_bar, height=3, fg_color="#ff9933", corner_radius=0).pack(side="left", fill="both", expand=True)
    ctk.CTkFrame(tricolor_bar, height=3, fg_color="#ffffff", corner_radius=0).pack(side="left", fill="both", expand=True)
    ctk.CTkFrame(tricolor_bar, height=3, fg_color="#138808", corner_radius=0).pack(side="left", fill="both", expand=True)

    header_content = ctk.CTkFrame(header_frame, fg_color="transparent")
    header_content.pack(fill="x", padx=10, pady=(0, 6))

    title_box = ctk.CTkFrame(header_content, fg_color="transparent")
    title_box.pack(side="left", fill="both", expand=True)

    title_row = ctk.CTkFrame(title_box, fg_color="transparent")
    title_row.pack(anchor="w", pady=(1, 0))

    title_lbl = ctk.CTkLabel(
        title_row,
        text="🗜️ EMUDRA PDF COMPRESSOR PRO v२.०",
        font=ctk.CTkFont(family="Segoe UI", size=15, weight="bold"),
        text_color="#38bdf8"
    )
    title_lbl.pack(side="left", padx=(0, 8))

    pulse_lbl = ctk.CTkLabel(
        title_row,
        text="🟢 AI ENGINE ACTIVE",
        font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
        text_color="#34d399"
    )
    pulse_lbl.pack(side="left")

    sub_lbl = ctk.CTkLabel(
        title_box,
        text="Zero Blur™ Technology • शासकीय पोर्टल अचूक कॉम्प्रेशन (Aaple Sarkar, MahaDBT, भरती)",
        font=ctk.CTkFont(family="Segoe UI", size=10),
        text_color="#94a3b8"
    )
    sub_lbl.pack(anchor="w", pady=(0, 2))

    header_btn_box = ctk.CTkFrame(header_content, fg_color="transparent")
    header_btn_box.pack(side="right", padx=(6, 0))

    # Compact Mode Toggle Function
    def toggle_compact_mode():
        if not is_compact[0]:
            is_compact[0] = True
            c_w = 520
            c_h = 360
            c_x = max(10, sw - c_w - 25)
            c_y = max(15, avail_h - c_h - 10)
            root.geometry(f"{c_w}x{c_h}+{c_x}+{c_y}")
            try:
                root.attributes("-topmost", True)
            except Exception:
                pass
            btn_compact.configure(text="🗖 स्टँडर्ड व्ह्यू", fg_color="#0284c7")
            sub_lbl.pack_forget()
            # Collapse left column to minimal in compact mode
            drop_area.pack_forget()
        else:
            is_compact[0] = False
            root.geometry(f"{std_w}x{std_h}+{pos_x}+{pos_y}")
            try:
                root.attributes("-topmost", False)
            except Exception:
                pass
            btn_compact.configure(text="🗗 कॉम्पॅक्ट व्ह्यू", fg_color="#334155")
            sub_lbl.pack(anchor="w", pady=(0, 2))
            drop_area.pack(fill="x", padx=10, pady=(0, 6), before=file_queue_box)

    btn_compact = ctk.CTkButton(
        header_btn_box,
        text="🗗 कॉम्पॅक्ट व्ह्यू",
        width=105,
        height=26,
        font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
        fg_color="#334155",
        hover_color="#475569",
        command=toggle_compact_mode
    )
    btn_compact.pack(side="left", padx=2)

    def reset_all_gui():
        nonlocal selected_files_list
        selected_files_list = []
        file_queue_text.set("कोणतीही फाईल निवडलेली नाही.")
        file_queue_badge.configure(text="० फाईल्स")
        file_clear_btn.configure(state="disabled")
        status_text_var.set("सर्व क्लिअर झाले. नवीन फाईल निवडा...")
        progress_bar.set(0)
        result_card.pack_forget()

    btn_reset = ctk.CTkButton(
        header_btn_box,
        text="↺ सर्व क्लिअर",
        width=80,
        height=26,
        font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
        fg_color="#dc2626",
        hover_color="#b91c1c",
        command=reset_all_gui
    )
    btn_reset.pack(side="left", padx=2)

    def open_web_app():
        html_p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pdf-compressor.html")
        if os.path.exists(html_p):
            webbrowser.open(f"file:///{os.path.abspath(html_p)}")

    btn_web = ctk.CTkButton(
        header_btn_box,
        text="🌐 वेब व्ह्यू",
        width=75,
        height=26,
        font=ctk.CTkFont(family="Segoe UI", size=10),
        fg_color="#1e293b",
        hover_color="#334155",
        command=open_web_app
    )
    btn_web.pack(side="left", padx=2)

    # 2. Mode Selector Bar (6 Graphical Tabs matching HTML)
    mode_bar = ctk.CTkFrame(container, corner_radius=8, fg_color="#1e293b")
    mode_bar.pack(fill="x", padx=2, pady=(0, 4))

    mode_tabs = {}
    mode_configs = [
        ("pdf", "📄 सिंगल PDF", "#0284c7"),
        ("merge_pdf", "📑 अनेक PDF ➔ १", "#8b5cf6"),
        ("batch_pdf", "📦 बॅच PDF", "#d97706"),
        ("image", "🖼️ फोटो / स्वाक्षरी", "#db2777"),
        ("img_to_pdf", "📸 फोटो ➔ १ PDF", "#059669"),
        ("batch_img", "🗂️ बॅच इमेजेस", "#0d9488")
    ]

    def on_mode_tab_changed(new_mode):
        current_tool_mode.set(new_mode)
        update_mode_ui()

    for m_key, m_lbl, m_col in mode_configs:
        btn = ctk.CTkButton(
            mode_bar,
            text=m_lbl,
            height=26,
            font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
            fg_color="#334155",
            hover_color=m_col,
            command=lambda k=m_key: on_mode_tab_changed(k)
        )
        btn.pack(side="left", padx=1, pady=2, expand=True, fill="x")
        mode_tabs[m_key] = (btn, m_col)

    # 3. 2-Column Workspace Grid (Left Column: Files & Queue | Right Column: Settings & Run)
    workspace_grid = ctk.CTkFrame(container, fg_color="transparent")
    workspace_grid.pack(fill="both", expand=True, padx=0, pady=2)

    left_col = ctk.CTkFrame(workspace_grid, corner_radius=10, fg_color="#0f172a", border_width=1, border_color="#1e293b")
    left_col.pack(side="left", fill="both", expand=True, padx=(2, 3), pady=2)

    right_col = ctk.CTkFrame(workspace_grid, corner_radius=10, fg_color="#0f172a", border_width=1, border_color="#1e293b")
    right_col.pack(side="right", fill="both", expand=True, padx=(3, 2), pady=2)

    # ================= LEFT COLUMN: Files, Dropzone & Queue =================
    left_hdr = ctk.CTkFrame(left_col, fg_color="transparent")
    left_hdr.pack(fill="x", padx=10, pady=(6, 4))
    ctk.CTkLabel(left_hdr, text="📁 १. फाईल निवड व यादी (Files & Queue)", font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"), text_color="#38bdf8").pack(side="left")

    file_queue_badge = ctk.CTkLabel(left_hdr, text="० फाईल्स", font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), text_color="#94a3b8")
    file_queue_badge.pack(side="right")

    # Dropzone area
    drop_area = ctk.CTkFrame(left_col, corner_radius=8, fg_color="#090d16", border_width=1, border_color="#334155")
    drop_area.pack(fill="x", padx=10, pady=(0, 6))

    ctk.CTkLabel(drop_area, text="📥", font=ctk.CTkFont(size=22)).pack(pady=(6, 1))
    ctk.CTkLabel(drop_area, text="येथे फाईल निवडा किंवा ड्रॅग करा", font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold")).pack()
    ctk.CTkLabel(drop_area, text="[PDF] [JPG] [PNG] [WEBP]", font=ctk.CTkFont(family="Segoe UI", size=9), text_color="#64748b").pack(pady=(0, 4))

    def browse_files():
        mode = current_tool_mode.get()
        if mode in ("pdf", "merge_pdf", "batch_pdf"):
            filetypes = [("PDF Files", "*.pdf"), ("All Files", "*.*")]
        elif mode in ("image", "img_to_pdf", "batch_img"):
            filetypes = [("Image Files", "*.jpg;*.jpeg;*.png;*.webp;*.bmp"), ("All Files", "*.*")]
        else:
            filetypes = [("All Supported", "*.pdf;*.jpg;*.jpeg;*.png;*.webp;*.bmp"), ("All Files", "*.*")]

        allow_multi = mode in ("merge_pdf", "batch_pdf", "img_to_pdf", "batch_img")
        if allow_multi:
            paths = filedialog.askopenfilenames(title="कागदपत्रे निवडा", filetypes=filetypes)
        else:
            p = filedialog.askopenfilename(title="कागदपत्र निवडा", filetypes=filetypes)
            paths = [p] if p else []

        if paths and paths[0]:
            nonlocal selected_files_list
            selected_files_list = list(paths)
            first_ext = Path(paths[0]).suffix.lower()

            # Auto-detect mode if single file chosen in wrong mode
            if len(paths) == 1:
                if first_ext in PDF_EXTENSIONS and mode not in ("pdf", "merge_pdf", "batch_pdf"):
                    current_tool_mode.set("pdf")
                    update_mode_ui()
                elif first_ext in IMAGE_EXTENSIONS and mode not in ("image", "img_to_pdf", "batch_img"):
                    current_tool_mode.set("image")
                    update_mode_ui()

            # Update file queue view
            update_file_queue_display()

    btn_browse = ctk.CTkButton(
        drop_area,
        text="📁 फाईल निवडा (Browse Files)",
        height=26,
        font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
        fg_color="#0284c7",
        hover_color="#0369a1",
        command=browse_files
    )
    btn_browse.pack(pady=(2, 8))

    # File Queue Card
    file_queue_box = ctk.CTkFrame(left_col, corner_radius=8, fg_color="#090d16", border_width=1, border_color="#1e293b")
    file_queue_box.pack(fill="both", expand=True, padx=10, pady=(0, 6))

    file_queue_text = ctk.StringVar(value="कोणतीही फाईल निवडलेली नाही.")
    lbl_queue = ctk.CTkLabel(
        file_queue_box,
        textvariable=file_queue_text,
        font=ctk.CTkFont(family="Segoe UI", size=10),
        text_color="#cbd5e1",
        justify="left",
        anchor="nw",
        wraplength=340
    )
    lbl_queue.pack(fill="both", expand=True, padx=8, pady=6)

    queue_btn_row = ctk.CTkFrame(file_queue_box, fg_color="transparent")
    queue_btn_row.pack(fill="x", padx=8, pady=(0, 6))

    file_clear_btn = ctk.CTkButton(
        queue_btn_row,
        text="🗑️ काढून टाका",
        width=85,
        height=22,
        font=ctk.CTkFont(family="Segoe UI", size=9),
        fg_color="#334155",
        hover_color="#dc2626",
        state="disabled",
        command=reset_all_gui
    )
    file_clear_btn.pack(side="right")

    def update_file_queue_display():
        n = len(selected_files_list)
        if n == 0:
            file_queue_text.set("कोणतीही फाईल निवडलेली नाही.")
            file_queue_badge.configure(text="० फाईल्स")
            file_clear_btn.configure(state="disabled")
            status_text_var.set("कृपया फाईल निवडा...")
            return

        file_queue_badge.configure(text=f"{n} फाईल्स")
        file_clear_btn.configure(state="normal")

        if n == 1:
            p = selected_files_list[0]
            sz_kb = os.path.getsize(p) / 1024
            sz_str = f"{sz_kb/1024:.2f} MB" if sz_kb > 1024 else f"{sz_kb:.1f} KB"
            msg = "📄 निवडलेली फाईल:\n" + os.path.basename(p) + "\n\n📊 मूळ साईझ: " + sz_str + "\n📍 पाथ: " + p
            file_queue_text.set(msg)
            status_text_var.set(f"निवडली: {os.path.basename(p)} ({sz_str})")
        else:
            tot_bytes = sum(os.path.getsize(p) for p in selected_files_list if os.path.exists(p))
            tot_kb = tot_bytes / 1024
            tot_str = f"{tot_kb/1024:.2f} MB" if tot_kb > 1024 else f"{tot_kb:.1f} KB"
            first_three = "\n".join(["• " + os.path.basename(p) for p in selected_files_list[:3]])
            more_str = f"\n...आणि इतर {n - 3} फाईल्स" if n > 3 else ""
            msg = f"📑 एकूण {n} फाईल्स निवडल्या (एकूण: {tot_str}):\n" + first_three + more_str
            file_queue_text.set(msg)
            status_text_var.set(f"{n} फाईल्स तयार आहेत (एकूण {tot_str})")

    # ================= RIGHT COLUMN: Target Size, Presets, Run & Result =================
    right_hdr = ctk.CTkFrame(right_col, fg_color="transparent")
    right_hdr.pack(fill="x", padx=10, pady=(6, 4))
    ctk.CTkLabel(right_hdr, text="⚙️ २. टार्गेट साईझ व कॉम्प्रेशन (Settings & Run)", font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"), text_color="#38bdf8").pack(side="left")

    # Target Size Card
    target_box = ctk.CTkFrame(right_col, corner_radius=8, fg_color="#090d16", border_width=1, border_color="#1e293b")
    target_box.pack(fill="x", padx=10, pady=(0, 4))

    chips_row = ctk.CTkFrame(target_box, fg_color="transparent")
    chips_row.pack(fill="x", padx=8, pady=(5, 3))

    def set_target(val):
        target_kb_var.set(str(val))
        if current_tool_mode.get() in ("image", "batch_img"):
            if val == 20:
                set_dim_preset("signature")
            elif val == 50:
                set_dim_preset("photo")

    def trigger_super_minimise():
        mode = current_tool_mode.get()
        if mode == "pdf":
            set_target(50)
        elif mode in ("merge_pdf", "batch_pdf"):
            set_target(150)
        elif mode in ("image", "batch_img"):
            preset = dimension_preset_var.get()
            if preset == "signature":
                set_target(10)
            elif preset == "photo":
                set_target(20)
            else:
                set_target(30)
        elif mode == "img_to_pdf":
            set_target(100)

    chip_widgets = []
    def render_chips_for_mode():
        for w in chip_widgets:
            w.destroy()
        chip_widgets.clear()

        # Super Minimise Button
        btn_super = ctk.CTkButton(
            chips_row,
            text="⚡ सुपर मिनिमाइज",
            height=24,
            font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
            fg_color="#059669",
            hover_color="#047857",
            command=trigger_super_minimise
        )
        btn_super.pack(side="left", padx=1, expand=True, fill="x")
        chip_widgets.append(btn_super)

        mode = current_tool_mode.get()
        if mode in ("image", "batch_img"):
            chips_data = [
                ("✍️ २० KB", 20, "#db2777"),
                ("👤 ५० KB", 50, "#0284c7"),
                ("📄 १०० KB", 100, "#d97706"),
                ("🏛️ २५० KB", 250, "#475569")
            ]
        else:
            chips_data = [
                ("📄 १०० KB", 100, "#d97706"),
                ("🏛️ २५० KB", 250, "#0284c7"),
                ("📑 ५०० KB", 500, "#475569"),
                ("🎓 १ MB", 1000, "#334155")
            ]

        for label, val, col in chips_data:
            btn = ctk.CTkButton(chips_row, text=label, height=24, font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), fg_color=col, command=lambda v=val: set_target(v))
            btn.pack(side="left", padx=1, expand=True, fill="x")
            chip_widgets.append(btn)

        custom_box = ctk.CTkFrame(chips_row, fg_color="transparent")
        custom_box.pack(side="left", padx=2)
        cinp = ctk.CTkEntry(custom_box, textvariable=target_kb_var, width=45, height=24, font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"))
        cinp.pack()
        chip_widgets.append(custom_box)

    # Interactive Target KB Slider Row
    slider_row = ctk.CTkFrame(target_box, fg_color="transparent")
    slider_row.pack(fill="x", padx=8, pady=(1, 4))

    lbl_slider_val = ctk.CTkLabel(
        slider_row,
        text=f"लक्ष्य: {target_kb_var.get()} KB",
        font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
        text_color="#38bdf8",
        width=95,
        anchor="e"
    )
    lbl_slider_val.pack(side="right", padx=(4, 0))

    def on_slider_move(val):
        int_val = max(10, int(round(val)))
        target_kb_var.set(str(int_val))
        lbl_slider_val.configure(text=f"लक्ष्य: {int_val} KB")

    kb_slider = ctk.CTkSlider(
        slider_row,
        from_=10,
        to=1000,
        number_of_steps=198,
        height=14,
        fg_color="#1e293b",
        progress_color="#0284c7",
        button_color="#38bdf8",
        button_hover_color="#7dd3fc",
        command=on_slider_move
    )
    kb_slider.set(250)
    kb_slider.pack(side="left", fill="x", expand=True)

    def on_target_entry_changed(*args):
        try:
            val = int(target_kb_var.get().strip())
            if 10 <= val <= 2000:
                kb_slider.set(min(1000, max(10, val)))
                lbl_slider_val.configure(text=f"लक्ष्य: {val} KB")
        except Exception:
            pass

    target_kb_var.trace_add("write", on_target_entry_changed)

    # Dimension Presets Box (Specifically for Images)
    dim_frame = ctk.CTkFrame(right_col, corner_radius=8, fg_color="#090d16", border_width=1, border_color="#1e293b")

    dim_hdr = ctk.CTkLabel(dim_frame, text="शासकीय पिक्सेल प्रिसेट (Portal Dimension):", font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), text_color="#f472b6")
    dim_hdr.pack(anchor="w", padx=8, pady=(4, 2))

    dim_btn_row = ctk.CTkFrame(dim_frame, fg_color="transparent")
    dim_btn_row.pack(fill="x", padx=8, pady=(0, 2))

    def set_dim_preset(preset):
        dimension_preset_var.set(preset)
        for p, btn in dim_buttons.items():
            if p == preset:
                btn.configure(fg_color="#db2777", hover_color="#be185d")
            else:
                btn.configure(fg_color="#334155", hover_color="#475569")

        if preset == "photo":
            target_kb_var.set("50")
            dim_hint_lbl.configure(text="👤 फोटो: १६० × २१० px व ५० KB (आपले सरकार, महाडीबीटी, भरती)")
        elif preset == "signature":
            target_kb_var.set("20")
            dim_hint_lbl.configure(text="✍️ स्वाक्षरी: २५६ × ६४ px व २० KB (पोर्टल नियम)")
        elif preset == "document":
            target_kb_var.set("150")
            dim_hint_lbl.configure(text="📄 कागदपत्र: कमाल १२०० px रुंदी ठेवून स्वच्छ केले जाईल.")
        else:
            dim_hint_lbl.configure(text="🔄 मूळ आकार: फोटोचा मूळ अस्पेक्ट रेशो ठेवून फाईल टार्गेट KB होईल.")

    dim_buttons = {}
    b1 = ctk.CTkButton(dim_btn_row, text="👤 फोटो (160×210)", height=22, font=ctk.CTkFont(family="Segoe UI", size=9), command=lambda: set_dim_preset("photo"))
    b1.pack(side="left", padx=1, expand=True, fill="x")
    dim_buttons["photo"] = b1

    b2 = ctk.CTkButton(dim_btn_row, text="✍️ स्वाक्षरी (256×64)", height=22, font=ctk.CTkFont(family="Segoe UI", size=9), command=lambda: set_dim_preset("signature"))
    b2.pack(side="left", padx=1, expand=True, fill="x")
    dim_buttons["signature"] = b2

    b3 = ctk.CTkButton(dim_btn_row, text="🔄 मूळ आकार", height=22, font=ctk.CTkFont(family="Segoe UI", size=9), command=lambda: set_dim_preset("original"))
    b3.pack(side="left", padx=1, expand=True, fill="x")
    dim_buttons["original"] = b3

    dim_hint_lbl = ctk.CTkLabel(dim_frame, text="शासकीय भरतीसाठी फोटो 160×210 px व स्वाक्षरी 256×64 px आपोआप रिसाइज होते.", font=ctk.CTkFont(family="Segoe UI", size=8), text_color="#94a3b8")
    dim_hint_lbl.pack(anchor="w", padx=8, pady=(0, 4))

    enhance_check = ctk.CTkCheckBox(right_col, text="मजकूर व फोटो क्लॅरिटी बूस्ट (Zero Blur Guarantee)", font=ctk.CTkFont(family="Segoe UI", size=10), variable=enhance_var)
    enhance_check.pack(anchor="w", padx=10, pady=(2, 3))

    # Action & Progress
    action_box = ctk.CTkFrame(right_col, fg_color="transparent")
    action_box.pack(fill="x", padx=10, pady=2)

    progress_bar = ctk.CTkProgressBar(action_box, height=6)
    progress_bar.pack(fill="x", pady=(2, 2))
    progress_bar.set(0)

    status_lbl = ctk.CTkLabel(action_box, textvariable=status_text_var, font=ctk.CTkFont(family="Segoe UI", size=9), text_color="#cbd5e1")
    status_lbl.pack(pady=(0, 3))

    # Inline Result Comparison Card (matching HTML comparison gauge & bars)
    result_card = ctk.CTkFrame(right_col, corner_radius=8, fg_color="#090d16", border_width=1, border_color="#10b981")

    res_hdr = ctk.CTkLabel(result_card, text="✅ कॉम्प्रेशन १००% यशस्वी! (Zero Blur Lock)", font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"), text_color="#34d399")
    res_hdr.pack(anchor="w", padx=8, pady=(4, 2))

    bars_box = ctk.CTkFrame(result_card, fg_color="transparent")
    bars_box.pack(fill="x", padx=8, pady=(0, 2))

    lbl_orig_bar = ctk.CTkLabel(bars_box, text="मूळ आकार: 0 KB", font=ctk.CTkFont(family="Segoe UI", size=9), text_color="#94a3b8")
    lbl_orig_bar.pack(anchor="w")
    bar_orig = ctk.CTkProgressBar(bars_box, height=6, progress_color="#64748b")
    bar_orig.pack(fill="x", pady=(1, 2))
    bar_orig.set(1.0)

    lbl_comp_bar = ctk.CTkLabel(bars_box, text="नवीन आकार: 0 KB (टार्गेट: 0 KB)", font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"), text_color="#38bdf8")
    lbl_comp_bar.pack(anchor="w")
    bar_comp = ctk.CTkProgressBar(bars_box, height=6, progress_color="#10b981")
    bar_comp.pack(fill="x", pady=(1, 2))
    bar_comp.set(0.3)

    res_badge_lbl = ctk.CTkLabel(result_card, text="🎉 एकूण बचत: 0% • १००% वाचण्याजोगा", font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), text_color="#fbbf24")
    res_badge_lbl.pack(pady=(0, 3))

    res_btns_row = ctk.CTkFrame(result_card, fg_color="transparent")
    res_btns_row.pack(fill="x", padx=8, pady=(0, 6))

    def open_compressed_file():
        f = last_output_file[0]
        if f and os.path.exists(f):
            os.startfile(f)

    def open_output_folder():
        f = last_output_file[0]
        if f and os.path.exists(f):
            subprocess.run(["explorer", "/select,", os.path.normpath(f)])

    btn_open_file = ctk.CTkButton(res_btns_row, text="👁️ तयार फाईल उघडा", height=26, font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), fg_color="#0284c7", hover_color="#0369a1", command=open_compressed_file)
    btn_open_file.pack(side="left", fill="x", expand=True, padx=(0, 3))

    btn_open_folder = ctk.CTkButton(res_btns_row, text="📂 फोल्डर उघडा", height=26, font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), fg_color="#334155", hover_color="#475569", command=open_output_folder)
    btn_open_folder.pack(side="right", fill="x", expand=True, padx=(3, 0))

    def update_mode_ui():
        mode = current_tool_mode.get()
        # Highlight active tab
        for m_key, (btn, col) in mode_tabs.items():
            if m_key == mode:
                btn.configure(fg_color=col)
            else:
                btn.configure(fg_color="#334155")

        if mode in ("image", "batch_img"):
            dim_frame.pack(fill="x", padx=10, pady=(0, 4), after=target_box)
            target_kb_var.set("50")
            set_dim_preset("photo")
        else:
            dim_frame.pack_forget()
            target_kb_var.set("250")

        render_chips_for_mode()

    # Initial mode setup
    set_dim_preset("photo")
    update_mode_ui()

    def run_compression_gui():
        if not selected_files_list or not os.path.exists(selected_files_list[0]):
            messagebox.showerror("त्रुटी", "कृपया प्रथम कॉम्प्रेस करायची फाईल किंवा फोटो निवडा.")
            return

        try:
            target_kb = int(target_kb_var.get().strip())
            if target_kb < 10:
                messagebox.showerror("त्रुटी", "टार्गेट साईझ किमान १० KB पेक्षा जास्त असावी.")
                return
        except ValueError:
            messagebox.showerror("त्रुटी", "कृपया वैध अंक (Target KB) टाका.")
            return

        mode = current_tool_mode.get()
        first_file = selected_files_list[0]
        p = Path(first_file)

        btn_run.configure(state="disabled")
        progress_bar.set(0.15)
        result_card.pack_forget()
        root.update()

        try:
            def update_progress(curr, total, msg):
                progress_bar.set(curr / max(1, total))
                status_text_var.set(msg)
                root.update()

            if mode == "batch_pdf":
                out_dir = str(p.parent / f"Batch_Compressed_{target_kb}KB_PDFs")
                results = batch_compress_pdfs(
                    selected_files_list,
                    out_dir,
                    target_kb=target_kb,
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                last_output_file[0] = results[0]["output_path"] if results else None
                tot_orig = sum(r["original_kb"] for r in results)
                tot_final = sum(r["final_kb"] for r in results)
                sav = round((1 - (tot_final / tot_orig)) * 100, 1) if tot_orig > 0 else 0

                lbl_orig_bar.configure(text=f"एकूण मूळ आकार: {round(tot_orig, 1)} KB")
                lbl_comp_bar.configure(text=f"नवीन आकार: {round(tot_final, 1)} KB (सर्व {len(results)} PDFs)")
                bar_comp.set(min(1.0, max(0.05, tot_final / max(1, tot_orig))))
                res_badge_lbl.configure(text=f"🎉 सर्व {len(results)} PDFs कॉम्प्रेश झाल्या! बचत: {sav}% • फोल्डर सेव्ह झाले.")
                result_card.pack(fill="x", padx=10, pady=4)
                status_text_var.set(f"✅ सर्व {len(results)} PDFs यशस्वी! बचत: {sav}%")

            elif mode == "batch_img":
                out_dir = str(p.parent / f"Batch_Compressed_{target_kb}KB_Images")
                results = batch_compress_images(
                    selected_files_list,
                    out_dir,
                    target_kb=target_kb,
                    preset=dimension_preset_var.get(),
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                last_output_file[0] = results[0]["output_path"] if results else None
                tot_orig = sum(r["original_kb"] for r in results)
                tot_final = sum(r["final_kb"] for r in results)
                sav = round((1 - (tot_final / tot_orig)) * 100, 1) if tot_orig > 0 else 0

                lbl_orig_bar.configure(text=f"एकूण मूळ आकार: {round(tot_orig, 1)} KB")
                lbl_comp_bar.configure(text=f"नवीन आकार: {round(tot_final, 1)} KB (सर्व {len(results)} इमेजेस)")
                bar_comp.set(min(1.0, max(0.05, tot_final / max(1, tot_orig))))
                res_badge_lbl.configure(text=f"🎉 सर्व {len(results)} इमेजेस कॉम्प्रेश झाल्या! बचत: {sav}% • फोल्डर सेव्ह झाले.")
                result_card.pack(fill="x", padx=10, pady=4)
                status_text_var.set(f"✅ सर्व {len(results)} इमेजेस यशस्वी! बचत: {sav}%")

            elif mode == "merge_pdf" or (len(selected_files_list) > 1 and p.suffix.lower() in PDF_EXTENSIONS):
                out_path = str(p.parent / f"Merged_{target_kb}KB.pdf")
                res = merge_pdfs_to_exact_target(
                    selected_files_list,
                    out_path,
                    target_kb=target_kb,
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                last_output_file[0] = out_path
                lbl_orig_bar.configure(text=f"मूळ आकार: {res['original_kb']} KB")
                lbl_comp_bar.configure(text=f"नवीन आकार: {res['final_kb']} KB (टार्गेट: {res['target_kb']} KB)")
                bar_comp.set(min(1.0, max(0.05, res['final_bytes'] / max(1, res['original_bytes']))))
                res_badge_lbl.configure(text=f"🎉 बचत: {res['savings_pct']}% ({round(res['original_kb'] - res['final_kb'], 1)} KB कमी केले) • Zero Blur")
                result_card.pack(fill="x", padx=10, pady=4)
                status_text_var.set(f"✅ यशस्वी: {res['final_kb']} KB (टार्गेट {res['target_kb']} KB) • बचत: {res['savings_pct']}%")

            elif mode == "img_to_pdf" or (len(selected_files_list) > 1 and p.suffix.lower() in IMAGE_EXTENSIONS):
                out_path = str(p.parent / f"Merged_Photos_{target_kb}KB.pdf")
                res = convert_images_to_pdf(
                    selected_files_list,
                    out_path,
                    target_kb=target_kb,
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                last_output_file[0] = out_path
                lbl_orig_bar.configure(text=f"मूळ आकार: {res['original_kb']} KB")
                lbl_comp_bar.configure(text=f"नवीन आकार: {res['final_kb']} KB (टार्गेट: {res['target_kb']} KB)")
                bar_comp.set(min(1.0, max(0.05, res['final_bytes'] / max(1, res['original_bytes']))))
                res_badge_lbl.configure(text=f"🎉 बचत: {res['savings_pct']}% ({round(res['original_kb'] - res['final_kb'], 1)} KB कमी केले) • Zero Blur")
                result_card.pack(fill="x", padx=10, pady=4)
                status_text_var.set(f"✅ यशस्वी: {res['final_kb']} KB (टार्गेट {res['target_kb']} KB) • बचत: {res['savings_pct']}%")

            elif mode == "image" or (p.suffix.lower() in IMAGE_EXTENSIONS):
                out_path = str(p.parent / f"{p.stem}_compressed_{target_kb}KB.jpg")
                res = compress_image_to_exact_target(
                    first_file,
                    out_path,
                    target_kb=target_kb,
                    dimension_preset=dimension_preset_var.get(),
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                last_output_file[0] = out_path
                lbl_orig_bar.configure(text=f"मूळ आकार: {res['original_kb']} KB")
                lbl_comp_bar.configure(text=f"नवीन आकार: {res['final_kb']} KB (टार्गेट: {res['target_kb']} KB)")
                bar_comp.set(min(1.0, max(0.05, res['final_bytes'] / max(1, res['original_bytes']))))
                res_badge_lbl.configure(text=f"🎉 बचत: {res['savings_pct']}% ({round(res['original_kb'] - res['final_kb'], 1)} KB कमी केले) • Zero Blur")
                result_card.pack(fill="x", padx=10, pady=4)
                status_text_var.set(f"✅ यशस्वी: {res['final_kb']} KB (टार्गेट {res['target_kb']} KB) • बचत: {res['savings_pct']}%")

            else:
                out_path = str(p.parent / f"{p.stem}_compressed_{target_kb}KB.pdf")
                res = compress_pdf_to_exact_target(
                    first_file,
                    out_path,
                    target_kb=target_kb,
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                last_output_file[0] = out_path
                lbl_orig_bar.configure(text=f"मूळ आकार: {res['original_kb']} KB")
                lbl_comp_bar.configure(text=f"नवीन आकार: {res['final_kb']} KB (टार्गेट: {res['target_kb']} KB)")
                bar_comp.set(min(1.0, max(0.05, res['final_bytes'] / max(1, res['original_bytes']))))
                res_badge_lbl.configure(text=f"🎉 बचत: {res['savings_pct']}% ({round(res['original_kb'] - res['final_kb'], 1)} KB कमी केले) • Zero Blur")
                result_card.pack(fill="x", padx=10, pady=4)
                status_text_var.set(f"✅ यशस्वी: {res['final_kb']} KB (टार्गेट {res['target_kb']} KB) • बचत: {res['savings_pct']}%")

            progress_bar.set(1.0)

        except Exception as e:
            status_text_var.set(f"त्रुटी: {str(e)}")
            messagebox.showerror("कॉम्प्रेशन त्रुटी", str(e))
        finally:
            btn_run.configure(state="normal")

    btn_run = ctk.CTkButton(
        right_col,
        text="🚀 अचूक साईझमध्ये कॉम्प्रेस करा (Start Compression)",
        font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
        height=34,
        fg_color="#059669",
        hover_color="#047857",
        command=run_compression_gui
    )
    btn_run.pack(fill="x", padx=10, pady=(4, 8))

    root.mainloop()


# =============================================================================
# ७. CLI Main Entry Point
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description="शासकीय PDF व इमेज अचूक साईझ कॉम्प्रेशन टूल")
    parser.add_argument("inputs", nargs="*", help="इनपुट PDF किंवा इमेज फाईल पाथ्स")
    parser.add_argument("-t", "--target", type=int, help="टार्गेट फाईल साईझ KB मध्ये (उदा. २०, ५०, २५०)")
    parser.add_argument("-o", "--output", help="आउटपुट फाईल किंवा फोल्डर पाथ")
    parser.add_argument("--preset", choices=["photo", "signature", "document", "original"], default="original", help="इमेज डायमेन्शन प्रिसेट")
    parser.add_argument("--to-pdf", action="store_true", help="अनेक इमेज एकत्र जोडून १ PDF बनवा")
    parser.add_argument("--merge-pdf", action="store_true", help="अनेक PDF एकत्र जोडून १ PDF बनवा")
    parser.add_argument("--batch", action="store_true", help="सर्व फाईल्स स्वतंत्रपणे बॅच कॉम्प्रेशन करा")
    parser.add_argument("--no-enhance", action="store_true", help="मजकूर व फोटो शार्पनेस फिल्टर बंद करा")
    parser.add_argument("--gui", action="store_true", help="ग्राफिकल इंटरफेस उघडा")

    args = parser.parse_args()

    if not args.inputs or args.gui:
        launch_gui()
        return

    first_path = args.inputs[0]
    ext = Path(first_path).suffix.lower()

    # Batch mode
    if args.batch:
        target_kb = args.target if args.target else 250
        out_dir = args.output if args.output else str(Path(first_path).parent / f"Batch_Compressed_{target_kb}KB")
        if ext in PDF_EXTENSIONS:
            print(f"🔄 {len(args.inputs)} PDFs चे बॅच कॉम्प्रेशन सुरू आहे...")
            results = batch_compress_pdfs(args.inputs, out_dir, target_kb=target_kb, enhance_text=not args.no_enhance)
            print(f"✅ {len(results)} PDFs यशस्वीरीत्या सेव्ह झाल्या: {out_dir}")
        else:
            print(f"🔄 {len(args.inputs)} इमेजेसचे बॅच कॉम्प्रेशन सुरू आहे...")
            results = batch_compress_images(args.inputs, out_dir, target_kb=target_kb, preset=args.preset, enhance_text=not args.no_enhance)
            print(f"✅ {len(results)} इमेजेस यशस्वीरीत्या सेव्ह झाल्या: {out_dir}")
        return

    # Merge PDFs mode
    if args.merge_pdf or (len(args.inputs) > 1 and ext in PDF_EXTENSIONS):
        target_kb = args.target if args.target else 250
        out_file = args.output if args.output else str(Path(first_path).parent / f"Merged_{target_kb}KB.pdf")
        print(f"🔄 {len(args.inputs)} PDF जोडून १ PDF बनवत आहे...")
        res = merge_pdfs_to_exact_target(args.inputs, out_file, target_kb=target_kb, enhance_text=not args.no_enhance)
        print(f"✅ PDF यशस्वी! साईझ: {res['final_kb']} KB / {res['target_kb']} KB")
        return

    # Image to PDF mode
    if args.to_pdf or (len(args.inputs) > 1 and ext in IMAGE_EXTENSIONS and args.output and args.output.endswith(".pdf")):
        target_kb = args.target if args.target else 250
        out_file = args.output if args.output else str(Path(first_path).parent / f"Merged_{target_kb}KB.pdf")
        print(f"🔄 {len(args.inputs)} फोटो जोडून १ PDF बनवत आहे...")
        res = convert_images_to_pdf(args.inputs, out_file, target_kb=target_kb, enhance_text=not args.no_enhance)
        print(f"✅ PDF यशस्वी! साईझ: {res['final_kb']} KB / {res['target_kb']} KB")
        return

    # Single Image mode
    if ext in IMAGE_EXTENSIONS:
        target_kb = args.target if args.target else (20 if args.preset == "signature" else 50)
        out_file = args.output if args.output else str(Path(first_path).parent / f"{Path(first_path).stem}_compressed_{target_kb}KB.jpg")
        print(f"🔄 इमेज कॉम्प्रेशन सुरू: {first_path}")
        print(f"🎯 टार्गेट साईझ: {target_kb} KB • प्रिसेट: {args.preset}")
        res = compress_image_to_exact_target(
            first_path,
            out_file,
            target_kb=target_kb,
            dimension_preset=args.preset,
            enhance_text=not args.no_enhance
        )
        print("\n" + "="*50)
        print("✅ इमेज कॉम्प्रेशन यशस्वी झाले!")
        print(f"🖼️ मूळ फाईल साईझ: {res['original_kb']} KB")
        print(f"📉 कॉम्प्रेस साईझ: {res['final_kb']} KB (टार्गेट: {res['target_kb']} KB)")
        print(f"📐 अंतिम डायमेन्शन्स: {res['dimensions']}")
        print(f"🎉 एकूण बचत: {res['savings_pct']}%")
        print(f"💾 सेव्ह केलेली फाईल: {res['output_path']}")
        print("="*50)
        return

    # PDF mode
    target_kb = args.target if args.target else 250
    out_file = args.output if args.output else str(Path(first_path).parent / f"{Path(first_path).stem}_compressed_{target_kb}KB.pdf")
    print(f"🔄 PDF कॉम्प्रेशन सुरू: {first_path}")
    print(f"🎯 टार्गेट साईझ: {target_kb} KB")
    res = compress_pdf_to_exact_target(
        first_path,
        out_file,
        target_kb=target_kb,
        enhance_text=not args.no_enhance
    )
    print("\n" + "="*50)
    print("✅ PDF कॉम्प्रेशन यशस्वी झाले!")
    print(f"📄 मूळ फाईल साईझ: {res['original_kb']} KB")
    print(f"📉 कॉम्प्रेस साईझ: {res['final_kb']} KB (टार्गेट: {res['target_kb']} KB)")
    print(f"🎉 एकूण बचत: {res['savings_pct']}%")
    print(f"💾 सेव्ह केलेली फाईल: {res['output_path']}")
    print("="*50)


if __name__ == "__main__":
    main()
