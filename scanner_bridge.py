# -*- coding: utf-8 -*-
"""
EMUDRA UNIVERSAL SCANNER - Local Hardware Bridge Service
Runs a lightweight, zero-dependency local HTTP API on http://127.0.0.1:8989
Connects any Web Browser (Chrome, Edge, Firefox) to Windows WIA Scanners (Canon, HP, Epson, Brother, etc.)

Author: e-Mudra Seva Kendra
Version: 2.0.0
"""

import os
import sys
import io
import json
import base64
import urllib.parse
from http.server import HTTPServer, ThreadingHTTPServer, BaseHTTPRequestHandler
from PIL import Image

# Reconfigure stdout/stderr for Unicode on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Import WIA engine
from wia_scanner import WiaScannerEngine

HOST = "127.0.0.1"
PORT = 8989
VERSION = "2.0.0"

engine = WiaScannerEngine()
mock_page_counter = 1

class ScannerBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Status / Healthcheck
        if path in ("/", "/api/status"):
            self._send_json(200, {
                "status": "ok",
                "service": "EMUDRA Universal Scanner Bridge",
                "version": VERSION,
                "wia_engine": "Windows Image Acquisition (WIA COM)",
                "port": PORT
            })
            return

        # 2. List Scanners
        if path == "/api/scanners":
            try:
                scanners = engine.list_scanners()
                self._send_json(200, {
                    "success": True,
                    "count": len(scanners),
                    "scanners": scanners
                })
            except Exception as e:
                self._send_json(500, {
                    "success": False,
                    "error": str(e),
                    "scanners": []
                })
            return

        # 3. Test / Mock Scan (Simulate hardware scan without physical scanner)
        if path == "/api/test_scan":
            global mock_page_counter
            dpi = int(query.get("dpi", [200])[0])
            page_num = int(query.get("page", [mock_page_counter])[0])
            mock_page_counter += 1

            try:
                img = engine.create_mock_scan(page_num=page_num, dpi=dpi)
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=90)
                img_bytes = buf.getvalue()
                b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

                self._send_json(200, {
                    "success": True,
                    "is_mock": True,
                    "page_number": page_num,
                    "width": img.width,
                    "height": img.height,
                    "dpi": dpi,
                    "size_bytes": len(img_bytes),
                    "image_data": b64_str
                })
            except Exception as e:
                self._send_json(500, {
                    "success": False,
                    "error": str(e)
                })
            return

        # Not found
        self._send_json(404, {"error": "Not found", "path": path})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Scan Document API
        if path == "/api/scan":
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"

            try:
                req_data = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception:
                req_data = {}

            device_id = req_data.get("device_id", "AUTO")
            dpi = int(req_data.get("dpi", 200))
            color_mode = req_data.get("color_mode", "color")
            use_native_dialog = bool(req_data.get("use_native_dialog", False))

            try:
                # Trigger scan via WIA
                img = engine.acquire_scan(
                    device_id=device_id,
                    dpi=dpi,
                    color_mode=color_mode,
                    use_native_dialog=use_native_dialog
                )

                if img is None:
                    # User cancelled
                    self._send_json(200, {
                        "success": False,
                        "cancelled": True,
                        "message": "स्कॅनिंग युझरने रद्द केले."
                    })
                    return

                # Ensure RGB mode for JPEG encoding
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=92, optimize=True)
                img_bytes = buf.getvalue()
                b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("ascii")

                self._send_json(200, {
                    "success": True,
                    "width": img.width,
                    "height": img.height,
                    "dpi": dpi,
                    "color_mode": color_mode,
                    "size_bytes": len(img_bytes),
                    "image_data": b64_str
                })
            except RuntimeError as re:
                self._send_json(200, {
                    "success": False,
                    "error": str(re)
                })
            except Exception as e:
                self._send_json(500, {
                    "success": False,
                    "error": f"तांत्रिक त्रुटी: {str(e)}"
                })
            return

        self._send_json(404, {"error": "Not found", "path": path})

    def log_message(self, format, *args):
        # Format clean console logs
        sys.stderr.write(f"[BRIDGE] {self.address_string()} - {format % args}\n")


def start_server():
    server_address = (HOST, PORT)
    try:
        httpd = ThreadingHTTPServer(server_address, ScannerBridgeHandler)
    except OSError as e:
        print(f"[!] पोर्ट {PORT} आधीच वापरात आहे किंवा ॲक्सेस नाकारला: {e}")
        return

    print("=" * 65)
    print(f"  EMUDRA UNIVERSAL SCANNER PRO - LOCAL BRIDGE v{VERSION}")
    print(f"  Universal Hardware Scanner Bridge Service for Browser")
    print("=" * 65)
    print(f"  [OK] Service Running: http://{HOST}:{PORT}")
    print(f"  [OK] Browser API Ready: http://{HOST}:{PORT}/api/status")
    print(f"  [OK] WIA Hardware Scanner: http://{HOST}:{PORT}/api/scanners")
    print(f"  [OK] Open 'scanner.html' in your browser.")
    print("  [Press Ctrl+C to Stop]")
    print("-" * 65)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Local scanner bridge stopped.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    start_server()
