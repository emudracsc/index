"""
नमुना PDF जनरेटर (Sample PDF Generator)
=====================================
चाचणीसाठी मराठी व इंग्रजी मजकूर असलेली बहुपृष्ठीय PDF तयार करतो.
"""

import os
import sys

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import pymupdf

def get_font_path():
    font_candidates = [
        r"C:\Windows\Fonts\Nirmala.ttf",
        r"C:\Windows\Fonts\mangal.ttf",
        r"C:\Windows\Fonts\aparaj.ttf",
        r"C:\Windows\Fonts\kokila.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for font in font_candidates:
        if os.path.exists(font):
            return font
    return None

def create_sample_pdf(output_path="sample_test.pdf", num_pages=5):
    font_path = get_font_path()
    if not font_path:
        print("[WARNING] देवनागरी फॉन्ट थेट सापडला नाही, डीफॉल्ट फॉन्ट वापरत आहे.")
        font_name = "helv"
        font_file = None
    else:
        font_name = "marathi_font"
        font_file = font_path

    doc = pymupdf.open()

    for page_num in range(1, num_pages + 1):
        page = doc.new_page(width=595, height=842)  # A4 size

        # Register font if available
        if font_file:
            page.insert_font(fontname=font_name, fontfile=font_file)

        # Title
        title_text = f"मतदार नोंदणी कार्यालय - नोटीस पत्र (पान क्रमांक: {page_num})"
        page.insert_text((50, 60), title_text, fontname=font_name, fontsize=16, color=(0.1, 0.2, 0.6))

        # Horizontal line
        page.draw_line(pymupdf.Point(50, 75), pymupdf.Point(545, 75), color=(0.7, 0.7, 0.7), width=1)

        # Body Content
        lines = [
            f"संदर्भ क्रमांक: ERO/2026/NOTICE/{1000 + page_num}",
            f"तारीख: 19/09/2026",
            f"तालुका: कणकवली",
            f"जिल्हा: सिंधुदुर्ग",
            f"मतदार नोंदणी अधिकारी: श्री. राजेश पाटील (उपविभागीय अधिकारी)",
            "",
            "प्रति,",
            f"मतदार नाव: श्री. रमेश सावंत (वय: {30 + page_num})",
            f"मतदार ओळखपत्र क्रमांक (EPIC): MH/{page_num:03d}/987654",
            "पत्ता: मु. पो. कणकवली, तालुका कणकवली, जिल्हा सिंधुदुर्ग.",
            "",
            "विषय: मतदार यादी विशेष संक्षिप्त पुनरीक्षण कार्यक्रम २०२६ बाबत सूचना.",
            "",
            "महोदय / महोदया,",
            "आपणास कळविण्यात येते की, कणकवली तालुक्यातील सर्व पात्र नागरिकांची नावे मतदार यादीत",
            "नोंदणी करण्याचे काम सुरू आहे. अधिक माहितीसाठी मतदार नोंदणी अधिकारी यांच्या कार्यालयाशी",
            "किंवा आपल्या भागातील मतदान केंद्रस्तरीय अधिकारी (BLO) यांच्याशी संपर्क साधावा.",
            "",
            f"ठिकाण: कणकवली",
            f"स्वाक्षरी: मतदार नोंदणी अधिकारी, कणकवली"
        ]

        y = 110
        for line in lines:
            if line:
                page.insert_text((50, y), line, fontname=font_name, fontsize=11, color=(0.15, 0.15, 0.15))
            y += 24

        # Footer
        page.draw_line(pymupdf.Point(50, 780), pymupdf.Point(545, 780), color=(0.8, 0.8, 0.8), width=0.5)
        footer_text = f"पान {page_num} of {num_pages} | कणकवली विधानसभा मतदारसंघ २०२६"
        page.insert_text((50, 800), footer_text, fontname=font_name, fontsize=9, color=(0.5, 0.5, 0.5))

    doc.save(output_path)
    doc.close()
    print(f"✅ {num_pages} पानांची सॅम्पल PDF यशस्वीरीत्या तयार झाली: {output_path}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "sample_test.pdf"
    pages = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    create_sample_pdf(out_file, pages)
