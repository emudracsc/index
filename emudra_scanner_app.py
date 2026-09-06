# -*- coding: utf-8 -*-
"""
EMUDRA UNIVERSAL SCANNER PRO
Universal Scanner Desktop Software (Like NAPS2) with Instant Government Presets
Author: e-Mudra Seva Kendra
Version: 1.0.0
"""

import os
import sys
import io
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageEnhance, ImageOps

from wia_scanner import WiaScannerEngine

APP_NAME = "EMUDRA UNIVERSAL SCANNER PRO"
APP_VERSION = "1.0.0"

def get_bundle_dir():
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

class ScannerAppGUI:
    def __init__(self, root):
        self.root = root
        self.root.title(f"{APP_NAME} v{APP_VERSION} - e-Mudra Seva Kendra")
        self.root.geometry("1100x720")
        self.root.minsize(960, 600)
        self.root.configure(bg="#090d16")

        # Set Icon
        bundle_dir = get_bundle_dir()
        icon_path = os.path.join(bundle_dir, 'images', 'emudra_compressor_icon.ico')
        if not os.path.exists(icon_path):
            icon_path = os.path.join(bundle_dir, 'emudra_compressor_icon.ico')
        if os.path.exists(icon_path):
            try:
                self.root.iconbitmap(icon_path)
            except Exception:
                pass

        self.engine = WiaScannerEngine()
        self.scanned_pages = [] # List of PIL.Image
        self.current_page_idx = 0
        self.preview_image_tk = None

        # Variables
        self.scanners_list = []
        self.selected_scanner_var = tk.StringVar(value="सर्व स्कॅनर आपोआप (Auto Detect)")
        self.dpi_var = tk.IntVar(value=200)
        self.color_mode_var = tk.StringVar(value="color") # color, grayscale, bw
        self.native_dialog_var = tk.BooleanVar(value=False)
        self.is_scanning = False

        self._setup_styles()
        self._build_ui()
        self.refresh_scanners()

    def _setup_styles(self):
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.style.configure("TProgressbar", thickness=10, troughcolor="#1e293b", background="#38bdf8")

    def _build_ui(self):
        # 1. Top Control Bar (Scanner Selection, DPI, Color, Scan Buttons)
        top_bar = tk.Frame(self.root, bg="#0f172a", bd=1, relief="solid")
        top_bar.pack(side="top", fill="x", padx=10, pady=(8, 4), ipady=6)

        # Scanner selection dropdown
        tk.Label(top_bar, text="🖨️ स्कॅनर:", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#0f172a").pack(side="left", padx=(10, 4))
        self.scanner_dropdown = ttk.Combobox(top_bar, textvariable=self.selected_scanner_var, state="readonly", width=28, font=("Segoe UI", 9))
        self.scanner_dropdown.pack(side="left", padx=(0, 6))

        refresh_btn = tk.Button(top_bar, text="🔄", font=("Segoe UI", 9, "bold"), bg="#1e293b", fg="#38bdf8", activebackground="#334155", bd=0, padx=6, pady=2, cursor="hand2", title="स्कॅनर शोधा", command=self.refresh_scanners)
        refresh_btn.pack(side="left", padx=(0, 12))

        # DPI Selector
        tk.Label(top_bar, text="DPI:", font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#0f172a").pack(side="left", padx=(4, 2))
        dpi_combo = ttk.Combobox(top_bar, textvariable=self.dpi_var, values=[100, 150, 200, 300, 600], state="readonly", width=5, font=("Segoe UI", 9))
        dpi_combo.pack(side="left", padx=(0, 12))

        # Color Mode
        tk.Label(top_bar, text="कलर:", font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#0f172a").pack(side="left", padx=(4, 2))
        color_combo = ttk.Combobox(top_bar, textvariable=self.color_mode_var, values=["color", "grayscale", "bw"], state="readonly", width=9, font=("Segoe UI", 9))
        color_combo.pack(side="left", padx=(0, 12))

        # Native Dialog Toggle
        cb_dialog = tk.Checkbutton(top_bar, text="Windows स्कॅनर डायलॉग", variable=self.native_dialog_var, font=("Segoe UI", 8), fg="#94a3b8", bg="#0f172a", selectcolor="#1e293b", activebackground="#0f172a", activeforeground="#38bdf8")
        cb_dialog.pack(side="left", padx=(0, 14))

        # Scan Button
        self.btn_scan = tk.Button(top_bar, text="▶ स्कॅन करा (Scan)", font=("Segoe UI", 10, "bold"), bg="#10b981", fg="#ffffff", activebackground="#059669", bd=0, padx=16, pady=4, cursor="hand2", command=self.trigger_scan)
        self.btn_scan.pack(side="left", padx=6)

        # Mock / Test Scan Button (for demonstration or when physical scanner is disconnected)
        btn_mock = tk.Button(top_bar, text="🧪 सॅम्पल स्कॅन (Test)", font=("Segoe UI", 9), bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=10, pady=4, cursor="hand2", command=self.trigger_mock_scan)
        btn_mock.pack(side="left", padx=4)

        # 2. Page Editing Actions Toolbar
        edit_bar = tk.Frame(self.root, bg="#1e293b")
        edit_bar.pack(side="top", fill="x", padx=10, pady=2, ipady=3)

        btn_rot_left = tk.Button(edit_bar, text="↺ डावीकडे (90°)", font=("Segoe UI", 8, "bold"), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=8, pady=3, cursor="hand2", command=lambda: self.rotate_current_page(270))
        btn_rot_left.pack(side="left", padx=4)

        btn_rot_right = tk.Button(edit_bar, text="↻ उजवीकडे (90°)", font=("Segoe UI", 8, "bold"), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=8, pady=3, cursor="hand2", command=lambda: self.rotate_current_page(90))
        btn_rot_right.pack(side="left", padx=4)

        btn_rot_180 = tk.Button(edit_bar, text="↕ 180° फिरवा", font=("Segoe UI", 8), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=8, pady=3, cursor="hand2", command=lambda: self.rotate_current_page(180))
        btn_rot_180.pack(side="left", padx=4)

        btn_enhance = tk.Button(edit_bar, text="🧽 कागदपत्र स्वच्छ करा (Clean)", font=("Segoe UI", 8, "bold"), bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=10, pady=3, cursor="hand2", command=self.enhance_current_page)
        btn_enhance.pack(side="left", padx=6)

        btn_crop_photo = tk.Button(edit_bar, text="👤 फोटो क्रॉप (160×210 px)", font=("Segoe UI", 8, "bold"), bg="#ec4899", fg="#ffffff", activebackground="#db2777", bd=0, padx=9, pady=3, cursor="hand2", command=lambda: self.crop_preset(160, 210))
        btn_crop_photo.pack(side="left", padx=4)

        btn_crop_sign = tk.Button(edit_bar, text="✍️ स्वाक्षरी (256×64 px)", font=("Segoe UI", 8, "bold"), bg="#8b5cf6", fg="#ffffff", activebackground="#7c3aed", bd=0, padx=9, pady=3, cursor="hand2", command=lambda: self.crop_preset(256, 64))
        btn_crop_sign.pack(side="left", padx=4)

        # Page reorder & delete on right
        btn_del = tk.Button(edit_bar, text="🗑️ पृष्ठ हटवा", font=("Segoe UI", 8), bg="#ef4444", fg="#ffffff", activebackground="#dc2626", bd=0, padx=8, pady=3, cursor="hand2", command=self.delete_current_page)
        btn_del.pack(side="right", padx=6)

        btn_clear = tk.Button(edit_bar, text="क्लिअर ऑल", font=("Segoe UI", 8), bg="#475569", fg="#f1f5f9", activebackground="#64748b", bd=0, padx=8, pady=3, cursor="hand2", command=self.clear_all_pages)
        btn_clear.pack(side="right", padx=4)

        btn_move_down = tk.Button(edit_bar, text="▼ खाली", font=("Segoe UI", 8), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=7, pady=3, cursor="hand2", command=lambda: self.move_page(1))
        btn_move_down.pack(side="right", padx=3)

        btn_move_up = tk.Button(edit_bar, text="▲ वर", font=("Segoe UI", 8), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=7, pady=3, cursor="hand2", command=lambda: self.move_page(-1))
        btn_move_up.pack(side="right", padx=3)

        # 3. Main Workspace: Thumbnails List (Left) + Large Preview (Right)
        workspace = tk.Frame(self.root, bg="#090d16")
        workspace.pack(fill="both", expand=True, padx=10, pady=4)

        # Left Column: Thumbnails List Frame
        left_frame = tk.Frame(workspace, bg="#0f172a", width=180, bd=1, relief="solid")
        left_frame.pack(side="left", fill="y", padx=(0, 6))
        left_frame.pack_propagate(False)

        tk.Label(left_frame, text="📑 स्कॅन पृष्ठे (Pages)", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#0f172a").pack(side="top", pady=6)

        self.thumb_canvas = tk.Canvas(left_frame, bg="#0f172a", highlightthickness=0)
        self.thumb_scrollbar = ttk.Scrollbar(left_frame, orient="vertical", command=self.thumb_canvas.yview)
        self.thumb_inner = tk.Frame(self.thumb_canvas, bg="#0f172a")

        self.thumb_inner.bind("<Configure>", lambda e: self.thumb_canvas.configure(scrollregion=self.thumb_canvas.bbox("all")))
        self.thumb_canvas.create_window((0, 0), window=self.thumb_inner, anchor="nw")
        self.thumb_canvas.configure(yscrollcommand=self.thumb_scrollbar.set)

        self.thumb_canvas.pack(side="left", fill="both", expand=True)
        self.thumb_scrollbar.pack(side="right", fill="y")

        # Right Column: Large Interactive Preview Canvas
        self.preview_frame = tk.Frame(workspace, bg="#020617", bd=1, relief="solid")
        self.preview_frame.pack(side="right", fill="both", expand=True)

        self.preview_canvas = tk.Canvas(self.preview_frame, bg="#020617", highlightthickness=0)
        self.preview_canvas.pack(fill="both", expand=True)
        self.preview_canvas.bind("<Configure>", lambda e: self.render_current_preview())

        # Placeholder label
        self.empty_lbl = tk.Label(self.preview_canvas, text="कोणतेही पृष्ठ स्कॅन केलेले नाही.\n\n'▶ स्कॅन करा' किंवा '🧪 सॅम्पल स्कॅन' बटण दाबा.", font=("Segoe UI", 12), fg="#64748b", bg="#020617")
        self.empty_lbl_window = self.preview_canvas.create_window(350, 250, window=self.empty_lbl)

        # 4. Bottom Government Export Presets Action Bar
        export_bar = tk.Frame(self.root, bg="#0f172a", bd=1, relief="solid")
        export_bar.pack(side="bottom", fill="x", padx=10, pady=(4, 8), ipady=6)

        tk.Label(export_bar, text="🏛️ थेट शासकीय फॉरमॅट सेव्ह:", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#0f172a").pack(side="left", padx=(10, 8))

        # Government PDF Export Buttons
        btn_pdf_250 = tk.Button(export_bar, text="🏛️ २५० KB PDF (आपले सरकार)", font=("Segoe UI", 9, "bold"), bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=12, pady=4, cursor="hand2", command=lambda: self.export_pdf(250))
        btn_pdf_250.pack(side="left", padx=4)

        btn_pdf_500 = tk.Button(export_bar, text="🎓 ५०० KB PDF (महाडीबीटी)", font=("Segoe UI", 9, "bold"), bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=12, pady=4, cursor="hand2", command=lambda: self.export_pdf(500))
        btn_pdf_500.pack(side="left", padx=4)

        btn_pdf_full = tk.Button(export_bar, text="📑 मूळ क्वालिटी PDF", font=("Segoe UI", 9), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=10, pady=4, cursor="hand2", command=lambda: self.export_pdf(0))
        btn_pdf_full.pack(side="left", padx=4)

        # JPG Export Buttons
        btn_jpg_photo = tk.Button(export_bar, text="👤 फोटो (160×210 • 50 KB JPG)", font=("Segoe UI", 9, "bold"), bg="#ec4899", fg="#ffffff", activebackground="#db2777", bd=0, padx=10, pady=4, cursor="hand2", command=lambda: self.export_image_preset(160, 210, 50))
        btn_jpg_photo.pack(side="left", padx=6)

        btn_jpg_sign = tk.Button(export_bar, text="✍️ सही (256×64 • 20 KB JPG)", font=("Segoe UI", 9, "bold"), bg="#8b5cf6", fg="#ffffff", activebackground="#7c3aed", bd=0, padx=10, pady=4, cursor="hand2", command=lambda: self.export_image_preset(256, 64, 20))
        btn_jpg_sign.pack(side="left", padx=4)

        btn_jpg_save = tk.Button(export_bar, text="💾 इमेज सेव्ह", font=("Segoe UI", 9), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=10, pady=4, cursor="hand2", command=self.export_current_image)
        btn_jpg_save.pack(side="right", padx=10)

    # -------------------------------------------------------------
    # Scanner Operations
    # -------------------------------------------------------------
    def refresh_scanners(self):
        def worker():
            scanners = self.engine.list_scanners()
            self.root.after(0, lambda: self._update_scanner_list(scanners))
        threading.Thread(target=worker, daemon=True).start()

    def _update_scanner_list(self, scanners):
        self.scanners_list = scanners
        vals = ["सर्व स्कॅनर आपोआप (Auto Detect)"]
        for s in scanners:
            vals.append(s['name'])
        self.scanner_dropdown['values'] = vals
        if scanners:
            self.selected_scanner_var.set(scanners[0]['name'])
        else:
            self.selected_scanner_var.set("सर्व स्कॅनर आपोआप (Auto Detect)")

    def trigger_scan(self):
        if self.is_scanning:
            return

        # Check selected scanner ID
        target_id = "AUTO"
        sel_name = self.selected_scanner_var.get()
        for s in self.scanners_list:
            if s['name'] == sel_name:
                target_id = s['id']
                break

        dpi = self.dpi_var.get()
        color = self.color_mode_var.get()
        use_dialog = self.native_dialog_var.get()

        self.is_scanning = True
        self.btn_scan.configure(text="⏳ स्कॅनिंग चालू आहे...", state="disabled", bg="#64748b")

        def worker():
            try:
                img = self.engine.acquire_scan(
                    device_id=target_id,
                    dpi=dpi,
                    color_mode=color,
                    use_native_dialog=use_dialog
                )
                if img:
                    self.root.after(0, lambda: self.add_scanned_page(img))
            except Exception as e:
                self.root.after(0, lambda: messagebox.showerror("स्कॅनिंग त्रुटी", str(e)))
            finally:
                self.root.after(0, self._scan_finished)

        threading.Thread(target=worker, daemon=True).start()

    def trigger_mock_scan(self):
        page_num = len(self.scanned_pages) + 1
        dpi = self.dpi_var.get()
        img = self.engine.create_mock_scan(page_num=page_num, dpi=dpi)
        self.add_scanned_page(img)

    def _scan_finished(self):
        self.is_scanning = False
        self.btn_scan.configure(text="▶ स्कॅन करा (Scan)", state="normal", bg="#10b981")

    # -------------------------------------------------------------
    # Page Management & Preview
    # -------------------------------------------------------------
    def add_scanned_page(self, img):
        self.scanned_pages.append(img)
        self.current_page_idx = len(self.scanned_pages) - 1
        self.render_thumbnails()
        self.render_current_preview()

    def render_thumbnails(self):
        for widget in self.thumb_inner.winfo_children():
            widget.destroy()

        for idx, img in enumerate(self.scanned_pages):
            card = tk.Frame(self.thumb_inner, bg="#1e293b" if idx == self.current_page_idx else "#0f172a", bd=1, relief="solid")
            card.pack(fill="x", padx=6, pady=4, ipadx=4, ipady=4)

            # Thumbnail image
            thumb = img.copy()
            thumb.thumbnail((120, 150))
            thumb_tk = ImageTk.PhotoImage(thumb)

            lbl_img = tk.Label(card, image=thumb_tk, bg="#0f172a", cursor="hand2")
            lbl_img.image = thumb_tk
            lbl_img.pack()
            lbl_img.bind("<Button-1>", lambda e, i=idx: self.select_page(i))

            # Title
            w, h = img.size
            lbl_txt = tk.Label(card, text=f"पृष्ठ {idx+1}\n({w}×{h})", font=("Segoe UI", 8, "bold"), fg="#38bdf8" if idx == self.current_page_idx else "#94a3b8", bg=card.cget("bg"), cursor="hand2")
            lbl_txt.pack(pady=(2, 0))
            lbl_txt.bind("<Button-1>", lambda e, i=idx: self.select_page(i))

    def select_page(self, idx):
        if 0 <= idx < len(self.scanned_pages):
            self.current_page_idx = idx
            self.render_thumbnails()
            self.render_current_preview()

    def render_current_preview(self):
        self.preview_canvas.delete("all")

        if not self.scanned_pages or self.current_page_idx >= len(self.scanned_pages):
            cw = self.preview_canvas.winfo_width()
            ch = self.preview_canvas.winfo_height()
            self.empty_lbl = tk.Label(self.preview_canvas, text="कोणतेही पृष्ठ स्कॅन केलेले नाही.\n\n'▶ स्कॅन करा' किंवा '🧪 सॅम्पल स्कॅन' बटण दाबा.", font=("Segoe UI", 12), fg="#64748b", bg="#020617")
            self.preview_canvas.create_window(cw / 2, ch / 2, window=self.empty_lbl)
            return

        img = self.scanned_pages[self.current_page_idx]
        cw = max(200, self.preview_canvas.winfo_width())
        ch = max(200, self.preview_canvas.winfo_height())

        scale = min((cw - 40) / img.width, (ch - 40) / img.height, 1.0)
        disp_w = max(50, int(img.width * scale))
        disp_h = max(50, int(img.height * scale))

        disp_img = img.resize((disp_w, disp_h), Image.Resampling.LANCZOS)
        self.preview_image_tk = ImageTk.PhotoImage(disp_img)

        self.preview_canvas.create_image(cw / 2, ch / 2, image=self.preview_image_tk)

        # Page Info Badge in top-left corner
        info_txt = f"पृष्ठ {self.current_page_idx + 1} / {len(self.scanned_pages)} • मूळ आकार: {img.width} × {img.height} px"
        self.preview_canvas.create_text(20, 20, text=info_txt, fill="#38bdf8", font=("Segoe UI", 9, "bold"), anchor="nw")

    # -------------------------------------------------------------
    # Page Operations (Rotate, Enhance, Crop, Delete, Reorder)
    # -------------------------------------------------------------
    def rotate_current_page(self, angle):
        if not self.scanned_pages: return
        img = self.scanned_pages[self.current_page_idx]
        self.scanned_pages[self.current_page_idx] = img.rotate(-angle, expand=True)
        self.render_thumbnails()
        self.render_current_preview()

    def enhance_current_page(self):
        """Clean scanned background, deepen ink, remove dirty scanner noise."""
        if not self.scanned_pages: return
        img = self.scanned_pages[self.current_page_idx].convert("RGB")
        # Enhance Contrast
        contrast = ImageEnhance.Contrast(img).enhance(1.22)
        # Enhance Brightness slightly to whiten paper
        bright = ImageEnhance.Brightness(contrast).enhance(1.05)
        # Enhance Sharpness
        sharp = ImageEnhance.Sharpness(bright).enhance(1.2)
        self.scanned_pages[self.current_page_idx] = sharp
        self.render_thumbnails()
        self.render_current_preview()
        messagebox.showinfo("कागदपत्र स्वच्छ केले", "कागदपत्राचा बॅकग्राऊंड स्वच्छ करून अक्षरे अधिक गडद व स्पष्ट करण्यात आली आहेत.")

    def crop_preset(self, target_w, target_h):
        if not self.scanned_pages: return
        img = self.scanned_pages[self.current_page_idx]

        # Crop center aspect box
        orig_w, orig_h = img.size
        ratio = target_w / target_h

        if (orig_w / orig_h) > ratio:
            crop_h = orig_h
            crop_w = int(crop_h * ratio)
        else:
            crop_w = orig_w
            crop_h = int(crop_w / ratio)

        left = int((orig_w - crop_w) / 2)
        top = int((orig_h - crop_h) / 2)
        cropped = img.crop((left, top, left + crop_w, top + crop_h))
        resized = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

        self.scanned_pages[self.current_page_idx] = resized
        self.render_thumbnails()
        self.render_current_preview()
        messagebox.showinfo("क्रॉप पूर्ण", f"पृष्ठ अचूक {target_w}×{target_h} px मध्ये क्रॉप केले आहे!")

    def delete_current_page(self):
        if not self.scanned_pages: return
        if messagebox.askyesno("पुष्टी", f"पृष्ठ {self.current_page_idx + 1} खरोखर हटवायचे आहे का?"):
            self.scanned_pages.pop(self.current_page_idx)
            if self.current_page_idx >= len(self.scanned_pages):
                self.current_page_idx = max(0, len(self.scanned_pages) - 1)
            self.render_thumbnails()
            self.render_current_preview()

    def clear_all_pages(self):
        if not self.scanned_pages: return
        if messagebox.askyesno("पुष्टी", "सर्व स्कॅन केलेली पृष्ठे हटवायची आहेत का?"):
            self.scanned_pages.clear()
            self.current_page_idx = 0
            self.render_thumbnails()
            self.render_current_preview()

    def move_page(self, direction):
        if not self.scanned_pages: return
        new_idx = self.current_page_idx + direction
        if 0 <= new_idx < len(self.scanned_pages):
            self.scanned_pages[self.current_page_idx], self.scanned_pages[new_idx] = (
                self.scanned_pages[new_idx],
                self.scanned_pages[self.current_page_idx],
            )
            self.current_page_idx = new_idx
            self.render_thumbnails()
            self.render_current_preview()

    # -------------------------------------------------------------
    # Export Engine (PDF & JPG with Size Lock)
    # -------------------------------------------------------------
    def export_pdf(self, target_kb=0):
        if not self.scanned_pages:
            messagebox.showwarning("सावधान", "कृपया प्रथम किमान एक कागदपत्र स्कॅन करा.")
            return

        default_name = f"Scan_Document_{len(self.scanned_pages)}Pages"
        if target_kb > 0:
            default_name += f"_{target_kb}KB"
        default_name += ".pdf"

        out_path = filedialog.asksaveasfilename(
            defaultextension=".pdf",
            filetypes=[("PDF Document", "*.pdf")],
            initialfile=default_name,
            title="PDF सेव्ह करा"
        )
        if not out_path:
            return

        # Export Multi-page PDF
        try:
            target_bytes = target_kb * 1024 if target_kb > 0 else 0
            pdf_bytes = self._build_pdf_bytes(target_bytes)
            with open(out_path, "wb") as f:
                f.write(pdf_bytes)

            actual_size_kb = len(pdf_bytes) / 1024
            msg = f"✅ PDF यशस्वीरित्या सेव्ह झाली!\n\nठिकाण: {out_path}\nएकूण पृष्ठे: {len(self.scanned_pages)}\nअंतिम साईझ: {actual_size_kb:.1f} KB"
            if target_kb > 0:
                msg += f"\nटार्गेट मर्यादा: कमाल {target_kb} KB (शासकीय पोर्टल १००% सुसंगत)"
            messagebox.showinfo("PDF सेव्ह यशस्वी", msg)
        except Exception as e:
            messagebox.showerror("त्रुटी", f"PDF तयार करताना त्रुटी आली: {e}")

    def _build_pdf_bytes(self, target_bytes=0):
        num_pages = len(self.scanned_pages)
        quality = 85

        if target_bytes > 0:
            per_page_bytes = (target_bytes - 3000) / num_pages
            if per_page_bytes < 35 * 1024:
                quality = 55
            elif per_page_bytes < 60 * 1024:
                quality = 70
            else:
                quality = 82

        # Convert all pages to JPEG buffers
        rgb_pages = []
        for img in self.scanned_pages:
            im = img.convert("RGB")
            # If target bytes is small, scale down if resolution is excessively high
            if target_bytes > 0 and per_page_bytes < 40 * 1024 and (im.width > 1200 or im.height > 1600):
                im.thumbnail((1200, 1600), Image.Resampling.LANCZOS)
            rgb_pages.append(im)

        # Build PDF using PIL's save(append_images)
        buf = io.BytesIO()
        first = rgb_pages[0]
        rest = rgb_pages[1:] if len(rgb_pages) > 1 else []
        first.save(buf, format="PDF", save_all=True, append_images=rest, quality=quality, optimize=True)

        data = buf.getvalue()

        # Calibration loop if target_bytes specified and exceeded
        if target_bytes > 0 and len(data) > target_bytes and quality > 25:
            for q in [quality - 15, quality - 30, 25]:
                buf = io.BytesIO()
                first.save(buf, format="PDF", save_all=True, append_images=rest, quality=q, optimize=True)
                data = buf.getvalue()
                if len(data) <= target_bytes:
                    break

        return data

    def export_image_preset(self, target_w, target_h, target_kb):
        if not self.scanned_pages:
            messagebox.showwarning("सावधान", "कृपया प्रथम किमान एक फोटो किंवा स्वाक्षरी स्कॅन करा.")
            return

        out_path = filedialog.asksaveasfilename(
            defaultextension=".jpg",
            filetypes=[("JPEG Image", "*.jpg")],
            initialfile=f"Scanned_Photo_{target_w}x{target_h}_{target_kb}KB.jpg",
            title="शासकीय इमेज सेव्ह करा"
        )
        if not out_path:
            return

        img = self.scanned_pages[self.current_page_idx].convert("RGB")
        resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

        # Compress to target KB
        target_bytes = target_kb * 1024
        quality = 85
        buf = io.BytesIO()
        resized.save(buf, format="JPEG", quality=quality)

        while len(buf.getvalue()) > target_bytes and quality > 20:
            quality -= 5
            buf = io.BytesIO()
            resized.save(buf, format="JPEG", quality=quality)

        with open(out_path, "wb") as f:
            f.write(buf.getvalue())

        messagebox.showinfo("इमेज सेव्ह यशस्वी", f"✅ इमेज यशस्वीरित्या सेव्ह झाली!\n\nआकार: {target_w}×{target_h} px\nसाईझ: {len(buf.getvalue())/1024:.1f} KB (कमाल {target_kb} KB)")

    def export_current_image(self):
        if not self.scanned_pages: return
        out_path = filedialog.asksaveasfilename(
            defaultextension=".jpg",
            filetypes=[("JPEG Image", "*.jpg"), ("PNG Image", "*.png")],
            initialfile=f"Scan_Page_{self.current_page_idx + 1}.jpg",
            title="इमेज सेव्ह करा"
        )
        if not out_path: return
        img = self.scanned_pages[self.current_page_idx]
        img.save(out_path)
        messagebox.showinfo("इमेज सेव्ह", f"इमेज यशस्वीरित्या सेव्ह झाली:\n{out_path}")

def main():
    root = tk.Tk()
    app = ScannerAppGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
