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
import mimetypes
import subprocess
import threading
import time
import webbrowser
from http.server import HTTPServer, ThreadingHTTPServer, BaseHTTPRequestHandler
from PIL import Image

# Reconfigure stdout/stderr for line buffering & UTF-8 on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
except Exception:
    pass

# Import WIA engine
from wia_scanner import WiaScannerEngine

HOST = "127.0.0.1"
PORT = 8989
VERSION = "2.0.0"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

engine = WiaScannerEngine()
mock_page_counter = 1

class ScannerBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With, Access-Control-Request-Private-Network")
        self.send_header("Access-Control-Allow-Private-Network", "true")
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

    def _serve_static_file(self, file_path):
        if not os.path.isfile(file_path):
            self._send_json(404, {"error": "File not found"})
            return

        ctype, _ = mimetypes.guess_type(file_path)
        if not ctype:
            ctype = "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"

        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Status / Healthcheck
        if path == "/api/status":
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

        # 4. Serve scanner.html or other static files directly via HTTP
        clean_path = path.lstrip("/")
        if not clean_path or clean_path in ("scanner", "scanner.html"):
            target_file = os.path.join(BASE_DIR, "scanner.html")
            self._serve_static_file(target_file)
            return

        # Serve other local files safely
        safe_rel_path = os.path.normpath(clean_path).replace("\\", "/")
        if not safe_rel_path.startswith(".."):
            local_target = os.path.join(BASE_DIR, safe_rel_path)
            if os.path.isfile(local_target):
                self._serve_static_file(local_target)
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
        sys.stderr.flush()


def free_port(port):
    """Cleanly terminate any stale process locking port 8989."""
    try:
        cmd = f'netstat -ano | findstr :{port}'
        out = subprocess.check_output(cmd, shell=True, text=True, errors='ignore')
        for line in out.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5 and f":{port}" in parts[1] and parts[3].upper() == "LISTENING":
                pid = parts[4]
                if pid != "0" and pid != str(os.getpid()):
                    print(f"  [*] पोर्ट {port} वरील जुनी प्रोसेस (PID {pid}) थांबवत आहे...", flush=True)
                    subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
    except Exception:
        pass


def start_server():
    server_address = (HOST, PORT)
    ThreadingHTTPServer.allow_reuse_address = True
    httpd = None

    for attempt in range(2):
        try:
            httpd = ThreadingHTTPServer(server_address, ScannerBridgeHandler)
            break
        except OSError as e:
            if attempt == 0:
                print(f"[!] पोर्ट {PORT} आधीच वापरात असू शकते. पोर्ट मोकळे करत आहे...", flush=True)
                free_port(PORT)
                time.sleep(1.0)
            else:
                print(f"[!] पोर्ट {PORT} सुरू करता आले नाही: {e}", flush=True)
                print("    कृपया पोर्ट 8989 वापरणारा दुसरा प्रोग्रॅम बंद करा.", flush=True)
                input("\nबाहेर पडण्यासाठी Enter दाबा...")
                sys.exit(1)

    print("=" * 65, flush=True)
    print(f"  EMUDRA UNIVERSAL SCANNER PRO - LOCAL BRIDGE v{VERSION}", flush=True)
    print(f"  Universal Hardware Scanner Bridge Service for Browser", flush=True)
    print("=" * 65, flush=True)
    print(f"  [OK] Service Running: http://{HOST}:{PORT}", flush=True)
    print(f"  [OK] Scanner Studio Web: http://{HOST}:{PORT}/scanner.html", flush=True)
    print(f"  [OK] WIA Hardware Engine Active", flush=True)
    print("  [सर्व्हिस थांबवण्यासाठी ही विंडो बंद करा किंवा Ctrl+C दाबा]", flush=True)
    print("-" * 65, flush=True)

    # Launch scanner studio in browser after server is ready
    def open_browser():
        time.sleep(0.8)
        web_url = f"http://{HOST}:{PORT}/scanner.html"
        print(f"  [OK] ब्राऊझरमध्ये स्कॅनर स्टुडिओ उघडत आहे: {web_url}\n", flush=True)
        try:
            webbrowser.open(web_url)
        except Exception:
            pass

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Local scanner bridge stopped.", flush=True)
    finally:
        if httpd:
            httpd.server_close()


if __name__ == "__main__":
    start_server()
