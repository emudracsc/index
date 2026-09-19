import sys
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')

font_m = pymupdf.Font(fontfile=r"C:\Windows\Fonts\Nirmala.ttf")
txt = "सहाय्यक मतदार नोंदणी अधिकारी, कुडाळ"
w = font_m.text_length(txt, fontsize=8.0)
print(f"Text width for '{txt}' at 8pt = {w:.2f}")

txt_en = "Assistant Electoral Registration Officer, Kudal"
font_en = pymupdf.Font("helv")
w_en = font_en.text_length(txt_en, fontsize=8.0)
print(f"Text width for '{txt_en}' at 8pt = {w_en:.2f}")
