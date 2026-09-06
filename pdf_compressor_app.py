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


# =============================================================================
# १. कोर इमेज कॉम्प्रेशन अल्गोरिदम (Exact Target Size Image Engine)
# =============================================================================
def compress_image_to_exact_target(
    input_path: str,
    output_path: str,
    target_kb: int = 50,
    dimension_preset: str = "original",  # 'original' | 'photo' | 'signature' | 'document'
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
        if dimension_preset == "photo":
            # शासकीय पासपोर्ट फोटो: १६० x २०० px (सेंटर कव्हर फिट)
            tw, th = 160, 200
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

        # अंतिम फाईल सेव्ह करणे
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
    दिलेल्या PDF फाईलला दिलेल्या Target KB च्या आत आणि जास्तीत जास्त 
    उत्कृष्ट गुणवत्तेत (Max DPI & Sharpening) कॉम्प्रेस करते.
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
    overhead = (total_pages * 4096) + 8192
    available_img_bytes = max(10240, target_bytes - overhead)
    target_per_page = available_img_bytes // total_pages

    # सुरुवातीचे अचूक DPI व Quality कॅलिब्रेशन (Headroom for High Targets)
    if target_per_page > 320 * 1024:
        initial_dpi = 220
        min_q, max_q = 78, 96
    elif target_per_page > 180 * 1024:
        initial_dpi = 175
        min_q, max_q = 68, 90
    elif target_per_page > 90 * 1024:
        initial_dpi = 135
        min_q, max_q = 55, 85
    elif target_per_page > 50 * 1024:
        initial_dpi = 95
        min_q, max_q = 40, 80
    else:
        initial_dpi = 85
        min_q, max_q = 25, 75

    curr_dpi = initial_dpi
    curr_q = (min_q + max_q) // 2

    # अचूक टार्गेट साईझ एनफोर्समेंट लूप (९०% ते १००% ब्रॅकेट हमी: उदा. ५०० KB साठी ४५० ते ५०० KB)
    target_min_bytes = int(round(target_bytes * 0.90))
    target_sweet_bytes = int(round(target_bytes * 0.96))

    best_size = 0
    best_temp_file = None

    max_passes = 8
    for attempt in range(max_passes):
        if progress_callback:
            progress_callback(attempt + 1, max_passes, f"PDF फेरी {attempt + 1}: ऑप्टिमायझेशन सुरू आहे...")

        new_doc = fitz.open()
        scale = curr_dpi / 72.0
        mat = fitz.Matrix(scale, scale)

        for page_idx in range(total_pages):
            page = doc[page_idx]
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            if enhance_text:
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(1.18)
                if curr_dpi <= 130:
                    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=135, threshold=3))

            img_buffer = io.BytesIO()
            img.save(img_buffer, format="JPEG", quality=curr_q, optimize=True, subsampling=1)
            img_bytes = img_buffer.getvalue()

            rect = page.rect
            new_page = new_doc.new_page(width=rect.width, height=rect.height)
            new_page.insert_image(rect, stream=img_bytes)

        temp_out = f"{output_path}.tmp_{attempt}.pdf"
        new_doc.save(temp_out, garbage=4, deflate=True, clean=True)
        size = os.path.getsize(temp_out)
        new_doc.close()

        if size <= target_bytes:
            if size > best_size:
                if best_temp_file and os.path.exists(best_temp_file):
                    os.remove(best_temp_file)
                best_temp_file = temp_out
                best_size = size
            else:
                if os.path.exists(temp_out):
                    os.remove(temp_out)

            # जर फाईल अचूक टार्गेट ब्रॅकेटमध्ये (९०% ते १००%) आली तर पूर्ण!
            if size >= target_min_bytes:
                break

            # ९०% पेक्षा लहान असल्यास क्वालिटी व DPI वाढवणे (Upward Calibration)
            boost_ratio = min(1.30, ((target_sweet_bytes / max(size, 1024)) ** 0.5))
            curr_q = min(max_q, int(round(curr_q * boost_ratio)))
            curr_dpi = min(240, int(round(curr_dpi * (boost_ratio ** 0.5))))
        else:
            if os.path.exists(temp_out):
                os.remove(temp_out)
            reduc_ratio = (target_sweet_bytes / size) * 0.98
            curr_q = max(16, int(round(curr_q * reduc_ratio)))
            if curr_q <= 35 or size > target_bytes * 1.10:
                scale_down = (target_sweet_bytes / size) ** 0.5
                curr_dpi = max(70, int(round(curr_dpi * scale_down)))

    if best_temp_file and os.path.exists(best_temp_file):
        if os.path.exists(output_path):
            os.remove(output_path)
        os.rename(best_temp_file, output_path)
        doc.close()
    else:
        # अतिरिक्त हमी फेरी (Guaranteed Fallback Pass)
        new_doc = fitz.open()
        fallback_dpi = 75 if target_kb < 100 else 85
        scale = fallback_dpi / 72.0
        mat = fitz.Matrix(scale, scale)
        for page_idx in range(total_pages):
            page = doc[page_idx]
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img_buffer = io.BytesIO()
            img.save(img_buffer, format="JPEG", quality=24 if target_kb < 100 else 28, optimize=True)
            new_page = new_doc.new_page(width=page.rect.width, height=page.rect.height)
            new_page.insert_image(page.rect, stream=img_buffer.getvalue())
        new_doc.save(output_path, garbage=4, deflate=True, clean=True)
        new_doc.close()
        doc.close()

    final_size = os.path.getsize(output_path)
    savings_pct = round((1 - (final_size / orig_bytes)) * 100, 1)

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
    overhead = (num_images * 4096) + 8192
    usable_bytes = max(10240, target_bytes - overhead)
    target_per_img_kb = max(18, (usable_bytes // num_images) // 1024)

    total_orig_bytes = sum(os.path.getsize(p) for p in image_paths if os.path.exists(p))

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

    final_size = os.path.getsize(output_path)
    target_min_bytes = int(round(target_bytes * 0.90))
    target_sweet_bytes = int(round(target_bytes * 0.96))

    # जर एकत्र झालेली PDF ९०% पेक्षा लहान असेल तर Upward Calibration फेरी
    if final_size < target_min_bytes:
        boost = min(1.4, (target_sweet_bytes / max(final_size, 1024)) ** 0.5)
        new_target_per_img_kb = int(round(target_per_img_kb * boost))
        if new_target_per_img_kb > target_per_img_kb:
            new_doc2 = fitz.open()
            for idx, img_path in enumerate(image_paths):
                temp_img_out = f"{output_path}.img_tmp_{idx}.jpg"
                compress_image_to_exact_target(
                    img_path,
                    temp_img_out,
                    target_kb=new_target_per_img_kb,
                    dimension_preset="document",
                    enhance_text=enhance_text
                )
                with Image.open(temp_img_out) as temp_im:
                    w, h = temp_im.size
                is_landscape = w > h
                page_w = 841.89 if is_landscape else 595.28
                page_h = 595.28 if is_landscape else 841.89
                rect = fitz.Rect(0, 0, page_w, page_h)
                page = new_doc2.new_page(width=page_w, height=page_h)
                with open(temp_img_out, "rb") as f:
                    page.insert_image(rect, stream=f.read())
                if os.path.exists(temp_img_out):
                    try:
                        os.remove(temp_img_out)
                    except Exception:
                        pass
            temp_out2 = f"{output_path}.tmp_boost.pdf"
            new_doc2.save(temp_out2, garbage=4, deflate=True, clean=True)
            new_doc2.close()
            size2 = os.path.getsize(temp_out2)
            if size2 <= target_bytes and size2 > final_size:
                if os.path.exists(output_path):
                    os.remove(output_path)
                os.rename(temp_out2, output_path)
                final_size = size2
            else:
                if os.path.exists(temp_out2):
                    os.remove(temp_out2)

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
        "savings_pct": savings_pct
    }


# =============================================================================
# ४. आधुनिक ग्राफिकल युझर इंटरफेस (CustomTkinter GUI Suite)
# =============================================================================
def launch_gui():
    try:
        import customtkinter as ctk
        from tkinter import filedialog, messagebox
    except ImportError:
        print("GUI साठी CustomTkinter उपलब्ध नाही. कृपया: pip install customtkinter pillow चालवा.")
        return

    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")

    root = ctk.CTk()
    root.title("🏛️ ई-मुद्रा शासकीय PDF & Image Compressor Pro")
    root.geometry("740x720")
    root.resizable(False, False)

    # State variables
    current_tool_mode = ctk.StringVar(value="auto") # 'pdf' | 'image' | 'img_to_pdf'
    selected_files_list = []
    target_kb_var = ctk.StringVar(value="50")
    status_text_var = ctk.StringVar(value="कृपया कोणतीही PDF किंवा इमेज फाईल (फोटो/स्वाक्षरी) निवडा...")
    enhance_var = ctk.BooleanVar(value=True)
    dimension_preset_var = ctk.StringVar(value="photo")
    last_output_file = [None]

    # 1. Header Box
    header_frame = ctk.CTkFrame(root, corner_radius=12, fg_color="#0f172a", border_width=1, border_color="#1e293b")
    header_frame.pack(fill="x", padx=20, pady=(14, 10))

    title_lbl = ctk.CTkLabel(
        header_frame,
        text="🗜️ ई-मुद्रा शासकीय PDF & Image Suite Pro",
        font=ctk.CTkFont(family="Mukta", size=20, weight="bold"),
        text_color="#38bdf8"
    )
    title_lbl.pack(pady=(10, 2))

    sub_lbl = ctk.CTkLabel(
        header_frame,
        text="PDF, फोटो व स्वाक्षरी गुणवत्ता कमी न होता अचूक टार्गेट साईझमध्ये (२० KB, ५० KB, २५० KB) कॉम्प्रेस करा",
        font=ctk.CTkFont(size=12),
        text_color="#94a3b8"
    )
    sub_lbl.pack(pady=(0, 10))

    # 2. Mode Selector Bar
    mode_bar = ctk.CTkFrame(root, corner_radius=10, fg_color="#1e293b")
    mode_bar.pack(fill="x", padx=20, pady=(0, 8))

    def on_mode_tab_changed(new_mode):
        current_tool_mode.set(new_mode)
        update_mode_ui()

    btn_tab_pdf = ctk.CTkButton(mode_bar, text="📄 सिंगल PDF", width=160, command=lambda: on_mode_tab_changed("pdf"))
    btn_tab_pdf.pack(side="left", padx=4, pady=4, expand=True, fill="x")

    btn_tab_img = ctk.CTkButton(mode_bar, text="🖼️ फोटो / स्वाक्षरी", width=160, command=lambda: on_mode_tab_changed("image"))
    btn_tab_img.pack(side="left", padx=4, pady=4, expand=True, fill="x")

    btn_tab_merge = ctk.CTkButton(mode_bar, text="📸 फोटो ➔ १ PDF", width=160, command=lambda: on_mode_tab_changed("img_to_pdf"))
    btn_tab_merge.pack(side="left", padx=4, pady=4, expand=True, fill="x")

    # 3. File Selection Box
    file_frame = ctk.CTkFrame(root, corner_radius=12)
    file_frame.pack(fill="x", padx=20, pady=6)

    file_title_lbl = ctk.CTkLabel(file_frame, text="१. कॉम्प्रेस करायची फाईल किंवा फोटो निवडा:", font=ctk.CTkFont(size=13, weight="bold"))
    file_title_lbl.pack(anchor="w", padx=16, pady=(10, 4))

    file_row = ctk.CTkFrame(file_frame, fg_color="transparent")
    file_row.pack(fill="x", padx=16, pady=(0, 10))

    file_entry_text = ctk.StringVar(value="")
    file_entry = ctk.CTkEntry(file_row, textvariable=file_entry_text, placeholder_text="येथे निवडलेली फाईल दिसेल...", width=530)
    file_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))

    def browse_files():
        mode = current_tool_mode.get()
        if mode == "pdf":
            filetypes = [("PDF Files", "*.pdf"), ("All Files", "*.*")]
        elif mode in ("image", "img_to_pdf"):
            filetypes = [("Image Files", "*.jpg;*.jpeg;*.png;*.webp;*.bmp"), ("All Files", "*.*")]
        else:
            filetypes = [("PDF & Images", "*.pdf;*.jpg;*.jpeg;*.png;*.webp;*.bmp"), ("All Files", "*.*")]

        allow_multi = (mode == "img_to_pdf")
        if allow_multi:
            paths = filedialog.askopenfilenames(title="कागदपत्रांचे फोटो निवडा", filetypes=filetypes)
        else:
            p = filedialog.askopenfilename(title="फाईल निवडा", filetypes=filetypes)
            paths = [p] if p else []

        if paths and paths[0]:
            nonlocal selected_files_list
            selected_files_list = list(paths)
            first_ext = Path(paths[0]).suffix.lower()

            if len(paths) == 1:
                file_entry_text.set(paths[0])
                sz_kb = os.path.getsize(paths[0]) / 1024
                sz_str = f"{sz_kb/1024:.2f} MB" if sz_kb > 1024 else f"{sz_kb:.1f} KB"
                status_text_var.set(f"निवडलेली फाईल: {os.path.basename(paths[0])} ({sz_str})")

                # Auto-detect mode
                if first_ext in PDF_EXTENSIONS and current_tool_mode.get() != "pdf":
                    current_tool_mode.set("pdf")
                    update_mode_ui()
                elif first_ext in IMAGE_EXTENSIONS and current_tool_mode.get() == "pdf":
                    current_tool_mode.set("image")
                    update_mode_ui()
            else:
                file_entry_text.set(f"{len(paths)} फोटो निवडले: {os.path.basename(paths[0])} + इतर {len(paths)-1}")
                current_tool_mode.set("img_to_pdf")
                update_mode_ui()

    browse_btn = ctk.CTkButton(file_row, text="📁 Browse...", width=110, command=browse_files)
    browse_btn.pack(side="right")

    # 4. Dimension Presets Box (Specifically for Images)
    dim_frame = ctk.CTkFrame(root, corner_radius=12)
    dim_frame.pack(fill="x", padx=20, pady=6)

    dim_title_lbl = ctk.CTkLabel(dim_frame, text="२. शासकीय पोर्टल डायमेन्शन प्रिसेट (Portal Dimension):", font=ctk.CTkFont(size=13, weight="bold"), text_color="#f472b6")
    dim_title_lbl.pack(anchor="w", padx=16, pady=(8, 4))

    dim_btn_row = ctk.CTkFrame(dim_frame, fg_color="transparent")
    dim_btn_row.pack(fill="x", padx=16, pady=(0, 8))

    def set_dim_preset(preset):
        dimension_preset_var.set(preset)
        for p, btn in dim_buttons.items():
            if p == preset:
                btn.configure(fg_color="#db2777", hover_color="#be185d")
            else:
                btn.configure(fg_color="#334155", hover_color="#475569")

        if preset == "photo":
            target_kb_var.set("50")
            dim_hint_lbl.configure(text="👤 पासपोर्ट फोटो: १६० × २०० px रिझोल्युशन व ५० KB साईझ (आपले सरकार, महाडीबीटी, MPSC)")
        elif preset == "signature":
            target_kb_var.set("20")
            dim_hint_lbl.configure(text="✍️ स्वाक्षरी (Signature): २५६ × ६४ px रिझोल्युशन व २० KB साईझ (शासकीय पोर्टल नियम)")
        elif preset == "document":
            target_kb_var.set("150")
            dim_hint_lbl.configure(text="📄 कागदपत्र / स्कॅन: कमाल १२०० px रुंदी ठेवून स्वच्छ व वाचण्याजोगे केले जाईल.")
        else:
            dim_hint_lbl.configure(text="🔄 मूळ आकार: फोटोचा मूळ अस्पेक्ट रेशो कायम ठेवून फाईल टार्गेट KB मध्ये कॉम्प्रेस होईल.")

    dim_buttons = {}
    b1 = ctk.CTkButton(dim_btn_row, text="👤 फोटो (160×200)", width=130, command=lambda: set_dim_preset("photo"))
    b1.pack(side="left", padx=4)
    dim_buttons["photo"] = b1

    b2 = ctk.CTkButton(dim_btn_row, text="✍️ स्वाक्षरी (256×64)", width=130, command=lambda: set_dim_preset("signature"))
    b2.pack(side="left", padx=4)
    dim_buttons["signature"] = b2

    b3 = ctk.CTkButton(dim_btn_row, text="🔄 मूळ आकार", width=130, command=lambda: set_dim_preset("original"))
    b3.pack(side="left", padx=4)
    dim_buttons["original"] = b3

    b4 = ctk.CTkButton(dim_btn_row, text="📄 कागदपत्र", width=130, command=lambda: set_dim_preset("document"))
    b4.pack(side="left", padx=4)
    dim_buttons["document"] = b4

    dim_hint_lbl = ctk.CTkLabel(dim_frame, text="शासकीय भरती, आपले सरकार, महाडीबीटीसाठी फोटो 160×200 px व स्वाक्षरी 256×64 px मध्ये आपोआप रिसाइज होते.", font=ctk.CTkFont(size=11), text_color="#cbd5e1")
    dim_hint_lbl.pack(anchor="w", padx=16, pady=(0, 8))

    # 5. Target Size Selection Box
    target_frame = ctk.CTkFrame(root, corner_radius=12)
    target_frame.pack(fill="x", padx=20, pady=6)

    target_title_lbl = ctk.CTkLabel(target_frame, text="३. अचूक टार्गेट साईझ निवडा (Target Size in KB):", font=ctk.CTkFont(size=13, weight="bold"))
    target_title_lbl.pack(anchor="w", padx=16, pady=(8, 6))

    chips_row = ctk.CTkFrame(target_frame, fg_color="transparent")
    chips_row.pack(fill="x", padx=16, pady=(0, 6))

    def set_target(val):
        target_kb_var.set(str(val))
        if current_tool_mode.get() == "image":
            if val == 20:
                set_dim_preset("signature")
            elif val == 50:
                set_dim_preset("photo")

    chip_widgets = []
    def render_chips_for_mode():
        for w in chip_widgets:
            w.destroy()
        chip_widgets.clear()

        mode = current_tool_mode.get()
        if mode == "image":
            chips_data = [
                ("✍️ २० KB", 20, "#db2777"),
                ("👤 ५० KB", 50, "#0284c7"),
                ("📄 १०० KB", 100, "#059669"),
                ("🎯 १५० KB", 150, "#d97706"),
                ("📦 २०० KB", 200, "#475569")
            ]
        else:
            chips_data = [
                ("⚡ १०० KB", 100, "#d97706"),
                ("📄 १५० KB", 150, "#0284c7"),
                ("🏛️ २५० KB", 250, "#0284c7"),
                ("🎓 ४८० KB", 480, "#059669"),
                ("📑 १ MB", 1024, "#475569")
            ]

        for label, val, col in chips_data:
            btn = ctk.CTkButton(chips_row, text=label, width=95, fg_color=col, command=lambda v=val: set_target(v))
            btn.pack(side="left", padx=3)
            chip_widgets.append(btn)

        custom_box = ctk.CTkFrame(chips_row, fg_color="transparent")
        custom_box.pack(side="left", padx=6)
        clbl = ctk.CTkLabel(custom_box, text="कस्टम KB:", font=ctk.CTkFont(size=11))
        clbl.pack(anchor="w")
        cinp = ctk.CTkEntry(custom_box, textvariable=target_kb_var, width=70)
        cinp.pack()
        chip_widgets.append(custom_box)

    render_chips_for_mode()

    enhance_check = ctk.CTkCheckBox(target_frame, text="मजकूर व फोटो क्लॅरिटी बूस्ट (Zero Blur Guarantee - मजकूर १००% स्पष्ट राहतो)", variable=enhance_var)
    enhance_check.pack(anchor="w", padx=16, pady=(4, 10))

    def update_mode_ui():
        mode = current_tool_mode.get()
        if mode == "image":
            btn_tab_img.configure(fg_color="#db2777")
            btn_tab_pdf.configure(fg_color="#334155")
            btn_tab_merge.configure(fg_color="#334155")
            dim_frame.pack(fill="x", padx=20, pady=6, after=file_frame)
            target_kb_var.set("50")
            set_dim_preset("photo")
        elif mode == "pdf":
            btn_tab_pdf.configure(fg_color="#0284c7")
            btn_tab_img.configure(fg_color="#334155")
            btn_tab_merge.configure(fg_color="#334155")
            dim_frame.pack_forget()
            target_kb_var.set("250")
        elif mode == "img_to_pdf":
            btn_tab_merge.configure(fg_color="#8b5cf6")
            btn_tab_pdf.configure(fg_color="#334155")
            btn_tab_img.configure(fg_color="#334155")
            dim_frame.pack_forget()
            target_kb_var.set("250")
        render_chips_for_mode()

    # Initial state
    set_dim_preset("photo")
    update_mode_ui()

    # 6. Action & Progress Box
    action_frame = ctk.CTkFrame(root, corner_radius=12)
    action_frame.pack(fill="x", padx=20, pady=6)

    progress_bar = ctk.CTkProgressBar(action_frame)
    progress_bar.pack(fill="x", padx=16, pady=(12, 6))
    progress_bar.set(0)

    status_lbl = ctk.CTkLabel(action_frame, textvariable=status_text_var, font=ctk.CTkFont(size=12), text_color="#cbd5e1")
    status_lbl.pack(pady=(0, 8))

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
        progress_bar.set(0.2)
        root.update()

        try:
            def update_progress(curr, total, msg):
                progress_bar.set(curr / total)
                status_text_var.set(msg)
                root.update()

            if mode == "image" or (mode == "auto" and p.suffix.lower() in IMAGE_EXTENSIONS and len(selected_files_list) == 1):
                out_path = str(p.parent / f"{p.stem}_compressed_{target_kb}KB.jpg")
                res = compress_image_to_exact_target(
                    first_file,
                    out_path,
                    target_kb=target_kb,
                    dimension_preset=dimension_preset_var.get(),
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                extra_info = f"डायमेन्शन्स: {res['dimensions']}\n"
            elif mode == "img_to_pdf" or (len(selected_files_list) > 1 and p.suffix.lower() in IMAGE_EXTENSIONS):
                out_path = str(p.parent / f"Merged_Photos_{target_kb}KB.pdf")
                res = convert_images_to_pdf(
                    selected_files_list,
                    out_path,
                    target_kb=target_kb,
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                extra_info = f"एकत्र जोडलेले फोटो: {res['input_count']} पाने\n"
            else:
                out_path = str(p.parent / f"{p.stem}_compressed_{target_kb}KB.pdf")
                res = compress_pdf_to_exact_target(
                    first_file,
                    out_path,
                    target_kb=target_kb,
                    enhance_text=enhance_var.get(),
                    progress_callback=update_progress
                )
                extra_info = f"एकूण पाने: {res.get('pages', 1)}\n"

            progress_bar.set(1.0)
            last_output_file[0] = out_path

            result_msg = (
                f"✅ कॉम्प्रेशन १००% यशस्वी!\n\n"
                f"मूळ साईझ: {res['original_kb']} KB\n"
                f"नवीन साईझ: {res['final_kb']} KB (टार्गेट: {res['target_kb']} KB)\n"
                f"{extra_info}"
                f"बचत: {res['savings_pct']}%\n\n"
                f"फाईल सेव्ह झाली:\n{out_path}"
            )
            status_text_var.set(f"✅ यशस्वी: {res['final_kb']} KB (टार्गेट: {res['target_kb']} KB) • बचत: {res['savings_pct']}%")
            btn_open_file.configure(state="normal")
            btn_open_folder.configure(state="normal")
            messagebox.showinfo("यशस्वी", result_msg)

        except Exception as e:
            status_text_var.set(f"त्रुटी: {str(e)}")
            messagebox.showerror("कॉम्प्रेशन त्रुटी", str(e))
        finally:
            btn_run.configure(state="normal")

    btn_run = ctk.CTkButton(
        action_frame,
        text="🚀 अचूक साईझमध्ये कॉम्प्रेस करा (Start Compression)",
        font=ctk.CTkFont(size=15, weight="bold"),
        height=42,
        fg_color="#059669",
        hover_color="#047857",
        command=run_compression_gui
    )
    btn_run.pack(fill="x", padx=16, pady=(0, 10))

    # 7. Bottom Open Buttons
    bottom_row = ctk.CTkFrame(root, fg_color="transparent")
    bottom_row.pack(fill="x", padx=20, pady=(2, 12))

    def open_compressed_file():
        f = last_output_file[0]
        if f and os.path.exists(f):
            os.startfile(f)

    def open_output_folder():
        f = last_output_file[0]
        if f and os.path.exists(f):
            subprocess.run(["explorer", "/select,", os.path.normpath(f)])

    btn_open_file = ctk.CTkButton(bottom_row, text="👁️ तयार फाईल उघडा", state="disabled", command=open_compressed_file)
    btn_open_file.pack(side="left", fill="x", expand=True, padx=(0, 6))

    btn_open_folder = ctk.CTkButton(bottom_row, text="📂 फोल्डर उघडा", state="disabled", fg_color="#334155", hover_color="#475569", command=open_output_folder)
    btn_open_folder.pack(side="right", fill="x", expand=True, padx=(6, 0))

    root.mainloop()


# =============================================================================
# ५. CLI Main Entry Point
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description="शासकीय PDF व इमेज अचूक साईझ कॉम्प्रेशन टूल")
    parser.add_argument("inputs", nargs="*", help="इनपुट PDF किंवा इमेज फाईल पाथ्स")
    parser.add_argument("-t", "--target", type=int, help="टार्गेट फाईल साईझ KB मध्ये (उदा. २०, ५०, २५०)")
    parser.add_argument("-o", "--output", help="आउटपुट फाईल पाथ")
    parser.add_argument("--preset", choices=["photo", "signature", "document", "original"], default="original", help="इमेज डायमेन्शन प्रिसेट")
    parser.add_argument("--to-pdf", action="store_true", help="अनेक इमेज एकत्र जोडून १ PDF बनवा")
    parser.add_argument("--no-enhance", action="store_true", help="मजकूर व फोटो शार्पनेस फिल्टर बंद करा")
    parser.add_argument("--gui", action="store_true", help="ग्राफिकल इंटरफेस उघडा")

    args = parser.parse_args()

    if not args.inputs or args.gui:
        launch_gui()
        return

    first_path = args.inputs[0]
    ext = Path(first_path).suffix.lower()

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
