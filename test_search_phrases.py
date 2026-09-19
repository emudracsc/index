import sys
import os
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'uploads/in_1789813828804_merged-from-zip-1789760618985-replaced-replaced (1).pdf'
doc = pymupdf.open(pdf_path)
page = doc[1] # Page 2 (Marathi)

print("Page rect:", page.rect)

# Search for "मतदार नोंदणी अधिकारी"
m_rects = page.search_for("मतदार नोंदणी अधिकारी")
print("Search for 'मतदार नोंदणी अधिकारी':", m_rects)

# Search for "मतदार नोंदणी अधिकारी, कणकवली"
full_rects = page.search_for("मतदार नोंदणी अधिकारी, कणकवली")
print("Search for 'मतदार नोंदणी अधिकारी, कणकवली':", full_rects)

# Search for "ERO"
p1 = doc[0]
ero_rects = p1.search_for("ERO")
print("Search for 'ERO' on Page 1:", ero_rects)
ero_full_rects = p1.search_for("ERO, Kankavli")
print("Search for 'ERO, Kankavli' on Page 1:", ero_full_rects)
