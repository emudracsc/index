"""
PDF मजकूर संपादक - डेस्कटॉप अ‍ॅप्लिकेशन (Desktop GUI)
===================================================
मराठी व इंग्रजी PDF मधील मजकूर शोधून बदलण्यासाठी आधुनिक व सोपे ग्राफिकल यूजर इंटरफेस (GUI).
"""

import os
import sys
import json
import csv
import time
import threading
import subprocess
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# Import engine
try:
    from pdf_text_replacer import (
        replace_text_in_pdf,
        scan_pdf,
        parse_page_range,
        load_replacement_map,
        get_default_font_path,
        pymupdf
    )
except ImportError:
    import pymupdf
    from pdf_text_replacer import (
        replace_text_in_pdf,
        scan_pdf,
        parse_page_range,
        load_replacement_map,
        get_default_font_path
    )


class PDFReplacerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("📄 PDF मजकूर संपादक (Find & Replace) - मराठी व इंग्रजी")
        self.geometry("960, 780")
        self.minsize(860, 680)

        # Apply Modern Color Theme
        self.colors = {
            "primary": "#1E40AF",       # Deep Blue
            "primary_hover": "#1D4ED8",
            "accent": "#0D9488",        # Teal
            "accent_hover": "#0F766E",
            "bg": "#F8FAFC",            # Light slate background
            "card_bg": "#FFFFFF",       # Pure white
            "text": "#0F172A",          # Dark Slate
            "text_muted": "#64748B",
            "border": "#CBD5E1",
            "success": "#16A34A",
            "danger": "#DC2626",
            "highlight": "#EFF6FF"
        }

        self.configure(bg=self.colors["bg"])
        self.replacement_rules = []  # list of tuples: (find_text, replace_text)
        self.last_output_pdf = None
        self.is_processing = False

        self._setup_styles()
        self._build_ui()

    def _setup_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")

        # Global Fonts
        self.font_title = ("Nirmala UI", 14, "bold")
        self.font_subtitle = ("Nirmala UI", 10)
        self.font_heading = ("Nirmala UI", 11, "bold")
        self.font_body = ("Nirmala UI", 10)
        self.font_btn = ("Nirmala UI", 10, "bold")
        self.font_mono = ("Consolas", 10)

        # Style configurations
        style.configure("Card.TFrame", background=self.colors["card_bg"], relief="flat")
        style.configure("Header.TFrame", background=self.colors["primary"])
        
        # Primary Button
        style.configure(
            "Primary.TButton",
            font=self.font_btn,
            background=self.colors["primary"],
            foreground="#FFFFFF",
            padding=(12, 6),
            borderwidth=0
        )
        style.map("Primary.TButton", background=[("active", self.colors["primary_hover"])])

        # Accent Button
        style.configure(
            "Accent.TButton",
            font=self.font_btn,
            background=self.colors["accent"],
            foreground="#FFFFFF",
            padding=(12, 6),
            borderwidth=0
        )
        style.map("Accent.TButton", background=[("active", self.colors["accent_hover"])])

        # Treeview styling
        style.configure(
            "Custom.Treeview",
            font=self.font_body,
            rowheight=26,
            background="#FFFFFF",
            fieldbackground="#FFFFFF",
            foreground=self.colors["text"]
        )
        style.configure(
            "Custom.Treeview.Heading",
            font=self.font_heading,
            background="#E2E8F0",
            foreground=self.colors["text"],
            padding=4
        )
        style.map("Custom.Treeview", background=[("selected", self.colors["highlight"])], foreground=[("selected", self.colors["primary"])])

    def _build_ui(self):
        # 1. Top Header Banner
        header = tk.Frame(self, bg=self.colors["primary"], height=70)
        header.pack(fill="x", side="top")

        lbl_header_title = tk.Label(
            header,
            text="📖 PDF मजकूर संपादक (Marathi & English Text Replacer)",
            font=self.font_title,
            bg=self.colors["primary"],
            fg="#FFFFFF"
        )
        lbl_header_title.pack(anchor="w", padx=20, pady=(10, 2))

        lbl_header_sub = tk.Label(
            header,
            text="मोठ्या ५,०००+ पानांच्या PDF फाईल्समधील नाव, पत्ता, तारीख, अधिकारी इ. एका क्लिकवर अचूक बदला",
            font=self.font_subtitle,
            bg=self.colors["primary"],
            fg="#E2E8F0"
        )
        lbl_header_sub.pack(anchor="w", padx=20, pady=(0, 10))

        # Main Scrollable / Contained Canvas
        main_container = tk.Frame(self, bg=self.colors["bg"])
        main_container.pack(fill="both", expand=True, padx=20, pady=15)

        # -----------------------------
        # Section 1: PDF Selection Card
        # -----------------------------
        card_pdf = tk.LabelFrame(
            main_container,
            text=" १. PDF फाईल निवडा (Select PDF) ",
            font=self.font_heading,
            bg=self.colors["card_bg"],
            fg=self.colors["primary"],
            padx=15,
            pady=10,
            relief="solid",
            bd=1
        )
        card_pdf.pack(fill="x", pady=(0, 10))

        row1 = tk.Frame(card_pdf, bg=self.colors["card_bg"])
        row1.pack(fill="x", pady=2)

        self.var_pdf_path = tk.StringVar()
        self.entry_pdf = tk.Entry(
            row1,
            textvariable=self.var_pdf_path,
            font=self.font_body,
            bg="#F8FAFC",
            relief="solid",
            bd=1
        )
        self.entry_pdf.pack(side="left", fill="x", expand=True, padx=(0, 10), ipady=3)

        btn_browse_pdf = ttk.Button(
            row1,
            text="📂 PDF निवडा (Browse)",
            style="Primary.TButton",
            command=self._on_browse_pdf
        )
        btn_browse_pdf.pack(side="right")

        self.lbl_pdf_info = tk.Label(
            card_pdf,
            text="कृपया तुमची PDF फाईल निवडा.",
            font=self.font_subtitle,
            bg=self.colors["card_bg"],
            fg=self.colors["text_muted"]
        )
        self.lbl_pdf_info.pack(anchor="w", pady=(4, 0))

        # ------------------------------------
        # Section 2: Find & Replace Rules Card
        # ------------------------------------
        card_rules = tk.LabelFrame(
            main_container,
            text=" २. बदलण्याचे शब्द टाका (Find & Replace Rules) ",
            font=self.font_heading,
            bg=self.colors["card_bg"],
            fg=self.colors["primary"],
            padx=15,
            pady=10,
            relief="solid",
            bd=1
        )
        card_rules.pack(fill="both", expand=True, pady=(0, 10))

        # ------------------------------------
        # Dedicated Officer & Designation Section
        # ------------------------------------
        officer_box = tk.LabelFrame(
            card_rules,
            text=" 🏛️ अधिकारी पद व नाव बदल (Officer Designation & Name Switcher) ",
            font=self.font_heading,
            bg="#EFF6FF",
            fg="#1E40AF",
            padx=10,
            pady=8,
            relief="solid",
            bd=1
        )
        officer_box.pack(fill="x", pady=(0, 10))

        officer_row1 = tk.Frame(officer_box, bg="#EFF6FF")
        officer_row1.pack(fill="x", pady=2)

        posts_list = [
            "मतदार नोंदणी अधिकारी",
            "सहाय्यक मतदार नोंदणी अधिकारी",
            "उपविभागीय अधिकारी",
            "उपविभागीय दंडाधिकारी",
            "प्रांत अधिकारी",
            "तहसीलदार",
            "नायब तहसीलदार",
            "जिल्हाधिकारी",
            "अपर जिल्हाधिकारी",
            "मुख्याधिकारी",
            "प्रशासक",
            "गट विकास अधिकारी",
            "तलाठी",
            "मतदान केंद्रस्तरीय अधिकारी (BLO)"
        ]

        lbl_op = tk.Label(officer_row1, text="जुने पद:", font=self.font_body, bg="#EFF6FF")
        lbl_op.pack(side="left", padx=(0, 2))
        self.var_old_post = tk.StringVar(value="उपविभागीय अधिकारी")
        cb_old_post = ttk.Combobox(officer_row1, textvariable=self.var_old_post, values=posts_list, width=22)
        cb_old_post.pack(side="left", padx=(0, 10))

        lbl_np = tk.Label(officer_row1, text="नवीन पद:", font=self.font_body, bg="#EFF6FF")
        lbl_np.pack(side="left", padx=(0, 2))
        self.var_new_post = tk.StringVar(value="तहसीलदार")
        cb_new_post = ttk.Combobox(officer_row1, textvariable=self.var_new_post, values=posts_list, width=22)
        cb_new_post.pack(side="left", padx=(0, 10))

        btn_apply_post = tk.Button(
            officer_row1,
            text="⚡ हे पद बदला",
            font=self.font_btn,
            bg=self.colors["accent"],
            fg="#FFFFFF",
            relief="flat",
            padx=8,
            pady=1,
            cursor="hand2",
            command=self._on_apply_officer_post
        )
        btn_apply_post.pack(side="left")

        officer_row2 = tk.Frame(officer_box, bg="#EFF6FF")
        officer_row2.pack(fill="x", pady=(4, 2))

        lbl_on = tk.Label(officer_row2, text="जुने नाव:", font=self.font_subtitle, bg="#EFF6FF")
        lbl_on.pack(side="left", padx=(0, 2))
        self.var_old_officer = tk.StringVar()
        entry_old_officer = tk.Entry(officer_row2, textvariable=self.var_old_officer, font=self.font_subtitle, width=22, relief="solid", bd=1)
        entry_old_officer.pack(side="left", padx=(0, 10), ipady=1)

        lbl_nn = tk.Label(officer_row2, text="नवीन नाव:", font=self.font_subtitle, bg="#EFF6FF")
        lbl_nn.pack(side="left", padx=(0, 2))
        self.var_new_officer = tk.StringVar()
        entry_new_officer = tk.Entry(officer_row2, textvariable=self.var_new_officer, font=self.font_subtitle, width=22, relief="solid", bd=1)
        entry_new_officer.pack(side="left", padx=(0, 10), ipady=1)

        btn_apply_name = tk.Button(
            officer_row2,
            text="👤 अधिकारी नाव बदला",
            font=self.font_subtitle,
            bg="#3B82F6",
            fg="#FFFFFF",
            relief="flat",
            padx=8,
            pady=1,
            cursor="hand2",
            command=self._on_apply_officer_name
        )
        btn_apply_name.pack(side="left")

        # Add single rule row
        rule_input_frame = tk.Frame(card_rules, bg=self.colors["card_bg"])
        rule_input_frame.pack(fill="x", pady=(4, 8))

        lbl_find = tk.Label(rule_input_frame, text="इतर जुना शब्द (Find):", font=self.font_body, bg=self.colors["card_bg"])
        lbl_find.pack(side="left", padx=(0, 5))

        self.var_find = tk.StringVar()
        self.entry_find = tk.Entry(rule_input_frame, textvariable=self.var_find, font=self.font_body, width=20, relief="solid", bd=1)
        self.entry_find.pack(side="left", padx=(0, 10), ipady=2)
        self.entry_find.bind("<Return>", lambda e: self.entry_replace.focus())

        lbl_replace = tk.Label(rule_input_frame, text="नवीन शब्द (Replace):", font=self.font_body, bg=self.colors["card_bg"])
        lbl_replace.pack(side="left", padx=(0, 5))

        self.var_replace = tk.StringVar()
        self.entry_replace = tk.Entry(rule_input_frame, textvariable=self.var_replace, font=self.font_body, width=20, relief="solid", bd=1)
        self.entry_replace.pack(side="left", padx=(0, 10), ipady=2)
        self.entry_replace.bind("<Return>", lambda e: self._on_add_rule())

        btn_add_rule = tk.Button(
            rule_input_frame,
            text="➕ नियम जोडा",
            font=self.font_btn,
            bg=self.colors["primary"],
            fg="#FFFFFF",
            activebackground=self.colors["primary_hover"],
            activeforeground="#FFFFFF",
            relief="flat",
            padx=10,
            pady=2,
            cursor="hand2",
            command=self._on_add_rule
        )
        btn_add_rule.pack(side="left")

        # Table for Rules with Scrollbar
        table_frame = tk.Frame(card_rules, bg=self.colors["card_bg"])
        table_frame.pack(fill="both", expand=True, pady=4)

        columns = ("sr", "find", "replace")
        self.tree_rules = ttk.Treeview(
            table_frame,
            columns=columns,
            show="headings",
            style="Custom.Treeview",
            selectmode="browse",
            height=5
        )
        self.tree_rules.heading("sr", text="अ.क्र.")
        self.tree_rules.heading("find", text="🔍 जुना शब्द (Find)")
        self.tree_rules.heading("replace", text="✍️ नवीन शब्द (Replace)")

        self.tree_rules.column("sr", width=50, anchor="center")
        self.tree_rules.column("find", width=350, anchor="w")
        self.tree_rules.column("replace", width=350, anchor="w")

        scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree_rules.yview)
        self.tree_rules.configure(yscrollcommand=scrollbar.set)

        self.tree_rules.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # Rule Action Buttons Toolbar
        btn_toolbar = tk.Frame(card_rules, bg=self.colors["card_bg"])
        btn_toolbar.pack(fill="x", pady=(8, 0))

        btn_del_sel = tk.Button(
            btn_toolbar,
            text="🗑️ निवडलेला काढा (Delete)",
            font=self.font_subtitle,
            bg="#FEE2E2",
            fg=self.colors["danger"],
            relief="flat",
            padx=8,
            pady=2,
            cursor="hand2",
            command=self._on_delete_selected_rule
        )
        btn_del_sel.pack(side="left", padx=(0, 6))

        btn_clear_all = tk.Button(
            btn_toolbar,
            text="🧹 सर्व साफ करा (Clear All)",
            font=self.font_subtitle,
            bg="#F1F5F9",
            fg=self.colors["text_muted"],
            relief="flat",
            padx=8,
            pady=2,
            cursor="hand2",
            command=self._on_clear_all_rules
        )
        btn_clear_all.pack(side="left", padx=(0, 15))

        btn_import = tk.Button(
            btn_toolbar,
            text="📂 JSON / CSV लोड करा (Import)",
            font=self.font_subtitle,
            bg="#E0F2FE",
            fg="#0369A1",
            relief="flat",
            padx=8,
            pady=2,
            cursor="hand2",
            command=self._on_import_rules
        )
        btn_import.pack(side="left", padx=(0, 6))

        btn_export = tk.Button(
            btn_toolbar,
            text="💾 नियम सेव्ह करा (Export)",
            font=self.font_subtitle,
            bg="#DCFCE7",
            fg="#15803D",
            relief="flat",
            padx=8,
            pady=2,
            cursor="hand2",
            command=self._on_export_rules
        )
        btn_export.pack(side="left")

        # -----------------------------
        # Section 3: Options & Execution
        # -----------------------------
        card_options = tk.LabelFrame(
            main_container,
            text=" ३. प्रक्रिया पर्याय व एक्झिक्युशन (Options & Actions) ",
            font=self.font_heading,
            bg=self.colors["card_bg"],
            fg=self.colors["primary"],
            padx=15,
            pady=10,
            relief="solid",
            bd=1
        )
        card_options.pack(fill="x", pady=(0, 10))

        opt_row = tk.Frame(card_options, bg=self.colors["card_bg"])
        opt_row.pack(fill="x", pady=2)

        lbl_pages = tk.Label(opt_row, text="पानांची श्रेणी (Pages):", font=self.font_body, bg=self.colors["card_bg"])
        lbl_pages.pack(side="left", padx=(0, 5))

        self.var_pages = tk.StringVar(value="all")
        entry_pages = tk.Entry(opt_row, textvariable=self.var_pages, font=self.font_body, width=15, relief="solid", bd=1)
        entry_pages.pack(side="left", padx=(0, 10), ipady=2)

        lbl_pages_hint = tk.Label(opt_row, text="(उदा. 'all', '1-10', '1,3,5')", font=self.font_subtitle, fg=self.colors["text_muted"], bg=self.colors["card_bg"])
        lbl_pages_hint.pack(side="left", padx=(0, 25))

        # Main Action Buttons
        self.btn_scan = tk.Button(
            opt_row,
            text="🔍 फक्त स्कॅन करा (Scan / Count)",
            font=self.font_btn,
            bg="#FEF3C7",
            fg="#B45309",
            activebackground="#FDE68A",
            relief="flat",
            padx=14,
            pady=4,
            cursor="hand2",
            command=self._on_start_scan
        )
        self.btn_scan.pack(side="left", padx=(0, 10))

        self.btn_replace = tk.Button(
            opt_row,
            text="⚡ मजकूर बदला (Replace & Save)",
            font=self.font_btn,
            bg=self.colors["accent"],
            fg="#FFFFFF",
            activebackground=self.colors["accent_hover"],
            activeforeground="#FFFFFF",
            relief="flat",
            padx=16,
            pady=4,
            cursor="hand2",
            command=self._on_start_replace
        )
        self.btn_replace.pack(side="left")

        # Progress bar
        self.var_progress = tk.DoubleVar(value=0.0)
        self.progress_bar = ttk.Progressbar(
            card_options,
            variable=self.var_progress,
            maximum=100.0,
            mode="determinate"
        )
        self.progress_bar.pack(fill="x", pady=(10, 4))

        self.lbl_status = tk.Label(
            card_options,
            text="तयार (Ready)",
            font=self.font_subtitle,
            bg=self.colors["card_bg"],
            fg=self.colors["text_muted"]
        )
        self.lbl_status.pack(anchor="w")

        # -----------------------------
        # Section 4: Log Output & Open PDF
        # -----------------------------
        card_log = tk.LabelFrame(
            main_container,
            text=" ४. निकाल व लॉग (Results & Log) ",
            font=self.font_heading,
            bg=self.colors["card_bg"],
            fg=self.colors["primary"],
            padx=15,
            pady=8,
            relief="solid",
            bd=1
        )
        card_log.pack(fill="both", expand=True)

        self.txt_log = tk.Text(
            card_log,
            height=6,
            font=self.font_mono,
            bg="#0F172A",
            fg="#38BDF8",
            insertbackground="#FFFFFF",
            relief="flat",
            padx=8,
            pady=8
        )
        self.txt_log.pack(fill="both", expand=True)

        log_toolbar = tk.Frame(card_log, bg=self.colors["card_bg"])
        log_toolbar.pack(fill="x", pady=(6, 0))

        self.btn_open_pdf = tk.Button(
            log_toolbar,
            text="📄 तयार झालेली PDF उघडा (Open PDF)",
            font=self.font_btn,
            bg="#DCFCE7",
            fg="#15803D",
            state="disabled",
            relief="flat",
            padx=10,
            pady=2,
            cursor="hand2",
            command=self._on_open_output_pdf
        )
        self.btn_open_pdf.pack(side="left", padx=(0, 10))

        self.btn_open_folder = tk.Button(
            log_toolbar,
            text="📁 फोल्डर उघडा (Open Folder)",
            font=self.font_btn,
            bg="#E0F2FE",
            fg="#0369A1",
            state="disabled",
            relief="flat",
            padx=10,
            pady=2,
            cursor="hand2",
            command=self._on_open_output_folder
        )
        self.btn_open_folder.pack(side="left")

        # Initial Welcome Log
        self._log("प्रोग्रॅम सुरू झाला आहे. कृपया PDF फाईल निवडून बदलण्याचे शब्द टाका.")

    # -----------------------------
    # Event Handlers & Helpers
    # -----------------------------
    def _log(self, msg: str):
        timestamp = time.strftime("%H:%M:%S")
        self.txt_log.insert(tk.END, f"[{timestamp}] {msg}\n")
        self.txt_log.see(tk.END)

    def _on_browse_pdf(self):
        file_path = filedialog.askopenfilename(
            title="PDF फाईल निवडा",
            filetypes=[("PDF Files", "*.pdf"), ("All Files", "*.*")]
        )
        if file_path:
            self.var_pdf_path.set(file_path)
            try:
                doc = pymupdf.open(file_path)
                total_pages = len(doc)
                doc.close()
                file_sz_mb = os.path.getsize(file_path) / (1024 * 1024)
                self.lbl_pdf_info.config(
                    text=f"✅ निवडलेली PDF: {os.path.basename(file_path)} | एकूण पाने: {total_pages} | साईझ: {file_sz_mb:.2f} MB",
                    fg=self.colors["success"]
                )
                self._log(f"PDF फाईल लोड झाली: {os.path.basename(file_path)} ({total_pages} पाने)")
            except Exception as e:
                self.lbl_pdf_info.config(text=f"❌ फाईल उघडण्यात त्रुटी: {e}", fg=self.colors["danger"])
                self._log(f"त्रुटी: PDF फाईल वाचता आली नाही - {e}")

    def _on_apply_officer_post(self):
        old_p = self.var_old_post.get().strip()
        new_p = self.var_new_post.get().strip()
        if not old_p or not new_p:
            messagebox.showwarning("सावधान", "कृपया जुने व नवीन पद दोन्ही निवडा.")
            return

        for idx, (f, _) in enumerate(self.replacement_rules):
            if f == old_p:
                self.replacement_rules[idx] = (old_p, new_p)
                self._refresh_rules_tree()
                self._log(f"पदनाम नियम अपडेट केला: '{old_p}' ➔ '{new_p}'")
                messagebox.showinfo("यशस्वी", f"पदनाम बदलण्याचा नियम जोडला गेला:\n'{old_p}' ➔ '{new_p}'")
                return

        self.replacement_rules.append((old_p, new_p))
        self._refresh_rules_tree()
        self._log(f"पदनाम नियम जोडला: '{old_p}' ➔ '{new_p}'")
        messagebox.showinfo("यशस्वी", f"पदनाम बदलण्याचा नियम जोडला गेला:\n'{old_p}' ➔ '{new_p}'")

    def _on_apply_officer_name(self):
        old_n = self.var_old_officer.get().strip()
        new_n = self.var_new_officer.get().strip()
        if not old_n or not new_n:
            messagebox.showwarning("सावधान", "कृपया जुने नाव व नवीन नाव दोन्ही भरा.")
            return

        for idx, (f, _) in enumerate(self.replacement_rules):
            if f == old_n:
                self.replacement_rules[idx] = (old_n, new_n)
                self._refresh_rules_tree()
                self._log(f"अधिकारी नाव नियम अपडेट केला: '{old_n}' ➔ '{new_n}'")
                messagebox.showinfo("यशस्वी", f"अधिकारी नाव बदलण्याचा नियम जोडला गेला:\n'{old_n}' ➔ '{new_n}'")
                return

        self.replacement_rules.append((old_n, new_n))
        self._refresh_rules_tree()
        self._log(f"अधिकारी नाव नियम जोडला: '{old_n}' ➔ '{new_n}'")
        messagebox.showinfo("यशस्वी", f"अधिकारी नाव बदलण्याचा नियम जोडला गेला:\n'{old_n}' ➔ '{new_n}'")

    def _on_add_rule(self):
        find_val = self.var_find.get().strip()
        replace_val = self.var_replace.get().strip()

        if not find_val:
            messagebox.showwarning("सावधान", "कृपया 'जुना शब्द (Find)' भरा.")
            self.entry_find.focus()
            return

        # Check for duplicates
        for idx, (f, _) in enumerate(self.replacement_rules):
            if f == find_val:
                self.replacement_rules[idx] = (find_val, replace_val)
                self._refresh_rules_tree()
                self._log(f"नियम अपडेट केला: '{find_val}' ➔ '{replace_val}'")
                self.var_find.set("")
                self.var_replace.set("")
                self.entry_find.focus()
                return

        self.replacement_rules.append((find_val, replace_val))
        self._refresh_rules_tree()
        self._log(f"नवीन नियम जोडला: '{find_val}' ➔ '{replace_val}'")
        self.var_find.set("")
        self.var_replace.set("")
        self.entry_find.focus()

    def _refresh_rules_tree(self):
        for item in self.tree_rules.get_children():
            self.tree_rules.delete(item)
        for idx, (f, r) in enumerate(self.replacement_rules, start=1):
            self.tree_rules.insert("", tk.END, values=(idx, f, r))

    def _on_delete_selected_rule(self):
        selected = self.tree_rules.selection()
        if not selected:
            messagebox.showinfo("माहिती", "कृपया काढण्यासाठी टेबलमधील नियम निवडा.")
            return
        item_vals = self.tree_rules.item(selected[0], "values")
        sr_idx = int(item_vals[0]) - 1
        removed = self.replacement_rules.pop(sr_idx)
        self._refresh_rules_tree()
        self._log(f"नियम काढला: '{removed[0]}'")

    def _on_clear_all_rules(self):
        if not self.replacement_rules:
            return
        if messagebox.askyesno("पुष्टीकरण", "तुम्हाला सर्व नियम काढून टाकायचे आहेत का?"):
            self.replacement_rules.clear()
            self._refresh_rules_tree()
            self._log("सर्व नियम साफ केले.")

    def _on_import_rules(self):
        file_path = filedialog.askopenfilename(
            title="नियम फाईल लोड करा",
            filetypes=[("JSON/CSV Files", "*.json;*.csv;*.txt"), ("JSON Files", "*.json"), ("CSV Files", "*.csv"), ("All Files", "*.*")]
        )
        if file_path:
            try:
                new_map = load_replacement_map(file_path)
                count = 0
                for k, v in new_map.items():
                    if k:
                        # Avoid duplicates
                        existing = [idx for idx, (f, _) in enumerate(self.replacement_rules) if f == k]
                        if existing:
                            self.replacement_rules[existing[0]] = (k, v)
                        else:
                            self.replacement_rules.append((k, v))
                        count += 1
                self._refresh_rules_tree()
                self._log(f"यशस्वी: {count} नियम {os.path.basename(file_path)} मधून लोड झाले.")
                messagebox.showinfo("यशस्वी", f"{count} नियम यशस्वीरीत्या लोड झाले!")
            except Exception as e:
                self._log(f"त्रुटी: फाईल लोड करता आली नाही - {e}")
                messagebox.showerror("त्रुटी", f"मॅपिंग फाईल लोड करताना त्रुटी:\n{e}")

    def _on_export_rules(self):
        if not self.replacement_rules:
            messagebox.showinfo("माहिती", "सेव्ह करण्यासाठी कोणतेही नियम नाहीत.")
            return
        file_path = filedialog.asksaveasfilename(
            title="नियम सेव्ह करा",
            defaultextension=".json",
            filetypes=[("JSON File", "*.json"), ("CSV File", "*.csv")]
        )
        if file_path:
            try:
                ext = os.path.splitext(file_path)[1].lower()
                if ext == ".csv":
                    with open(file_path, "w", encoding="utf-8", newline="") as f:
                        writer = csv.writer(f)
                        for f_val, r_val in self.replacement_rules:
                            writer.writerow([f_val, r_val])
                else:
                    data = {f_val: r_val for f_val, r_val in self.replacement_rules}
                    with open(file_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                self._log(f"नियम सेव्ह झाले: {file_path}")
                messagebox.showinfo("यशस्वी", "नियम फाईल यशस्वीरीत्या सेव्ह झाली!")
            except Exception as e:
                self._log(f"त्रुटी: नियम सेव्ह झाले नाहीत - {e}")
                messagebox.showerror("त्रुटी", f"नियम सेव्ह करताना त्रुटी:\n{e}")

    def _get_active_replacement_map(self) -> dict:
        # Also include any text currently typed in the entry boxes
        active_map = {f: r for f, r in self.replacement_rules}
        typed_f = self.var_find.get().strip()
        typed_r = self.var_replace.get().strip()
        if typed_f and typed_f not in active_map:
            active_map[typed_f] = typed_r
        return active_map

    def _set_ui_state(self, processing: bool):
        self.is_processing = processing
        state = "disabled" if processing else "normal"
        self.btn_scan.config(state=state)
        self.btn_replace.config(state=state)

    def _on_start_scan(self):
        if self.is_processing:
            return
        pdf_path = self.var_pdf_path.get().strip()
        if not pdf_path or not os.path.exists(pdf_path):
            messagebox.showerror("त्रुटी", "कृपया आधी योग्य PDF फाईल निवडा.")
            return

        active_map = self._get_active_replacement_map()
        if not active_map:
            messagebox.showwarning("सावधान", "कृपया शोधण्यासाठी किमान एक शब्द टाका.")
            return

        page_range = self.var_pages.get().strip()
        self._set_ui_state(True)
        self.var_progress.set(0.0)
        self.lbl_status.config(text="स्कॅन चालू आहे...", fg=self.colors["primary"])
        self._log(f"🔍 स्कॅन सुरू केले: {len(active_map)} शब्दांसाठी...")

        def worker():
            try:
                def progress(current, total, msg):
                    pct = (current / total) * 100.0 if total > 0 else 0
                    self.after(0, lambda: self._update_progress(pct, msg))

                stats = scan_pdf(pdf_path, active_map, page_range, progress_callback=progress)
                self.after(0, lambda: self._on_scan_finished(stats))
            except Exception as e:
                self.after(0, lambda: self._on_error("स्कॅन करताना त्रुटी आली", e))

        threading.Thread(target=worker, daemon=True).start()

    def _on_scan_finished(self, stats: dict):
        self._set_ui_state(False)
        self.var_progress.set(100.0)
        self.lbl_status.config(text=f"✅ स्कॅन पूर्ण! एकूण सापडलेले शब्द: {stats['total_matches']}", fg=self.colors["success"])

        self._log("=" * 45)
        self._log(f"📊 स्कॅन निकाल:")
        self._log(f"   एकूण पाने: {stats['total_doc_pages']} | स्कॅन केलेली: {stats['scanned_pages_count']}")
        self._log(f"   एकूण सापडलेले जुने शब्द: {stats['total_matches']}")
        for word, count in stats["keyword_counts"].items():
            self._log(f"   • '{word}': {count} वेळा सापडला")
        self._log("=" * 45)

        messagebox.showinfo(
            "स्कॅन पूर्ण",
            f"स्कॅन पूर्ण झाले!\n\n"
            f"एकूण पाने: {stats['scanned_pages_count']}\n"
            f"एकूण मॅचेस: {stats['total_matches']}\n\n"
            f"सविस्तर माहिती खालील लॉग बॉक्समध्ये पहा."
        )

    def _on_start_replace(self):
        if self.is_processing:
            return
        pdf_path = self.var_pdf_path.get().strip()
        if not pdf_path or not os.path.exists(pdf_path):
            messagebox.showerror("त्रुटी", "कृपया आधी योग्य PDF फाईल निवडा.")
            return

        active_map = self._get_active_replacement_map()
        if not active_map:
            messagebox.showwarning("सावधान", "कृपया बदलण्यासाठी किमान एक शब्द जोडा.")
            return

        base, ext = os.path.splitext(pdf_path)
        default_out = f"{base}_बदललेली{ext}"

        out_path = filedialog.asksaveasfilename(
            title="नवीन PDF कुठे सेव्ह करायची ते निवडा",
            initialfile=os.path.basename(default_out),
            initialdir=os.path.dirname(pdf_path),
            defaultextension=".pdf",
            filetypes=[("PDF File", "*.pdf")]
        )
        if not out_path:
            return

        page_range = self.var_pages.get().strip()
        self._set_ui_state(True)
        self.var_progress.set(0.0)
        self.lbl_status.config(text="मजकूर बदलण्याची प्रक्रिया चालू आहे...", fg=self.colors["primary"])
        self._log(f"⚡ रिप्लेसमेंट प्रक्रिया सुरू झाली... आउटपुट: {os.path.basename(out_path)}")

        def worker():
            try:
                def progress(current, total, msg):
                    pct = (current / total) * 100.0 if total > 0 else 0
                    self.after(0, lambda: self._update_progress(pct, msg))

                stats = replace_text_in_pdf(
                    input_pdf=pdf_path,
                    output_pdf=out_path,
                    replacement_map=active_map,
                    page_range=page_range,
                    progress_callback=progress
                )
                self.after(0, lambda: self._on_replace_finished(stats))
            except Exception as e:
                self.after(0, lambda: self._on_error("मजकूर बदलताना त्रुटी आली", e))

        threading.Thread(target=worker, daemon=True).start()

    def _update_progress(self, pct: float, msg: str):
        self.var_progress.set(pct)
        self.lbl_status.config(text=msg)

    def _on_replace_finished(self, stats: dict):
        self._set_ui_state(False)
        self.var_progress.set(100.0)
        self.last_output_pdf = stats["output_pdf"]
        self.btn_open_pdf.config(state="normal")
        self.btn_open_folder.config(state="normal")

        self.lbl_status.config(
            text=f"✅ पूर्ण झाले! {stats['total_replacements']} बदल झाले ({stats['time_taken_seconds']} सेकंद)",
            fg=self.colors["success"]
        )

        self._log("=" * 45)
        self._log(f"🎉 PDF मजकूर यशस्वीरीत्या बदलला!")
        self._log(f"   एकूण बदल: {stats['total_replacements']}")
        self._log(f"   बदल झालेली पाने: {stats['pages_modified']} / {stats['processed_pages_count']}")
        self._log(f"   लागलेला वेळ: {stats['time_taken_seconds']} सेकंद")
        self._log(f"   आउटपुट फाईल: {stats['output_pdf']}")
        for word, count in stats["keyword_replacements"].items():
            self._log(f"   • '{word}': {count} बदल")
        self._log("=" * 45)

        res = messagebox.askyesno(
            "अभिनंदन!",
            f"PDF मधील मजकूर यशस्वीरीत्या बदलला आहे!\n\n"
            f"• एकूण बदल: {stats['total_replacements']}\n"
            f"• बदल झालेली पाने: {stats['pages_modified']}\n"
            f"• वेळ: {stats['time_taken_seconds']} सेकंद\n\n"
            f"तुम्हाला नवीन तयार झालेली PDF आताच उघडायची आहे का?"
        )
        if res:
            self._on_open_output_pdf()

    def _on_error(self, title: str, error: Exception):
        self._set_ui_state(False)
        self.lbl_status.config(text=f"❌ त्रुटी: {error}", fg=self.colors["danger"])
        self._log(f"त्रुटी: {error}")
        messagebox.showerror(title, f"प्रक्रिया करताना खालील त्रुटी आली:\n{error}")

    def _on_open_output_pdf(self):
        if self.last_output_pdf and os.path.exists(self.last_output_pdf):
            try:
                os.startfile(self.last_output_pdf)
            except Exception as e:
                self._log(f"PDF उघडण्यात त्रुटी: {e}")

    def _on_open_output_folder(self):
        if self.last_output_pdf and os.path.exists(self.last_output_pdf):
            folder = os.path.dirname(self.last_output_pdf)
            try:
                subprocess.Popen(f'explorer /select,"{os.path.abspath(self.last_output_pdf)}"')
            except Exception:
                os.startfile(folder)


def main():
    app = PDFReplacerApp()
    app.mainloop()


if __name__ == "__main__":
    main()
