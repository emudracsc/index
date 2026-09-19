import pymupdf
import os

doc = pymupdf.open()
page = doc.new_page(width=600, height=800)

text = 'सहाय्यक मतदार नोंदणी अधिकारी, कणकवली'
font_path = 'Lohit-Marathi.ttf'

# Test 1: insert_text
page.insert_text((50, 50), '1. insert_text:', fontsize=12, color=(0,0,1))
page.insert_text((50, 75), text, fontname='f1', fontfile=font_path, fontsize=14)

# Test 2: insert_textbox
page.insert_text((50, 120), '2. insert_textbox:', fontsize=12, color=(0,0,1))
page.insert_textbox(pymupdf.Rect(50, 135, 550, 180), text, fontname='f2', fontfile=font_path, fontsize=14)

# Test 3: Story (MuPDF Story / HTML with HarfBuzz engine)
try:
    html = f"""<style>
    @font-face {{
        font-family: 'MarathiFont';
        src: url('{font_path}');
    }}
    p {{
        font-family: 'MarathiFont';
        font-size: 14pt;
        color: #000000;
    }}
    </style>
    <p>{text}</p>
    """
    story = pymupdf.Story(html=html)
    writer = pymupdf.TextWriter(page.rect)
    story.place(pymupdf.Rect(50, 230, 550, 300))
    story.draw(page)
    page.insert_text((50, 215), '3. pymupdf.Story (HTML/HarfBuzz):', fontsize=12, color=(0,0,1))
    print('Story drawn successfully')
except Exception as e:
    print('Story error:', e)

pix = page.get_pixmap(dpi=150)
pix.save('test_shaping_methods.png')
print('Saved test_shaping_methods.png')
