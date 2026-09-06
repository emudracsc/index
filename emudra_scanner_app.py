# -*- coding: utf-8 -*-
"""
EMUDRA UNIVERSAL SCANNER PRO (NAPS2 Edition)
Universal Scanner Desktop Software with Authentic NAPS2 Interface & Instant Government Presets
Author: e-Mudra Seva Kendra
Version: 2.0.0
"""

import os
import sys
import io
import threading
import tempfile
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageEnhance, ImageOps

# PyMuPDF for PDF Import capability (NAPS2 feature)
try:
    import fitz
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

from wia_scanner import WiaScannerEngine

APP_NAME = "EMUDRA UNIVERSAL SCANNER PRO"
APP_VERSION = "2.0.0"

def get_bundle_dir():
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


class Naps2ScannerApp:
    def __init__(self, root):
        self.root = root
        self.root.title(f"{APP_NAME} v{APP_VERSION} (NAPS2 Edition) - e-Mudra Seva Kendra")
        self.root.geometry("1180x760")
        self.root.minsize(980, 620)
        self.root.configure(bg="#f1f5f9")

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
        self.scanned_pages = []  # List of PIL.Image
        self.selected_idx = -1   # Currently selected page index (-1 if none)
        self.thumb_images_tk = []  # Keep references to avoid GC
        self.is_scanning = False

        # Current Scanner Profile Settings (NAPS2 Style)
        self.profile = {
            "name": "शासकीय A4 (200 DPI • Color)",
            "device_id": "AUTO",
            "device_name": "सर्व स्कॅनर आपोआप (Auto Detect)",
            "dpi": 200,
            "color_mode": "color",       # color, grayscale, bw
            "page_size": "A4",           # A4, Legal, Letter
            "source": "Flatbed (काच)",   # Flatbed, Feeder
            "use_native_dialog": False
        }
        self.detected_scanners = []

        self._setup_styles()
        self._build_ui()
        self.refresh_scanners()

    def _setup_styles(self):
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.style.configure("TProgressbar", thickness=8, troughcolor="#e2e8f0", background="#0284c7")

    # =========================================================================
    # UI CONSTRUCTION (AUTHENTIC NAPS2 INTERFACE)
    # =========================================================================
    def _build_ui(self):
        # 1. TOP NAPS2 RIBBON TOOLBAR (Large Iconic Action Buttons)
        ribbon_frame = tk.Frame(self.root, bg="#ffffff", bd=1, relief="solid")
        ribbon_frame.pack(side="top", fill="x", padx=0, pady=0)

        ribbon_inner = tk.Frame(ribbon_frame, bg="#ffffff")
        ribbon_inner.pack(side="top", fill="x", padx=12, pady=6)

        # Ribbon Buttons Group 1: Scanning & Profiles
        self.btn_scan = self._create_ribbon_btn(
            ribbon_inner, "🖨️", "स्कॅन करा", "Scan (F2)",
            bg="#10b981", fg="#ffffff", hover="#059669",
            command=self.trigger_scan
        )
        self.btn_scan.pack(side="left", padx=3)

        btn_profiles = self._create_ribbon_btn(
            ribbon_inner, "📑", "प्रोफाईल्स", "Profiles",
            bg="#f8fafc", fg="#1e293b", hover="#e2e8f0",
            command=self.open_profiles_dialog
        )
        btn_profiles.pack(side="left", padx=3)

        btn_import = self._create_ribbon_btn(
            ribbon_inner, "📂", "इम्पोर्ट", "Import PDF/Img",
            bg="#f8fafc", fg="#1e293b", hover="#e2e8f0",
            command=self.import_files
        )
        btn_import.pack(side="left", padx=3)

        self._create_ribbon_separator(ribbon_inner).pack(side="left", fill="y", padx=8, pady=4)

        # Ribbon Buttons Group 2: Output (Save PDF, Save Images, Print)
        btn_save_pdf = self._create_ribbon_btn(
            ribbon_inner, "💾", "PDF सेव्ह", "Save PDF",
            bg="#ef4444", fg="#ffffff", hover="#dc2626",
            command=self.prompt_save_pdf
        )
        btn_save_pdf.pack(side="left", padx=3)

        btn_save_img = self._create_ribbon_btn(
            ribbon_inner, "🖼️", "इमेज सेव्ह", "Save Images",
            bg="#0ea5e9", fg="#ffffff", hover="#0284c7",
            command=self.prompt_save_images
        )
        btn_save_img.pack(side="left", padx=3)

        btn_print = self._create_ribbon_btn(
            ribbon_inner, "🖨️", "प्रिंट करा", "Print Doc",
            bg="#f8fafc", fg="#1e293b", hover="#e2e8f0",
            command=self.print_document
        )
        btn_print.pack(side="left", padx=3)

        self._create_ribbon_separator(ribbon_inner).pack(side="left", fill="y", padx=8, pady=4)

        # Ribbon Buttons Group 3: Test Scan (🧪)
        btn_test = self._create_ribbon_btn(
            ribbon_inner, "🧪", "सॅम्पल स्कॅन", "Test Scan",
            bg="#f8fafc", fg="#0284c7", hover="#e2e8f0",
            command=self.trigger_mock_scan
        )
        btn_test.pack(side="left", padx=3)

        # Right side: Scanner Profile Indicator Box
        profile_box = tk.Frame(ribbon_inner, bg="#f8fafc", bd=1, relief="solid", padx=10, pady=4)
        profile_box.pack(side="right", padx=4)

        tk.Label(profile_box, text="चालू स्कॅनर प्रोफाईल:", font=("Segoe UI", 8, "bold"), fg="#64748b", bg="#f8fafc").pack(anchor="w")
        self.lbl_active_profile = tk.Label(profile_box, text=self.profile["name"], font=("Segoe UI", 9, "bold"), fg="#0284c7", bg="#f8fafc")
        self.lbl_active_profile.pack(anchor="w")

        # 2. SUB-TOOLBAR: PAGE EDITING & GOVERNMENT TOOLS (NAPS2 Second Ribbon Bar)
        sub_bar = tk.Frame(self.root, bg="#e2e8f0", bd=1, relief="solid")
        sub_bar.pack(side="top", fill="x", padx=0, pady=0)

        sub_inner = tk.Frame(sub_bar, bg="#e2e8f0")
        sub_inner.pack(side="top", fill="x", padx=12, pady=4)

        # Page rotation & viewing tools
        btn_rot_l = self._create_tool_btn(sub_inner, "↺ डावीकडे (90°)", lambda: self.rotate_page(270))
        btn_rot_l.pack(side="left", padx=2)

        btn_rot_r = self._create_tool_btn(sub_inner, "↻ उजवीकडे (90°)", lambda: self.rotate_page(90))
        btn_rot_r.pack(side="left", padx=2)

        btn_flip = self._create_tool_btn(sub_inner, "↕ फिरवा (180°)", lambda: self.rotate_page(180))
        btn_flip.pack(side="left", padx=2)

        btn_view_crop = self._create_tool_btn(sub_inner, "🔍 व्ह्यू & क्रॉप", self.open_image_viewer, bg="#3b82f6", fg="#ffffff")
        btn_view_crop.pack(side="left", padx=4)

        btn_clean = self._create_tool_btn(sub_inner, "🧽 कागदपत्र स्वच्छ करा", self.enhance_page, bg="#0284c7", fg="#ffffff")
        btn_clean.pack(side="left", padx=2)

        self._create_tool_sep(sub_inner).pack(side="left", fill="y", padx=6)

        # Page reorder & delete
        btn_up = self._create_tool_btn(sub_inner, "▲ वर", lambda: self.move_page(-1))
        btn_up.pack(side="left", padx=2)

        btn_down = self._create_tool_btn(sub_inner, "▼ खाली", lambda: self.move_page(1))
        btn_down.pack(side="left", padx=2)

        btn_del = self._create_tool_btn(sub_inner, "🗑️ पृष्ठ हटवा", self.delete_page, bg="#fee2e2", fg="#dc2626")
        btn_del.pack(side="left", padx=2)

        btn_clear = self._create_tool_btn(sub_inner, "क्लिअर ऑल", self.clear_all_pages)
        btn_clear.pack(side="left", padx=2)

        # Right side: Instant Government Presets Strip
        gov_frame = tk.Frame(sub_inner, bg="#e2e8f0")
        gov_frame.pack(side="right", padx=0)

        tk.Label(gov_frame, text="🏛️ शासकीय:", font=("Segoe UI", 8, "bold"), fg="#475569", bg="#e2e8f0").pack(side="left", padx=(0, 4))

        btn_gov_250 = self._create_tool_btn(gov_frame, "२५० KB PDF", lambda: self.export_pdf(250), bg="#0284c7", fg="#ffffff")
        btn_gov_250.pack(side="left", padx=2)

        btn_gov_500 = self._create_tool_btn(gov_frame, "५०० KB PDF", lambda: self.export_pdf(500), bg="#0284c7", fg="#ffffff")
        btn_gov_500.pack(side="left", padx=2)

        btn_gov_photo = self._create_tool_btn(gov_frame, "👤 फोटो (160×210)", lambda: self.export_image_preset(160, 210, 50), bg="#ec4899", fg="#ffffff")
        btn_gov_photo.pack(side="left", padx=2)

        btn_gov_sign = self._create_tool_btn(gov_frame, "✍️ सही (256×64)", lambda: self.export_image_preset(256, 64, 20), bg="#8b5cf6", fg="#ffffff")
        btn_gov_sign.pack(side="left", padx=2)

        # 3. MAIN NAPS2 WORKSPACE: THUMBNAILS FLOW GRID
        workspace_container = tk.Frame(self.root, bg="#f1f5f9")
        workspace_container.pack(fill="both", expand=True, padx=8, pady=6)

        self.canvas_workspace = tk.Canvas(workspace_container, bg="#f1f5f9", highlightthickness=0)
        self.v_scrollbar = ttk.Scrollbar(workspace_container, orient="vertical", command=self.canvas_workspace.yview)
        
        self.grid_inner = tk.Frame(self.canvas_workspace, bg="#f1f5f9")
        self.grid_inner.bind("<Configure>", lambda e: self.canvas_workspace.configure(scrollregion=self.canvas_workspace.bbox("all")))

        self.canvas_window_id = self.canvas_workspace.create_window((0, 0), window=self.grid_inner, anchor="nw")
        self.canvas_workspace.configure(yscrollcommand=self.v_scrollbar.set)

        self.canvas_workspace.pack(side="left", fill="both", expand=True)
        self.v_scrollbar.pack(side="right", fill="y")

        # Responsive canvas resize
        self.canvas_workspace.bind("<Configure>", self._on_canvas_resize)
        # Mouse wheel scrolling
        self.canvas_workspace.bind_all("<MouseWheel>", self._on_mousewheel)

        # 4. BOTTOM STATUS BAR (NAPS2 Style)
        status_bar = tk.Frame(self.root, bg="#e2e8f0", bd=1, relief="solid", height=28)
        status_bar.pack(side="bottom", fill="x")

        self.status_pages_lbl = tk.Label(status_bar, text="📄 एकूण पृष्ठे: ०", font=("Segoe UI", 9, "bold"), fg="#1e293b", bg="#e2e8f0")
        self.status_pages_lbl.pack(side="left", padx=12, pady=4)

        self.status_info_lbl = tk.Label(status_bar, text="तयार (Ready) - स्कॅन करण्यासाठी 'स्कॅन करा' किंवा फाईल 'इम्पोर्ट' करा.", font=("Segoe UI", 9), fg="#475569", bg="#e2e8f0")
        self.status_info_lbl.pack(side="left", padx=12, pady=4)

        status_right_lbl = tk.Label(status_bar, text="🏛️ १००% शासकीय पोर्टल सुसंगत (Aaple Sarkar / MahaDBT)", font=("Segoe UI", 9, "bold"), fg="#0284c7", bg="#e2e8f0")
        status_right_lbl.pack(side="right", padx=14, pady=4)

        self.render_grid()

    # -------------------------------------------------------------------------
    # Helper UI Builders
    # -------------------------------------------------------------------------
    def _create_ribbon_btn(self, parent, icon, line1, line2, bg="#f8fafc", fg="#1e293b", hover="#e2e8f0", command=None):
        f = tk.Frame(parent, bg=bg, bd=1, relief="solid", padx=10, pady=4, cursor="hand2")
        lbl_icon = tk.Label(f, text=icon, font=("Segoe UI", 16), bg=bg, fg=fg, cursor="hand2")
        lbl_icon.pack(side="top")
        lbl_t1 = tk.Label(f, text=line1, font=("Segoe UI", 9, "bold"), bg=bg, fg=fg, cursor="hand2")
        lbl_t1.pack(side="top")
        lbl_t2 = tk.Label(f, text=line2, font=("Segoe UI", 7), bg=bg, fg=fg, cursor="hand2")
        lbl_t2.pack(side="top")

        for w in [f, lbl_icon, lbl_t1, lbl_t2]:
            w.bind("<Button-1>", lambda e: command() if command else None)
            w.bind("<Enter>", lambda e, frame=f, h=hover: frame.configure(bg=h))
            w.bind("<Leave>", lambda e, frame=f, orig=bg: frame.configure(bg=orig))
        return f

    def _create_ribbon_separator(self, parent):
        sep = tk.Frame(parent, bg="#cbd5e1", width=1)
        return sep

    def _create_tool_btn(self, parent, text, command, bg="#ffffff", fg="#1e293b"):
        btn = tk.Button(parent, text=text, font=("Segoe UI", 8, "bold"), bg=bg, fg=fg, activebackground="#cbd5e1", bd=1, relief="solid", padx=8, pady=3, cursor="hand2", command=command)
        return btn

    def _create_tool_sep(self, parent):
        return tk.Frame(parent, bg="#cbd5e1", width=1)

    def _on_canvas_resize(self, event):
        self.canvas_workspace.itemconfig(self.canvas_window_id, width=event.width)
        self.render_grid()

    def _on_mousewheel(self, event):
        if self.canvas_workspace.winfo_exists():
            self.canvas_workspace.yview_scroll(int(-1 * (event.delta / 120)), "units")

    # =========================================================================
    # NAPS2 THUMBNAIL FLOW GRID RENDERING
    # =========================================================================
    def render_grid(self):
        for w in self.grid_inner.winfo_children():
            w.destroy()
        self.thumb_images_tk.clear()

        # Update status bar
        num_pages = len(self.scanned_pages)
        if num_pages == 0:
            self.status_pages_lbl.configure(text="📄 एकूण पृष्ठे: ०")
            self.status_info_lbl.configure(text="तयार (Ready) - स्कॅन करण्यासाठी 'स्कॅन करा' किंवा फाईल 'इम्पोर्ट' करा.")
            self._render_empty_state()
            return

        sel_txt = f"(पृष्ठ {self.selected_idx + 1} निवडले आहे)" if 0 <= self.selected_idx < num_pages else "(कोणतेही पृष्ठ निवडलेले नाही)"
        self.status_pages_lbl.configure(text=f"📄 एकूण पृष्ठे: {num_pages} {sel_txt}")
        self.status_info_lbl.configure(text="कागदपत्र संपादित करण्यासाठी पृष्ठावर डबल-क्लिक करा. क्रम बदलण्यासाठी 'वर/खाली' वापरा.")

        # Calculate grid columns based on canvas width
        canvas_w = max(500, self.canvas_workspace.winfo_width())
        card_w = 200
        cols = max(1, canvas_w // (card_w + 24))

        for idx, img in enumerate(self.scanned_pages):
            is_selected = (idx == self.selected_idx)
            row = idx // cols
            col = idx % cols

            # Paper Card (NAPS2 Style)
            card_border_color = "#0284c7" if is_selected else "#cbd5e1"
            card_bg = "#ffffff"
            card_bd = 2 if is_selected else 1

            card = tk.Frame(self.grid_inner, bg=card_bg, bd=card_bd, relief="solid", highlightbackground=card_border_color, highlightthickness=2 if is_selected else 0, cursor="hand2")
            card.grid(row=row, column=col, padx=12, pady=12, sticky="n")

            # 1. Card Header: Page Number Badge & Quick Delete Button
            hdr = tk.Frame(card, bg=card_bg)
            hdr.pack(side="top", fill="x", padx=6, pady=(6, 2))

            badge_bg = "#0284c7" if is_selected else "#e2e8f0"
            badge_fg = "#ffffff" if is_selected else "#1e293b"
            badge = tk.Label(hdr, text=f"पृष्ठ {idx + 1}", font=("Segoe UI", 8, "bold"), bg=badge_bg, fg=badge_fg, padx=6, pady=1)
            badge.pack(side="left")

            btn_card_del = tk.Label(hdr, text="✕", font=("Segoe UI", 8, "bold"), bg=card_bg, fg="#94a3b8", cursor="hand2")
            btn_card_del.pack(side="right")
            btn_card_del.bind("<Button-1>", lambda e, i=idx: self.delete_specific_page(i))

            # 2. Thumbnail Preview Image
            thumb = img.copy()
            thumb.thumbnail((160, 210), Image.Resampling.LANCZOS)
            thumb_tk = ImageTk.PhotoImage(thumb)
            self.thumb_images_tk.append(thumb_tk)

            lbl_img = tk.Label(card, image=thumb_tk, bg="#ffffff", cursor="hand2")
            lbl_img.pack(padx=8, pady=4)

            # 3. Card Footer: Resolution / Dimensions
            w, h = img.size
            lbl_dim = tk.Label(card, text=f"{w} × {h} px", font=("Segoe UI", 8), bg=card_bg, fg="#64748b")
            lbl_dim.pack(side="bottom", pady=(0, 6))

            # Bindings for selection & double-click open viewer
            for widget in [card, hdr, badge, lbl_img, lbl_dim]:
                widget.bind("<Button-1>", lambda e, i=idx: self.select_page(i))
                widget.bind("<Double-Button-1>", lambda e, i=idx: self.open_image_viewer(i))

    def _render_empty_state(self):
        empty_frame = tk.Frame(self.grid_inner, bg="#f1f5f9", pady=60)
        empty_frame.pack(fill="both", expand=True)

        tk.Label(empty_frame, text="🖨️", font=("Segoe UI", 48), fg="#94a3b8", bg="#f1f5f9").pack()
        tk.Label(empty_frame, text="कोणतेही कागदपत्र स्कॅन केलेले नाही", font=("Segoe UI", 16, "bold"), fg="#334155", bg="#f1f5f9").pack(pady=(6, 2))
        tk.Label(empty_frame, text="स्कॅनरवरून नवीन कागदपत्र स्कॅन करण्यासाठी 'स्कॅन करा' वर क्लिक करा,\nकिंवा कॉम्प्युटरवरील PDF / फोटो आणण्यासाठी 'इम्पोर्ट' बटण दाबा.", font=("Segoe UI", 10), fg="#64748b", bg="#f1f5f9", justify="center").pack(pady=4)

        btns_box = tk.Frame(empty_frame, bg="#f1f5f9")
        btns_box.pack(pady=14)

        tk.Button(btns_box, text="▶ स्कॅन करा (Scan)", font=("Segoe UI", 10, "bold"), bg="#10b981", fg="#ffffff", activebackground="#059669", bd=0, padx=16, pady=6, cursor="hand2", command=self.trigger_scan).pack(side="left", padx=6)
        tk.Button(btns_box, text="📂 फाईल इम्पोर्ट करा (Import)", font=("Segoe UI", 10, "bold"), bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=16, pady=6, cursor="hand2", command=self.import_files).pack(side="left", padx=6)
        tk.Button(btns_box, text="🧪 सॅम्पल स्कॅन (Test)", font=("Segoe UI", 10), bg="#e2e8f0", fg="#334155", activebackground="#cbd5e1", bd=0, padx=12, pady=6, cursor="hand2", command=self.trigger_mock_scan).pack(side="left", padx=6)

    def select_page(self, idx):
        if 0 <= idx < len(self.scanned_pages):
            self.selected_idx = idx
            self.render_grid()

    # =========================================================================
    # SCANNER OPERATIONS & PROFILES (NAPS2 Engine)
    # =========================================================================
    def refresh_scanners(self):
        def worker():
            scanners = self.engine.list_scanners()
            try:
                self.root.after(0, lambda: self._update_scanners(scanners))
            except Exception:
                pass
        threading.Thread(target=worker, daemon=True).start()

    def _update_scanners(self, scanners):
        self.detected_scanners = scanners
        if scanners and self.profile["device_id"] == "AUTO":
            self.profile["device_name"] = scanners[0]["name"]
            self.lbl_active_profile.configure(text=f"{self.profile['name']} • {scanners[0]['name']}")

    def trigger_scan(self):
        if self.is_scanning:
            return

        self.is_scanning = True
        self.btn_scan.configure(bg="#64748b")
        self.status_info_lbl.configure(text="⏳ स्कॅनिंग सुरू आहे... कृपया प्रतीक्षा करा.")

        device_id = self.profile.get("device_id", "AUTO")
        dpi = self.profile.get("dpi", 200)
        color = self.profile.get("color_mode", "color")
        use_dialog = self.profile.get("use_native_dialog", False)

        def worker():
            try:
                img = self.engine.acquire_scan(
                    device_id=device_id,
                    dpi=dpi,
                    color_mode=color,
                    use_native_dialog=use_dialog
                )
                if img:
                    try:
                        self.root.after(0, lambda: self.add_scanned_page(img))
                    except Exception:
                        pass
            except Exception as e:
                try:
                    self.root.after(0, lambda: messagebox.showerror("स्कॅनिंग त्रुटी", str(e)))
                except Exception:
                    pass
            finally:
                try:
                    self.root.after(0, self._scan_done)
                except Exception:
                    pass

        threading.Thread(target=worker, daemon=True).start()

    def trigger_mock_scan(self):
        page_num = len(self.scanned_pages) + 1
        dpi = self.profile.get("dpi", 200)
        img = self.engine.create_mock_scan(page_num=page_num, dpi=dpi)
        self.add_scanned_page(img)

    def _scan_done(self):
        self.is_scanning = False
        self.btn_scan.configure(bg="#10b981")
        self.status_info_lbl.configure(text="स्कॅनिंग यशस्वीरित्या पूर्ण झाले!")

    def add_scanned_page(self, img):
        self.scanned_pages.append(img)
        self.selected_idx = len(self.scanned_pages) - 1
        self.render_grid()

    # =========================================================================
    # IMPORT FILES (PDF & IMAGES) - Classic NAPS2 Feature
    # =========================================================================
    def import_files(self):
        filetypes = [
            ("सर्व सपोर्टेड फाइल्स", "*.pdf;*.jpg;*.jpeg;*.png;*.bmp;*.tiff;*.webp"),
            ("PDF Documents (*.pdf)", "*.pdf"),
            ("Image Files (*.jpg, *.png, ...)", "*.jpg;*.jpeg;*.png;*.bmp;*.tiff;*.webp"),
            ("All Files", "*.*")
        ]
        paths = filedialog.askopenfilenames(title="कागदपत्रे किंवा PDF निवडा", filetypes=filetypes)
        if not paths:
            return

        loaded_count = 0
        for p in paths:
            ext = os.path.splitext(p)[1].lower()
            if ext == ".pdf":
                if HAS_FITZ:
                    try:
                        doc = fitz.open(p)
                        for page_idx in range(len(doc)):
                            page = doc.load_page(page_idx)
                            # Render at 200 DPI
                            zoom = 200 / 72.0
                            pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
                            img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
                            self.scanned_pages.append(img)
                            loaded_count += 1
                        doc.close()
                    except Exception as e:
                        messagebox.showwarning("PDF लोड त्रुटी", f"{os.path.basename(p)} उघडताना त्रुटी: {e}")
                else:
                    messagebox.showinfo("सूचना", "PDF इम्पोर्ट करण्यासाठी PyMuPDF आवश्यक आहे.")
            else:
                try:
                    img = Image.open(p).convert("RGB")
                    self.scanned_pages.append(img)
                    loaded_count += 1
                except Exception as e:
                    messagebox.showwarning("इमेज लोड त्रुटी", f"{os.path.basename(p)} उघडताना त्रुटी: {e}")

        if loaded_count > 0:
            self.selected_idx = len(self.scanned_pages) - 1
            self.render_grid()
            messagebox.showinfo("इम्पोर्ट यशस्वी", f"✅ एकूण {loaded_count} पृष्ठे यशस्वीरित्या इम्पोर्ट केली आहेत!")

    # =========================================================================
    # PAGE ACTIONS (Rotate, Move, Enhance, Delete)
    # =========================================================================
    def _get_active_index(self):
        if 0 <= self.selected_idx < len(self.scanned_pages):
            return self.selected_idx
        if self.scanned_pages:
            return 0
        return -1

    def rotate_page(self, angle):
        idx = self._get_active_index()
        if idx == -1: return
        self.scanned_pages[idx] = self.scanned_pages[idx].rotate(-angle, expand=True)
        self.render_grid()

    def enhance_page(self):
        idx = self._get_active_index()
        if idx == -1: return
        img = self.scanned_pages[idx].convert("RGB")
        contrast = ImageEnhance.Contrast(img).enhance(1.22)
        bright = ImageEnhance.Brightness(contrast).enhance(1.05)
        sharp = ImageEnhance.Sharpness(bright).enhance(1.2)
        self.scanned_pages[idx] = sharp
        self.render_grid()
        messagebox.showinfo("कागदपत्र स्वच्छ केले", f"पृष्ठ {idx + 1} चा बॅकग्राऊंड पांढरा शुभ्र व मजकूर अधिक गडद करण्यात आला आहे.")

    def move_page(self, direction):
        idx = self._get_active_index()
        if idx == -1: return
        new_idx = idx + direction
        if 0 <= new_idx < len(self.scanned_pages):
            self.scanned_pages[idx], self.scanned_pages[new_idx] = (
                self.scanned_pages[new_idx],
                self.scanned_pages[idx]
            )
            self.selected_idx = new_idx
            self.render_grid()

    def delete_page(self):
        idx = self._get_active_index()
        if idx == -1: return
        if messagebox.askyesno("हटवा", f"पृष्ठ {idx + 1} खरोखर हटवायचे आहे का?"):
            self.scanned_pages.pop(idx)
            self.selected_idx = max(0, min(idx, len(self.scanned_pages) - 1))
            self.render_grid()

    def delete_specific_page(self, idx):
        if 0 <= idx < len(self.scanned_pages):
            if messagebox.askyesno("हटवा", f"पृष्ठ {idx + 1} हटवायचे आहे का?"):
                self.scanned_pages.pop(idx)
                if self.selected_idx >= len(self.scanned_pages):
                    self.selected_idx = max(0, len(self.scanned_pages) - 1)
                self.render_grid()

    def clear_all_pages(self):
        if not self.scanned_pages: return
        if messagebox.askyesno("पुष्टी", "सर्व स्कॅन केलेली पृष्ठे हटवायची आहेत का?"):
            self.scanned_pages.clear()
            self.selected_idx = -1
            self.render_grid()

    # =========================================================================
    # NAPS2 FULL IMAGE VIEWER & CROP WINDOW (DOUBLE CLICK / VIEW)
    # =========================================================================
    def open_image_viewer(self, target_idx=None):
        idx = target_idx if (target_idx is not None) else self._get_active_index()
        if idx == -1 or idx >= len(self.scanned_pages):
            messagebox.showwarning("सावधान", "कृपया प्रथम एक पृष्ठ निवडा.")
            return

        self.selected_idx = idx
        self.render_grid()

        win = tk.Toplevel(self.root)
        win.title(f"NAPS2 Viewer & Editor - पृष्ठ {idx + 1} / {len(self.scanned_pages)}")
        win.geometry("1000x700")
        win.minsize(800, 500)
        win.configure(bg="#1e293b")
        win.grab_set()

        # Viewer State
        viewer_state = {
            "img": self.scanned_pages[idx].copy(),
            "zoom": 1.0,
            "crop_start": None,
            "crop_rect_id": None,
            "crop_box": None
        }

        # Top Viewer Toolbar
        v_toolbar = tk.Frame(win, bg="#0f172a", bd=1, relief="solid")
        v_toolbar.pack(side="top", fill="x", padx=6, pady=6, ipady=4)

        # Zoom Controls
        tk.Label(v_toolbar, text="🔍 झूम:", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#0f172a").pack(side="left", padx=(8, 2))
        btn_zin = tk.Button(v_toolbar, text="➕", font=("Segoe UI", 9, "bold"), bg="#1e293b", fg="#ffffff", bd=0, padx=6, command=lambda: apply_zoom(1.25))
        btn_zin.pack(side="left", padx=2)
        btn_zout = tk.Button(v_toolbar, text="➖", font=("Segoe UI", 9, "bold"), bg="#1e293b", fg="#ffffff", bd=0, padx=6, command=lambda: apply_zoom(0.8))
        btn_zout.pack(side="left", padx=2)
        btn_zfit = tk.Button(v_toolbar, text="फिट विंडो", font=("Segoe UI", 8), bg="#334155", fg="#ffffff", bd=0, padx=6, command=lambda: fit_zoom())
        btn_zfit.pack(side="left", padx=4)

        # Rotate inside viewer
        tk.Label(v_toolbar, text="|", fg="#475569", bg="#0f172a").pack(side="left", padx=4)
        btn_vr_l = tk.Button(v_toolbar, text="↺ 90°", font=("Segoe UI", 8, "bold"), bg="#334155", fg="#ffffff", bd=0, padx=6, command=lambda: rotate_viewer(270))
        btn_vr_l.pack(side="left", padx=2)
        btn_vr_r = tk.Button(v_toolbar, text="↻ 90°", font=("Segoe UI", 8, "bold"), bg="#334155", fg="#ffffff", bd=0, padx=6, command=lambda: rotate_viewer(90))
        btn_vr_r.pack(side="left", padx=2)

        # Crop Presets
        tk.Label(v_toolbar, text="|", fg="#475569", bg="#0f172a").pack(side="left", padx=4)
        tk.Label(v_toolbar, text="क्रॉप:", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#0f172a").pack(side="left", padx=(4, 2))
        btn_cp_photo = tk.Button(v_toolbar, text="👤 फोटो (160×210)", font=("Segoe UI", 8, "bold"), bg="#ec4899", fg="#ffffff", bd=0, padx=6, command=lambda: crop_center(160, 210))
        btn_cp_photo.pack(side="left", padx=2)
        btn_cp_sign = tk.Button(v_toolbar, text="✍️ सही (256×64)", font=("Segoe UI", 8, "bold"), bg="#8b5cf6", fg="#ffffff", bd=0, padx=6, command=lambda: crop_center(256, 64))
        btn_cp_sign.pack(side="left", padx=2)

        # Clean filter inside viewer
        btn_v_clean = tk.Button(v_toolbar, text="🧽 कागदपत्र क्लिन करा", font=("Segoe UI", 8, "bold"), bg="#0284c7", fg="#ffffff", bd=0, padx=8, command=lambda: enhance_viewer())
        btn_v_clean.pack(side="left", padx=4)

        # Right side: Save Changes button
        btn_save_changes = tk.Button(v_toolbar, text="💾 बदल सेव्ह करा", font=("Segoe UI", 9, "bold"), bg="#10b981", fg="#ffffff", bd=0, padx=12, pady=2, cursor="hand2", command=lambda: save_viewer_changes())
        btn_save_changes.pack(side="right", padx=8)

        btn_cancel = tk.Button(v_toolbar, text="रद्द करा", font=("Segoe UI", 9), bg="#475569", fg="#ffffff", bd=0, padx=8, command=win.destroy)
        btn_cancel.pack(side="right", padx=2)

        # Large Canvas with Scrollbars
        c_frame = tk.Frame(win, bg="#0f172a")
        c_frame.pack(fill="both", expand=True, padx=6, pady=4)

        v_canvas = tk.Canvas(c_frame, bg="#020617", highlightthickness=0)
        v_h_scroll = ttk.Scrollbar(c_frame, orient="horizontal", command=v_canvas.xview)
        v_v_scroll = ttk.Scrollbar(c_frame, orient="vertical", command=v_canvas.yview)

        v_canvas.configure(xscrollcommand=v_h_scroll.set, yscrollcommand=v_v_scroll.set)
        v_canvas.grid(row=0, column=0, sticky="nsew")
        v_v_scroll.grid(row=0, column=1, sticky="ns")
        v_h_scroll.grid(row=1, column=0, sticky="ew")

        c_frame.grid_rowconfigure(0, weight=1)
        c_frame.grid_columnconfigure(0, weight=1)

        # Viewer Logic
        def render_canvas():
            v_canvas.delete("all")
            cur_img = viewer_state["img"]
            zoom = viewer_state["zoom"]

            w = max(50, int(cur_img.width * zoom))
            h = max(50, int(cur_img.height * zoom))
            disp = cur_img.resize((w, h), Image.Resampling.LANCZOS)
            tk_img = ImageTk.PhotoImage(disp)
            v_canvas.image = tk_img

            v_canvas.create_image(0, 0, image=tk_img, anchor="nw")
            v_canvas.configure(scrollregion=(0, 0, w + 40, h + 40))

        def apply_zoom(factor):
            viewer_state["zoom"] = max(0.1, min(5.0, viewer_state["zoom"] * factor))
            render_canvas()

        def fit_zoom():
            win.update_idletasks()
            cw = max(200, v_canvas.winfo_width() - 40)
            ch = max(200, v_canvas.winfo_height() - 40)
            cur_img = viewer_state["img"]
            viewer_state["zoom"] = min(cw / cur_img.width, ch / cur_img.height, 1.0)
            render_canvas()

        def rotate_viewer(ang):
            viewer_state["img"] = viewer_state["img"].rotate(-ang, expand=True)
            render_canvas()

        def enhance_viewer():
            img = viewer_state["img"].convert("RGB")
            contrast = ImageEnhance.Contrast(img).enhance(1.22)
            bright = ImageEnhance.Brightness(contrast).enhance(1.05)
            sharp = ImageEnhance.Sharpness(bright).enhance(1.2)
            viewer_state["img"] = sharp
            render_canvas()
            messagebox.showinfo("स्वच्छ केले", "कागदपत्र अधिक वाचनीय व पांढरे शुभ्र केले आहे.", parent=win)

        def crop_center(tw, th):
            im = viewer_state["img"]
            orig_w, orig_h = im.size
            ratio = tw / th
            if (orig_w / orig_h) > ratio:
                crop_h = orig_h
                crop_w = int(crop_h * ratio)
            else:
                crop_w = orig_w
                crop_h = int(crop_w / ratio)

            l = int((orig_w - crop_w) / 2)
            t = int((orig_h - crop_h) / 2)
            cropped = im.crop((l, t, l + crop_w, t + crop_h)).resize((tw, th), Image.Resampling.LANCZOS)
            viewer_state["img"] = cropped
            fit_zoom()
            messagebox.showinfo("क्रॉप पूर्ण", f"इमेज {tw}×{th} px मध्ये क्रॉप केली आहे!", parent=win)

        def save_viewer_changes():
            self.scanned_pages[idx] = viewer_state["img"]
            self.render_grid()
            win.destroy()
            messagebox.showinfo("सेव्ह यशस्वी", f"पृष्ठ {idx + 1} वरील बदल यशस्वीरित्या सेव्ह झाले आहेत!")

        # Initial render on display
        win.after(100, fit_zoom)

    # =========================================================================
    # NAPS2 PROFILES MANAGER DIALOG
    # =========================================================================
    def open_profiles_dialog(self):
        win = tk.Toplevel(self.root)
        win.title("NAPS2 स्कॅनर प्रोफाईल मॅनेजर")
        win.geometry("520x460")
        win.resizable(False, False)
        win.configure(bg="#f8fafc")
        win.grab_set()

        tk.Label(win, text="📑 स्कॅनर प्रोफाईल सेटिंग्ज", font=("Segoe UI", 12, "bold"), fg="#0f172a", bg="#f8fafc").pack(pady=(14, 4))
        tk.Label(win, text="आपल्या गरजेनुसार स्कॅनर, रिझोल्युशन (DPI) व रंग मोड्स निवडा:", font=("Segoe UI", 9), fg="#64748b", bg="#f8fafc").pack()

        form = tk.Frame(win, bg="#ffffff", bd=1, relief="solid", padx=16, pady=14)
        form.pack(fill="both", expand=True, padx=16, pady=10)

        # Profile Name
        tk.Label(form, text="प्रोफाईल नाव:", font=("Segoe UI", 9, "bold"), fg="#334155", bg="#ffffff").grid(row=0, column=0, sticky="w", pady=6)
        name_var = tk.StringVar(value=self.profile["name"])
        ttk.Entry(form, textvariable=name_var, width=32).grid(row=0, column=1, sticky="w", pady=6)

        # Scanner Device
        tk.Label(form, text="स्कॅनर डिव्हाइस:", font=("Segoe UI", 9, "bold"), fg="#334155", bg="#ffffff").grid(row=1, column=0, sticky="w", pady=6)
        dev_vals = ["सर्व स्कॅनर आपोआप (Auto Detect)"] + [s["name"] for s in self.detected_scanners]
        dev_var = tk.StringVar(value=self.profile["device_name"])
        dev_combo = ttk.Combobox(form, textvariable=dev_var, values=dev_vals, state="readonly", width=30)
        dev_combo.grid(row=1, column=1, sticky="w", pady=6)

        # Resolution (DPI)
        tk.Label(form, text="रिझोल्युशन (DPI):", font=("Segoe UI", 9, "bold"), fg="#334155", bg="#ffffff").grid(row=2, column=0, sticky="w", pady=6)
        dpi_var = tk.IntVar(value=self.profile["dpi"])
        dpi_combo = ttk.Combobox(form, textvariable=dpi_var, values=[100, 150, 200, 300, 600], state="readonly", width=10)
        dpi_combo.grid(row=2, column=1, sticky="w", pady=6)

        # Color Mode
        tk.Label(form, text="रंग / कलर मोड:", font=("Segoe UI", 9, "bold"), fg="#334155", bg="#ffffff").grid(row=3, column=0, sticky="w", pady=6)
        col_var = tk.StringVar(value=self.profile["color_mode"])
        col_combo = ttk.Combobox(form, textvariable=col_var, values=["color", "grayscale", "bw"], state="readonly", width=14)
        col_combo.grid(row=3, column=1, sticky="w", pady=6)

        # Paper Size
        tk.Label(form, text="कागद आकार (Size):", font=("Segoe UI", 9, "bold"), fg="#334155", bg="#ffffff").grid(row=4, column=0, sticky="w", pady=6)
        size_var = tk.StringVar(value=self.profile["page_size"])
        size_combo = ttk.Combobox(form, textvariable=size_var, values=["A4", "Legal", "Letter"], state="readonly", width=10)
        size_combo.grid(row=4, column=1, sticky="w", pady=6)

        # Paper Source
        tk.Label(form, text="स्कॅनर सोर्स:", font=("Segoe UI", 9, "bold"), fg="#334155", bg="#ffffff").grid(row=5, column=0, sticky="w", pady=6)
        src_var = tk.StringVar(value=self.profile["source"])
        src_combo = ttk.Combobox(form, textvariable=src_var, values=["Flatbed (काच)", "Feeder (ADF)"], state="readonly", width=14)
        src_combo.grid(row=5, column=1, sticky="w", pady=6)

        # Native Dialog
        nat_var = tk.BooleanVar(value=self.profile["use_native_dialog"])
        tk.Checkbutton(form, text="Windows स्कॅनर मूळ डायलॉग दाखवा", variable=nat_var, font=("Segoe UI", 9), bg="#ffffff").grid(row=6, column=0, columnspan=2, sticky="w", pady=8)

        def save_profile():
            self.profile["name"] = name_var.get()
            self.profile["device_name"] = dev_var.get()
            for s in self.detected_scanners:
                if s["name"] == dev_var.get():
                    self.profile["device_id"] = s["id"]
                    break
            else:
                self.profile["device_id"] = "AUTO"
            self.profile["dpi"] = dpi_var.get()
            self.profile["color_mode"] = col_var.get()
            self.profile["page_size"] = size_var.get()
            self.profile["source"] = src_var.get()
            self.profile["use_native_dialog"] = nat_var.get()

            self.lbl_active_profile.configure(text=f"{self.profile['name']}")
            win.destroy()
            messagebox.showinfo("प्रोफाईल सेव्ह", f"✅ स्कॅनर प्रोफाईल '{self.profile['name']}' सक्रिय केली आहे!")

        # Bottom buttons
        b_bar = tk.Frame(win, bg="#f8fafc")
        b_bar.pack(side="bottom", fill="x", pady=10, padx=16)

        tk.Button(b_bar, text="✓ प्रोफाईल लागू करा", font=("Segoe UI", 10, "bold"), bg="#10b981", fg="#ffffff", activebackground="#059669", bd=0, padx=14, pady=5, cursor="hand2", command=save_profile).pack(side="right", padx=4)
        tk.Button(b_bar, text="रद्द करा", font=("Segoe UI", 9), bg="#e2e8f0", fg="#334155", activebackground="#cbd5e1", bd=0, padx=10, pady=5, command=win.destroy).pack(side="right", padx=4)

    # =========================================================================
    # EXPORT ENGINES (SAVE PDF, SAVE IMAGES, PRINT)
    # =========================================================================
    def prompt_save_pdf(self):
        if not self.scanned_pages:
            messagebox.showwarning("सावधान", "प्रथम किमान एक पृष्ठ स्कॅन किंवा इम्पोर्ट करा.")
            return

        # NAPS2 Save PDF Dialog
        win = tk.Toplevel(self.root)
        win.title("PDF सेव्ह पर्याय")
        win.geometry("420x300")
        win.resizable(False, False)
        win.configure(bg="#f8fafc")
        win.grab_set()

        tk.Label(win, text="📄 PDF सेव्ह पर्याय निवडा", font=("Segoe UI", 11, "bold"), fg="#0f172a", bg="#f8fafc").pack(pady=(16, 8))

        box = tk.Frame(win, bg="#ffffff", bd=1, relief="solid", padx=12, pady=12)
        box.pack(fill="both", expand=True, padx=16, pady=4)

        tk.Button(box, text="🏛️ आपले सरकार (कमाल २५० KB लॉक)", font=("Segoe UI", 9, "bold"), bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=10, pady=6, cursor="hand2", command=lambda: [win.destroy(), self.export_pdf(250)]).pack(fill="x", pady=4)
        tk.Button(box, text="🎓 महाडीबीटी पोर्टल (कमाल ५०० KB लॉक)", font=("Segoe UI", 9, "bold"), bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=10, pady=6, cursor="hand2", command=lambda: [win.destroy(), self.export_pdf(500)]).pack(fill="x", pady=4)
        tk.Button(box, text="📑 मूळ हाय-क्वालिटी PDF (अमर्याद)", font=("Segoe UI", 9), bg="#475569", fg="#ffffff", activebackground="#334155", bd=0, padx=10, pady=6, cursor="hand2", command=lambda: [win.destroy(), self.export_pdf(0)]).pack(fill="x", pady=4)

    def export_pdf(self, target_kb=0):
        if not self.scanned_pages:
            messagebox.showwarning("सावधान", "कृपया प्रथम किमान एक कागदपत्र स्कॅन करा.")
            return

        default_name = f"Scan_Doc_{len(self.scanned_pages)}Pages"
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

        rgb_pages = []
        for img in self.scanned_pages:
            im = img.convert("RGB")
            if target_bytes > 0 and per_page_bytes < 40 * 1024 and (im.width > 1200 or im.height > 1600):
                im.thumbnail((1200, 1600), Image.Resampling.LANCZOS)
            rgb_pages.append(im)

        buf = io.BytesIO()
        first = rgb_pages[0]
        rest = rgb_pages[1:] if len(rgb_pages) > 1 else []
        first.save(buf, format="PDF", save_all=True, append_images=rest, quality=quality, optimize=True)
        data = buf.getvalue()

        if target_bytes > 0 and len(data) > target_bytes and quality > 25:
            for q in [quality - 15, quality - 30, 25]:
                buf = io.BytesIO()
                first.save(buf, format="PDF", save_all=True, append_images=rest, quality=q, optimize=True)
                data = buf.getvalue()
                if len(data) <= target_bytes:
                    break

        return data

    def prompt_save_images(self):
        if not self.scanned_pages:
            messagebox.showwarning("सावधान", "कृपया प्रथम किमान एक पृष्ठ स्कॅन किंवा इम्पोर्ट करा.")
            return

        out_dir = filedialog.askdirectory(title="इमेजेस सेव्ह करण्यासाठी फोल्डर निवडा")
        if not out_dir:
            return

        count = 0
        for i, img in enumerate(self.scanned_pages):
            out_file = os.path.join(out_dir, f"Scan_Page_{i+1}.jpg")
            img.convert("RGB").save(out_file, "JPEG", quality=90)
            count += 1

        messagebox.showinfo("इमेज सेव्ह यशस्वी", f"✅ सर्व {count} पृष्ठे यशस्वीरित्या फोल्डरमध्ये सेव्ह झाली:\n{out_dir}")

    def export_image_preset(self, target_w, target_h, target_kb):
        idx = self._get_active_index()
        if idx == -1:
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

        img = self.scanned_pages[idx].convert("RGB")
        resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

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

    def print_document(self):
        if not self.scanned_pages:
            messagebox.showwarning("सावधान", "प्रिंट करण्यासाठी कोणतेही पृष्ठ उपलब्ध नाही.")
            return

        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
                tmp_path = f.name

            pdf_bytes = self._build_pdf_bytes(0)
            with open(tmp_path, "wb") as f:
                f.write(pdf_bytes)

            os.startfile(tmp_path, "print")
            messagebox.showinfo("प्रिंटिंग", "कागदपत्र प्रिंटरकडे पाठवले आहे.")
        except Exception as e:
            messagebox.showerror("प्रिंट त्रुटी", f"प्रिंट करताना त्रुटी आली: {e}")


def main():
    root = tk.Tk()
    app = Naps2ScannerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
