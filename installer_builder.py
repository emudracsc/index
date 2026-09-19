# -*- coding: utf-8 -*-
"""
EMUDRA PDF COMPRESSOR PRO - Official Windows Setup Installer
Author: e-Mudra Seva Kendra
Version: 2.0.0
"""

import os
import sys
import shutil
import subprocess
import threading
import winreg
import zipfile
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

# Application Metadata
APP_NAME = "EMUDRA PDF COMPRESSOR PRO"
APP_EXE_NAME = "EMUDRA_PDF_COMPRESSOR.exe"
APP_VERSION = "2.0.0"
PUBLISHER = "e-Mudra Seva Kendra"
REG_KEY_PATH = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\EMUDRA_PDF_COMPRESSOR_PRO"

def get_bundle_dir():
    """Return base directory for bundled resources in PyInstaller or dev mode."""
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def get_default_install_dir():
    local_app_data = os.environ.get('LOCALAPPDATA', os.path.expanduser('~'))
    return os.path.join(local_app_data, 'Programs', APP_NAME)

def create_windows_shortcut(target_exe, shortcut_path, icon_path="", description="", work_dir=""):
    """Create Windows .lnk shortcut cleanly without opening any console/PowerShell window."""
    if not work_dir:
        work_dir = os.path.dirname(target_exe)
    if not icon_path:
        icon_path = target_exe

    # 1. Native Windows Script Host (wscript.exe) - Subsystem 2 (GUI), 100% silent, zero console windows
    try:
        import tempfile
        vbs_path = os.path.join(tempfile.gettempdir(), f"_sc_{os.getpid()}_{os.urandom(4).hex()}.vbs")
        esc_sc = shortcut_path.replace('"', '""')
        esc_tgt = target_exe.replace('"', '""')
        esc_dir = work_dir.replace('"', '""')
        esc_ico = icon_path.replace('"', '""')
        esc_desc = description.replace('"', '""')
        vbs_content = (
            'Set WshShell = CreateObject("WScript.Shell")\r\n'
            f'Set Shortcut = WshShell.CreateShortcut("{esc_sc}")\r\n'
            f'Shortcut.TargetPath = "{esc_tgt}"\r\n'
            f'Shortcut.WorkingDirectory = "{esc_dir}"\r\n'
            f'Shortcut.IconLocation = "{esc_ico}, 0"\r\n'
            f'Shortcut.Description = "{esc_desc}"\r\n'
            'Shortcut.Save\r\n'
        )
        with open(vbs_path, 'w', encoding='ascii', errors='replace') as f:
            f.write(vbs_content)

        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0  # SW_HIDE
        subprocess.run(
            ["wscript.exe", "//nologo", vbs_path],
            check=False,
            capture_output=True,
            startupinfo=startupinfo,
            creationflags=0x08000000  # CREATE_NO_WINDOW
        )
        try:
            if os.path.exists(vbs_path):
                os.remove(vbs_path)
        except Exception:
            pass

        if os.path.exists(shortcut_path):
            return True
    except Exception as e:
        print(f"wscript shortcut creation error: {e}")

    # 2. Silent PowerShell fallback with hidden window style & CREATE_NO_WINDOW
    try:
        ps_script = f"""
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut('{shortcut_path}')
        $Shortcut.TargetPath = '{target_exe}'
        $Shortcut.WorkingDirectory = '{work_dir}'
        $Shortcut.IconLocation = '{icon_path}, 0'
        $Shortcut.Description = '{description}'
        $Shortcut.Save()
        """
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0  # SW_HIDE
        subprocess.run(
            ["powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", ps_script],
            check=True,
            capture_output=True,
            startupinfo=startupinfo,
            creationflags=0x08000000  # CREATE_NO_WINDOW
        )
        return True
    except Exception as e:
        print(f"Silent shortcut fallback error: {e}")
        return False

class InstallerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title(f"{APP_NAME} - Setup Wizard v{APP_VERSION}")
        self.root.geometry("540x440")
        self.root.minsize(540, 440)
        self.root.configure(bg="#0f172a")

        # Center window on screen
        self.root.update_idletasks()
        w = self.root.winfo_width()
        h = self.root.winfo_height()
        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        self.root.geometry(f"+{int((sw - w)/2)}+{int((sh - h)/2)}")

        # Try to set window icon
        bundle_dir = get_bundle_dir()
        icon_path = os.path.join(bundle_dir, 'images', 'emudra_compressor_icon.ico')
        if not os.path.exists(icon_path):
            icon_path = os.path.join(bundle_dir, 'emudra_compressor_icon.ico')
        if os.path.exists(icon_path):
            try:
                self.root.iconbitmap(icon_path)
            except Exception:
                pass
        self.icon_path = icon_path

        # State Variables
        self.install_dir_var = tk.StringVar(value=get_default_install_dir())
        self.desktop_shortcut_var = tk.BooleanVar(value=True)
        self.start_menu_shortcut_var = tk.BooleanVar(value=True)
        self.launch_after_var = tk.BooleanVar(value=True)

        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.style.configure("TProgressbar", thickness=16, troughcolor="#1e293b", background="#0284c7")

        # Container Frame
        self.main_frame = tk.Frame(self.root, bg="#0f172a")
        self.main_frame.pack(fill="both", expand=True, padx=20, pady=16)

        self.show_screen_welcome()

    def clear_frame(self):
        for widget in self.main_frame.winfo_children():
            widget.destroy()

    # -------------------------------------------------------------
    # Screen 1: Welcome Screen
    # -------------------------------------------------------------
    def show_screen_welcome(self):
        self.clear_frame()

        # Top Banner
        header_frame = tk.Frame(self.main_frame, bg="#1e293b", bd=1, relief="solid")
        header_frame.pack(fill="x", pady=(0, 14), ipady=8, ipadx=10)

        title_lbl = tk.Label(header_frame, text=f"⚡ {APP_NAME}", font=("Segoe UI", 13, "bold"), fg="#38bdf8", bg="#1e293b")
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(header_frame, text=f"{PUBLISHER} • Windows Setup Installer", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b")
        sub_lbl.pack(anchor="w")

        # Welcome Text Content
        body_text = (
            f"या इन्स्टॉलरच्या साहाय्याने {APP_NAME} आपल्या संगणकावर कायमस्वरूपी इन्स्टॉल केले जाईल.\n\n"
            "वैशिष्ट्ये:\n"
            "• शासकीय PDF अचूक १००, २००, २५० (आपले सरकार), व ५०० KB (महाडीबीटी) मध्ये कॉम्प्रेशन\n"
            "• पासपोर्ट फोटो १६०×२१० px आणि स्वाक्षरी २५६×६४ px मध्ये अचूक रीसाईझ व क्रॉपिंग\n"
            "• डेस्कटॉप व स्टार्ट मेनूवर थेट ॲप शॉर्टकट जोडले जाईल\n"
            "• इंटरनेटशिवाय ऑफलाइन अखंड कार्यरत\n\n"
            "पुढे जाण्यासाठी 'पुढे चला (Next)' बटणावर क्लिक करा."
        )
        desc_lbl = tk.Label(self.main_frame, text=body_text, font=("Segoe UI", 9), fg="#e2e8f0", bg="#0f172a", justify="left", wraplength=490)
        desc_lbl.pack(fill="x", pady=10)

        # Bottom Button Bar
        btn_bar = tk.Frame(self.main_frame, bg="#0f172a")
        btn_bar.pack(side="bottom", fill="x")

        cancel_btn = tk.Button(btn_bar, text="रद्द करा (Cancel)", font=("Segoe UI", 9), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=14, pady=6, cursor="hand2", command=self.root.quit)
        cancel_btn.pack(side="left")

        next_btn = tk.Button(btn_bar, text="पुढे चला (Next) ➔", font=("Segoe UI", 9, "bold"), bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=18, pady=6, cursor="hand2", command=self.show_screen_options)
        next_btn.pack(side="right")

    # -------------------------------------------------------------
    # Screen 2: Choose Directory & Options
    # -------------------------------------------------------------
    def show_screen_options(self):
        self.clear_frame()

        # Top Banner
        header_frame = tk.Frame(self.main_frame, bg="#1e293b", bd=1, relief="solid")
        header_frame.pack(fill="x", pady=(0, 14), ipady=6, ipadx=10)

        title_lbl = tk.Label(header_frame, text="इन्स्टॉलेशन पर्याय व फोल्डर निवडा", font=("Segoe UI", 12, "bold"), fg="#38bdf8", bg="#1e293b")
        title_lbl.pack(anchor="w")

        # Destination Folder Frame
        dir_lbl = tk.Label(self.main_frame, text="इन्स्टॉल करण्याचे ठिकाण (Destination Folder):", font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#0f172a")
        dir_lbl.pack(anchor="w", pady=(4, 2))

        dir_box_frame = tk.Frame(self.main_frame, bg="#0f172a")
        dir_box_frame.pack(fill="x", pady=(0, 12))

        dir_entry = tk.Entry(dir_box_frame, textvariable=self.install_dir_var, font=("Segoe UI", 9), bg="#1e293b", fg="#ffffff", insertbackground="#38bdf8", bd=1, relief="solid")
        dir_entry.pack(side="left", fill="x", expand=True, ipady=4, padx=(0, 6))

        browse_btn = tk.Button(dir_box_frame, text="Browse...", font=("Segoe UI", 9), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=10, pady=3, cursor="hand2", command=self.browse_folder)
        browse_btn.pack(side="right")

        # Options Checkboxes Frame
        opts_frame = tk.LabelFrame(self.main_frame, text="अतिरिक्त शॉर्टकट पर्याय (Shortcut Options)", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#0f172a", padx=10, pady=8)
        opts_frame.pack(fill="x", pady=(0, 14))

        cb_desktop = tk.Checkbutton(opts_frame, text="डेस्कटॉपवर शॉर्टकट तयार करा (Create Desktop Shortcut)", variable=self.desktop_shortcut_var, font=("Segoe UI", 9), fg="#e2e8f0", bg="#0f172a", selectcolor="#1e293b", activebackground="#0f172a", activeforeground="#38bdf8")
        cb_desktop.pack(anchor="w", pady=2)

        cb_start = tk.Checkbutton(opts_frame, text="स्टार्ट मेनूमध्ये शॉर्टकट जोडा (Add to Start Menu)", variable=self.start_menu_shortcut_var, font=("Segoe UI", 9), fg="#e2e8f0", bg="#0f172a", selectcolor="#1e293b", activebackground="#0f172a", activeforeground="#38bdf8")
        cb_start.pack(anchor="w", pady=2)

        cb_launch = tk.Checkbutton(opts_frame, text="इन्स्टॉलेशन पूर्ण झाल्यावर सॉफ्टवेअर लगेच सुरू करा", variable=self.launch_after_var, font=("Segoe UI", 9), fg="#e2e8f0", bg="#0f172a", selectcolor="#1e293b", activebackground="#0f172a", activeforeground="#38bdf8")
        cb_launch.pack(anchor="w", pady=2)

        # Bottom Button Bar
        btn_bar = tk.Frame(self.main_frame, bg="#0f172a")
        btn_bar.pack(side="bottom", fill="x")

        back_btn = tk.Button(btn_bar, text="◀ मागे (Back)", font=("Segoe UI", 9), bg="#334155", fg="#f1f5f9", activebackground="#475569", bd=0, padx=14, pady=6, cursor="hand2", command=self.show_screen_welcome)
        back_btn.pack(side="left")

        install_btn = tk.Button(btn_bar, text="इन्स्टॉल करा (Install) ⚡", font=("Segoe UI", 9, "bold"), bg="#10b981", fg="#ffffff", activebackground="#059669", bd=0, padx=18, pady=6, cursor="hand2", command=self.start_installation)
        install_btn.pack(side="right")

    def browse_folder(self):
        chosen = filedialog.askdirectory(initialdir=self.install_dir_var.get(), title="इन्स्टॉलेशन फोल्डर निवडा")
        if chosen:
            self.install_dir_var.set(os.path.join(chosen, APP_NAME))

    # -------------------------------------------------------------
    # Screen 3: Installation Progress & Engine
    # -------------------------------------------------------------
    def start_installation(self):
        install_dir = self.install_dir_var.get().strip()
        if not install_dir:
            messagebox.showerror("त्रुटी", "कृपया वैध इन्स्टॉलेशन फोल्डर निवडा.")
            return

        self.clear_frame()

        # Top Banner
        header_frame = tk.Frame(self.main_frame, bg="#1e293b", bd=1, relief="solid")
        header_frame.pack(fill="x", pady=(0, 20), ipady=6, ipadx=10)

        title_lbl = tk.Label(header_frame, text=f"{APP_NAME} इन्स्टॉल होत आहे...", font=("Segoe UI", 12, "bold"), fg="#38bdf8", bg="#1e293b")
        title_lbl.pack(anchor="w")

        # Progress elements
        self.status_lbl = tk.Label(self.main_frame, text="इन्स्टॉलेशन सुरू होत आहे...", font=("Segoe UI", 9), fg="#e2e8f0", bg="#0f172a")
        self.status_lbl.pack(anchor="w", pady=(10, 4))

        self.progress_bar = ttk.Progressbar(self.main_frame, style="TProgressbar", mode="determinate", length=490)
        self.progress_bar.pack(fill="x", pady=(0, 10))

        # Launch install worker in thread
        threading.Thread(target=self._run_install_worker, args=(install_dir,), daemon=True).start()

    def _run_install_worker(self, install_dir):
        bundle_dir = get_bundle_dir()

        def update_ui(pct, status):
            self.root.after(0, lambda: (self.progress_bar.configure(value=pct), self.status_lbl.configure(text=status)))

        try:
            update_ui(15, "१. इन्स्टॉलेशन डिरेक्टरी तयार करत आहे...")
            os.makedirs(install_dir, exist_ok=True)

            # Locate payload (1. zip bundle for super fast onedir launch, 2. directory, 3. standalone exe)
            zip_bundle = None
            possible_zip_locations = [
                os.path.join(bundle_dir, 'payload', 'app_bundle.zip'),
                os.path.join(bundle_dir, 'app_bundle.zip'),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 'payload', 'app_bundle.zip'),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app_bundle.zip')
            ]
            for p in possible_zip_locations:
                if os.path.exists(p):
                    zip_bundle = p
                    break

            payload_dir = None
            if not zip_bundle:
                possible_dir_locations = [
                    os.path.join(bundle_dir, 'payload', 'app_bundle'),
                    os.path.join(bundle_dir, 'app_bundle'),
                    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'payload', 'app_bundle'),
                    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'EMUDRA_PDF_COMPRESSOR')
                ]
                for p in possible_dir_locations:
                    if os.path.isdir(p) and os.path.exists(os.path.join(p, APP_EXE_NAME)):
                        payload_dir = p
                        break

            payload_exe = None
            if not zip_bundle and not payload_dir:
                possible_exe_locations = [
                    os.path.join(bundle_dir, 'payload', APP_EXE_NAME),
                    os.path.join(bundle_dir, 'softwares', APP_EXE_NAME),
                    os.path.join(bundle_dir, APP_EXE_NAME),
                    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'softwares', APP_EXE_NAME),
                    os.path.join(os.path.dirname(os.path.abspath(__file__)), APP_EXE_NAME)
                ]
                for p in possible_exe_locations:
                    if os.path.exists(p):
                        payload_exe = p
                        break

            if not zip_bundle and not payload_dir and not payload_exe:
                raise FileNotFoundError(f"मुख्य प्रोग्राम फाईल सापडली नाही: {APP_EXE_NAME}")

            # Locate icon
            payload_icon = None
            possible_icon_locations = [
                os.path.join(bundle_dir, 'payload', 'emudra_compressor_icon.ico'),
                os.path.join(bundle_dir, 'images', 'emudra_compressor_icon.ico'),
                os.path.join(bundle_dir, 'emudra_compressor_icon.ico'),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'emudra_compressor_icon.ico')
            ]
            for p in possible_icon_locations:
                if os.path.exists(p):
                    payload_icon = p
                    break

            target_exe = os.path.join(install_dir, APP_EXE_NAME)

            if zip_bundle:
                update_ui(35, "२. प्रोग्रॅम फाइल्स अनपॅक करत आहे (जलद गती)...")
                with zipfile.ZipFile(zip_bundle, 'r') as zf:
                    members = zf.infolist()
                    total_m = len(members)
                    for i, m in enumerate(members):
                        zf.extract(m, install_dir)
                        if i % 15 == 0 or i == total_m - 1:
                            pct = 35 + int((i / max(1, total_m)) * 20)
                            update_ui(pct, f"२. फाइल्स अनपॅक होत आहेत ({i+1}/{total_m})...")
            elif payload_dir:
                update_ui(35, "२. प्रोग्रॅम फाइल्स कॉपी करत आहे...")
                shutil.copytree(payload_dir, install_dir, dirs_exist_ok=True)
            else:
                update_ui(35, "२. प्रोग्रॅम फाईल कॉपी करत आहे...")
                shutil.copy2(payload_exe, target_exe)

            target_icon = os.path.join(install_dir, "app_icon.ico")
            if payload_icon and os.path.exists(payload_icon):
                shutil.copy2(payload_icon, target_icon)
            else:
                target_icon = target_exe

            # Create Uninstaller Script inside install directory
            update_ui(55, "३. विंडोज अनइन्स्टॉलर तयार करत आहे...")
            self._create_uninstaller(install_dir, target_exe)

            # Register with Windows Registry (Add/Remove Programs)
            update_ui(70, "४. विंडोज रजिस्ट्रीमध्ये नोंदणी करत आहे...")
            self._register_in_windows(install_dir, target_exe, target_icon)

            # Create Desktop and Start Menu Shortcuts
            update_ui(85, "५. डेस्कटॉप व स्टार्ट मेनू शॉर्टकट तयार करत आहे...")
            if self.desktop_shortcut_var.get():
                desktop = os.path.join(os.environ.get('USERPROFILE', os.path.expanduser('~')), 'Desktop')
                dt_shortcut = os.path.join(desktop, f"{APP_NAME}.lnk")
                create_windows_shortcut(target_exe, dt_shortcut, target_icon, APP_NAME, install_dir)

            if self.start_menu_shortcut_var.get():
                appdata = os.environ.get('APPDATA', '')
                if appdata:
                    start_programs = os.path.join(appdata, r'Microsoft\Windows\Start Menu\Programs')
                    sm_shortcut = os.path.join(start_programs, f"{APP_NAME}.lnk")
                    create_windows_shortcut(target_exe, sm_shortcut, target_icon, APP_NAME, install_dir)

            update_ui(100, "६. इन्स्टॉलेशन पूर्ण झाले!")
            self.root.after(400, lambda: self.show_screen_finish(install_dir, target_exe))

        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("इन्स्टॉलेशन त्रुटी", f"इन्स्टॉलेशन दरम्यान त्रुटी आली:\n{str(e)}"))
            self.root.after(0, self.show_screen_options)

    def _create_uninstaller(self, install_dir, target_exe):
        """Create a clean uninstallation batch script and executable stub."""
        uninstall_bat = os.path.join(install_dir, "Uninstall.bat")
        bat_content = f"""@echo off
chcp 65001 >nul
title {APP_NAME} - Uninstall
echo ========================================================
echo   {APP_NAME} Uninstaller
echo ========================================================
echo.
echo तुम्ही {APP_NAME} संगणकावरून काढून टाकू इच्छिता का?
set /p userConfirm="चालू ठेवण्यासाठी (Y) दाबा किंवा रद्द करण्यासाठी (N): "
if /I "%userConfirm%" NEQ "Y" exit

echo.
echo [1/3] शॉर्टकट्स काढत आहे...
del /q "%USERPROFILE%\\Desktop\\{APP_NAME}.lnk" 2>nul
del /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\{APP_NAME}.lnk" 2>nul

echo [2/3] विंडोज रजिस्ट्री माहिती काढत आहे...
reg delete "HKCU\\{REG_KEY_PATH}" /f >nul 2>&1

echo [3/3] फाइल्स हटवत आहे...
start /b "" cmd /c "timeout /t 1 >nul & rd /s /q \\"{install_dir}\\""
echo.
echo {APP_NAME} यशस्वीरित्या काढून टाकण्यात आले आहे!
timeout /t 3 >nul
exit
"""
        with open(uninstall_bat, 'w', encoding='utf-8') as f:
            f.write(bat_content)

    def _register_in_windows(self, install_dir, target_exe, target_icon):
        """Register the application in Windows Registry (HKCU Uninstall)."""
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, REG_KEY_PATH)
            winreg.SetValueEx(key, "DisplayName", 0, winreg.REG_SZ, APP_NAME)
            winreg.SetValueEx(key, "DisplayVersion", 0, winreg.REG_SZ, APP_VERSION)
            winreg.SetValueEx(key, "Publisher", 0, winreg.REG_SZ, PUBLISHER)
            winreg.SetValueEx(key, "DisplayIcon", 0, winreg.REG_SZ, f"{target_icon},0")
            winreg.SetValueEx(key, "InstallLocation", 0, winreg.REG_SZ, install_dir)
            winreg.SetValueEx(key, "UninstallString", 0, winreg.REG_SZ, f'cmd.exe /c "{os.path.join(install_dir, "Uninstall.bat")}"')
            winreg.SetValueEx(key, "EstimatedSize", 0, winreg.REG_DWORD, 42000) # in KB
            winreg.CloseKey(key)
        except Exception as e:
            print(f"Registry registration error: {e}")

    # -------------------------------------------------------------
    # Screen 4: Finish Screen
    # -------------------------------------------------------------
    def show_screen_finish(self, install_dir, target_exe):
        self.clear_frame()

        # Success Banner
        header_frame = tk.Frame(self.main_frame, bg="#064e3b", bd=1, relief="solid")
        header_frame.pack(fill="x", pady=(0, 16), ipady=10, ipadx=12)

        title_lbl = tk.Label(header_frame, text="✅ इन्स्टॉलेशन यशस्वी!", font=("Segoe UI", 13, "bold"), fg="#34d399", bg="#064e3b")
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(header_frame, text=f"{APP_NAME} आपल्या सिस्टमवर यशस्वीरित्या इन्स्टॉल झाले आहे.", font=("Segoe UI", 9), fg="#a7f3d0", bg="#064e3b")
        sub_lbl.pack(anchor="w")

        # Summary box
        msg = (
            f"📍 इन्स्टॉलेशन ठिकाण:\n{install_dir}\n\n"
            f"🔗 शॉर्टकट्स:\n"
            f"{'• डेस्कटॉप शॉर्टकट तयार झाला.' if self.desktop_shortcut_var.get() else ''}\n"
            f"{'• स्टार्ट मेनू शॉर्टकट तयार झाला.' if self.start_menu_shortcut_var.get() else ''}\n\n"
            "आता आपण संगणकावर इंटरनेटशिवाय कधीही थेट हे सॉफ्टवेअर वापरू शकता."
        )
        desc_lbl = tk.Label(self.main_frame, text=msg, font=("Segoe UI", 9), fg="#e2e8f0", bg="#0f172a", justify="left")
        desc_lbl.pack(fill="x", pady=10)

        # Bottom Button Bar
        btn_bar = tk.Frame(self.main_frame, bg="#0f172a")
        btn_bar.pack(side="bottom", fill="x")

        finish_btn = tk.Button(btn_bar, text="बाहेर पडा (Finish) 🚀", font=("Segoe UI", 10, "bold"), bg="#10b981", fg="#ffffff", activebackground="#059669", bd=0, padx=22, pady=7, cursor="hand2", command=lambda: self._finish(target_exe))
        finish_btn.pack(side="right")

    def _finish(self, target_exe):
        if self.launch_after_var.get() and os.path.exists(target_exe):
            try:
                subprocess.Popen([target_exe], cwd=os.path.dirname(target_exe), creationflags=0x08000000)
            except Exception:
                try:
                    os.startfile(target_exe)
                except Exception:
                    pass
        self.root.quit()

def main():
    root = tk.Tk()
    app = InstallerGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
