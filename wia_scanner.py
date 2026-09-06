# -*- coding: utf-8 -*-
"""
EMUDRA UNIVERSAL SCANNER - WIA Scanner Engine
Supports all USB & Network Scanners (Canon, HP, Epson, Brother, Ricoh, etc.)
via Windows Image Acquisition (WIA)
"""

import os
import sys
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFont

class WiaScannerEngine:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()

    def list_scanners(self):
        """Query Windows WIA for all connected scanner devices."""
        ps_code = """
$ErrorActionPreference = 'Stop'
try {
    $dm = New-Object -ComObject WIA.DeviceManager
    $devices = @()
    for ($i = 1; $i -le $dm.DeviceInfos.Count; $i++) {
        $dev = $dm.DeviceInfos.Item($i)
        # Type 1 = ScannerDeviceType
        if ($dev.Type -eq 1) {
            $name = $dev.Properties.Item("Name").Value
            $id = $dev.DeviceID
            $devices += "$id|||$name"
        }
    }
    $devices -join "###"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
"""
        ps_file = os.path.join(self.temp_dir, "wia_list.ps1")
        with open(ps_file, "w", encoding="utf-8") as f:
            f.write(ps_code)

        try:
            res = subprocess.run(
                ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            raw = res.stdout.strip()
            if not raw or raw.startswith("ERROR:"):
                return []
            
            scanners = []
            for item in raw.split("###"):
                item = item.strip()
                if "|||" in item:
                    dev_id, dev_name = item.split("|||", 1)
                    scanners.append({"id": dev_id.strip(), "name": dev_name.strip()})
            return scanners
        except Exception as e:
            print(f"Error listing WIA scanners: {e}")
            return []
        finally:
            if os.path.exists(ps_file):
                try: os.remove(ps_file)
                except Exception: pass

    def acquire_scan(self, device_id="AUTO", dpi=200, color_mode="color", use_native_dialog=False):
        """
        Scan a page from the selected scanner.
        color_mode: 'color' (1), 'grayscale' (2), 'bw' (4)
        """
        out_jpg = os.path.join(self.temp_dir, f"scan_{os.getpid()}_{id(self)}.jpg")
        if os.path.exists(out_jpg):
            try: os.remove(out_jpg)
            except Exception: pass

        intent_code = 1
        if color_mode == "grayscale":
            intent_code = 2
        elif color_mode == "bw":
            intent_code = 4

        dialog_flag = "$true" if use_native_dialog else "$false"

        ps_code = f"""
$ErrorActionPreference = 'Stop'
$outPath = '{out_jpg.replace(chr(92), "/")}'
$targetId = '{device_id}'
$dpi = {dpi}
$intent = {intent_code}
$useDialog = {dialog_flag}

try {{
    $CommonDialog = New-Object -ComObject WIA.CommonDialog

    if ($useDialog) {{
        # Native Windows Scanner Dialog
        $image = $CommonDialog.ShowAcquireImage(1, $intent, 131072, "{{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}}", $false, $false)
    }} else {{
        $dm = New-Object -ComObject WIA.DeviceManager
        $targetDev = $null
        for ($i = 1; $i -le $dm.DeviceInfos.Count; $i++) {{
            $dev = $dm.DeviceInfos.Item($i)
            if ($dev.Type -eq 1) {{
                if ($targetId -eq "AUTO" -or $dev.DeviceID -eq $targetId) {{
                    $targetDev = $dev
                    break
                }}
            }}
        }}

        if (-not $targetDev) {{
            Write-Output "NO_SCANNER"
            exit
        }}

        $device = $targetDev.Connect()
        $item = $device.Items.Item(1)

        # Set DPI (Property 6147 = Horiz, 6148 = Vert)
        try {{ $item.Properties.Item("6147").Value = $dpi }} catch {{}}
        try {{ $item.Properties.Item("6148").Value = $dpi }} catch {{}}

        # Set Color Intent (Property 6146)
        try {{ $item.Properties.Item("6146").Value = $intent }} catch {{}}

        $image = $item.Transfer("{{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}}")
    }}

    if ($image) {{
        if (Test-Path $outPath) {{ Remove-Item $outPath -Force }}
        $image.SaveFile($outPath)
        Write-Output "SCAN_SUCCESS"
    }} else {{
        Write-Output "SCAN_CANCELLED"
    }}
}} catch {{
    Write-Output "SCAN_ERROR: $($_.Exception.Message)"
}}
"""
        ps_file = os.path.join(self.temp_dir, f"wia_scan_{os.getpid()}.ps1")
        with open(ps_file, "w", encoding="utf-8") as f:
            f.write(ps_code)

        try:
            res = subprocess.run(
                ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_file],
                capture_output=True,
                text=True,
                timeout=120
            )
            raw = res.stdout.strip()

            if "NO_SCANNER" in raw:
                raise RuntimeError("कोणताही स्कॅनर सापडला नाही. कृपया स्कॅनर USB किंवा Wi-Fi ने जोडा आणि चालू करा.")
            elif "SCAN_CANCELLED" in raw:
                return None
            elif "SCAN_ERROR:" in raw:
                err_msg = raw.split("SCAN_ERROR:", 1)[1].strip()
                raise RuntimeError(f"स्कॅनिंग त्रुटी: {err_msg}")

            if os.path.exists(out_jpg):
                img = Image.open(out_jpg)
                img.load()
                return img
            else:
                raise RuntimeError("स्कॅन केलेली फाईल तयार झाली नाही.")
        finally:
            if os.path.exists(ps_file):
                try: os.remove(ps_file)
                except Exception: pass
            if os.path.exists(out_jpg):
                try: os.remove(out_jpg)
                except Exception: pass

    def create_mock_scan(self, page_num=1, dpi=200):
        """Generate a pristine simulated government document scan for testing."""
        w = int(8.27 * dpi)
        h = int(11.69 * dpi)
        img = Image.new("RGB", (w, h), (255, 255, 255))
        draw = ImageDraw.Draw(img)

        # Border
        draw.rectangle([30, 30, w - 30, h - 30], outline=(15, 23, 42), width=3)
        draw.rectangle([38, 38, w - 38, h - 38], outline=(56, 189, 248), width=1)

        # Header Title
        draw.rectangle([45, 45, w - 45, 140], fill=(241, 245, 249))
        draw.text((60, 60), f"ई-मुद्रा सेवा केंद्र • शासकीय कागदपत्र स्कॅन (Page {page_num})", fill=(15, 23, 42))
        draw.text((60, 95), f"रिझोल्युशन: {dpi} DPI • आपोआप स्कॅनर क्लिनिंग व ऑप्टिमायझेशन कार्यरत", fill=(2, 132, 199))

        # Sample Document Content Lines
        y = 180
        for i in range(12):
            draw.text((60, y), f"शासकीय कागदपत्र पुरावा क्र. {page_num}-{i+1} : अर्जदार माहिती व पडताळणी तपशील...", fill=(51, 65, 85))
            draw.line([(60, y + 25), (w - 60, y + 25)], fill=(226, 232, 240), width=1)
            y += 60

        # Sample photo slot
        draw.rectangle([w - 240, 180, w - 60, 420], outline=(100, 116, 139), width=2, fill=(248, 250, 252))
        draw.text((w - 220, 290), "पासपोर्ट फोटो\n(160x210 px)", fill=(100, 116, 139))

        # Bottom Stamp / Barcode placeholder
        draw.rectangle([60, h - 180, 280, h - 70], outline=(16, 185, 129), width=2)
        draw.text((75, h - 140), "ई-मुद्रा प्रमाणित डिजिटल स्कॅन", fill=(5, 150, 105))

        return img
