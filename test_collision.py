import sys
import os
import pymupdf

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

in_pdf = r"outputs/SH_268_277_SHRD_CDQ0845958_बदललेली_1789814432720.pdf"
doc = pymupdf.open(in_pdf)
page = doc[0]

rule_map = {
    "Jagdish Narayan Katkar": "Anand M. Joshi",
    "ERO, Kankavli": "AERO, Kudal",
    "Kankavli": "Kudal",
    "30-SEP-2026": "05-OCT-2026",
    "12:00 PM - 02:30 PM": "10:30 AM - 01:30 PM"
}

sorted_keys = sorted(rule_map.keys(), key=len, reverse=True)
occupied_rects = []
actions = []

for find_text in sorted_keys:
    rects = page.search_for(find_text)
    for r in rects:
        collision = False
        for occ in occupied_rects:
            intersect = r & occ
            if not intersect.is_empty and intersect.get_area() > 0.05 * min(r.get_area(), occ.get_area()):
                collision = True
                break
        if collision:
            print(f"🚫 Collision prevented: '{find_text}' at {r}")
            continue
        occupied_rects.append(r)
        actions.append((r, find_text, rule_map[find_text]))

print(f"\n✅ Total clean actions: {len(actions)}")
for r, f, rep in actions:
    print(f"  • '{f}' -> '{rep}' at ({r.x0:.1f}, {r.y0:.1f})")

doc.close()
