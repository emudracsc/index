"""
PDF Find & Replace Web Server
=============================
स्थानिक वेब सर्व्हर - ब्राउझरमध्ये रिअल-टाइम (Live Streaming) PDF मजकूर शोधून बदलण्यासाठी API आणि वेब इंटरफेस.
"""

import os
import sys
import json
import time
import io
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# Ensure UTF-8 output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        print("[ERROR] PyMuPDF सापडले नाही.")
        sys.exit(1)

from pdf_text_replacer import replace_text_in_pdf, scan_pdf, get_default_font_path

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


class PDFReplacerHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def send_error(self, code, message=None, explain=None):
        """Ensure message is strictly ASCII safe so latin-1 header encoding never fails"""
        if message is not None:
            message = "".join(c if (ord(c) < 128 and c not in '\r\n') else "_" for c in str(message))
        super().send_error(code, message, explain)

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        url_path = parsed.path

        if url_path == "/api/download" or url_path.startswith("/download"):
            self._handle_download(parsed)
        elif url_path.startswith("/outputs/"):
            self._handle_output_file(url_path)
        else:
            super().do_HEAD()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        url_path = parsed.path

        if url_path == "/api/download" or url_path.startswith("/download"):
            self._handle_download(parsed)
        elif url_path.startswith("/outputs/"):
            # Ensure proper attachment header for direct output downloads
            self._handle_output_file(url_path)
        else:
            super().do_GET()

    def _handle_download(self, parsed):
        qs = urllib.parse.parse_qs(parsed.query)
        raw_fname = qs.get("file", [""])[0] or qs.get("filename", [""])[0]
        if not raw_fname:
            self.send_error(400, "Missing file parameter")
            return
        
        # Check both direct name and unquoted name
        candidates = [
            os.path.basename(raw_fname),
            os.path.basename(urllib.parse.unquote(raw_fname))
        ]
        
        target_path = None
        target_name = None
        for c in candidates:
            p = os.path.join(OUTPUT_DIR, c)
            if os.path.exists(p) and os.path.isfile(p):
                target_path = p
                target_name = c
                break
        
        if not target_path:
            self.send_error(404, "File not found")
            return

        self._serve_attachment(target_path, target_name)

    def _handle_output_file(self, url_path):
        raw_fname = url_path.replace("/outputs/", "")
        candidates = [
            os.path.basename(urllib.parse.unquote(raw_fname)),
            os.path.basename(raw_fname)
        ]
        target_path = None
        target_name = None
        for c in candidates:
            p = os.path.join(OUTPUT_DIR, c)
            if os.path.exists(p) and os.path.isfile(p):
                target_path = p
                target_name = c
                break
        if not target_path:
            self.send_error(404, "File not found")
            return
        self._serve_attachment(target_path, target_name)

    def _serve_attachment(self, fpath, fname):
        try:
            file_size = os.path.getsize(fpath)

            # Sanitize filename for HTTP header (must be ASCII strictly to avoid latin-1 encoding error)
            ascii_fname = "".join(c if (ord(c) < 128 and c not in '"\\;\r\n') else "_" for c in fname)
            if not ascii_fname.strip("_"):
                ascii_fname = "document.pdf"
            elif not ascii_fname.lower().endswith(".pdf"):
                ascii_fname += ".pdf"

            # RFC 5987 / RFC 6266 standard UTF-8 encoding
            encoded_utf8_name = urllib.parse.quote(fname)

            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(file_size))
            self.send_header("Content-Disposition", f'attachment; filename="{ascii_fname}"; filename*=UTF-8\'\'{encoded_utf8_name}')
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            if self.command != "HEAD":
                with open(fpath, "rb") as f:
                    while True:
                        chunk = f.read(64 * 1024)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        self.wfile.flush()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            # Client closed connection / finished download
            pass
        except Exception as e:
            try:
                self.send_error(500, "Error reading file")
            except Exception:
                pass

    def do_POST(self):
        url_path = urllib.parse.urlparse(self.path).path

        if url_path in ("/api/scan", "/api/scan_stream"):
            self._handle_scan_stream()
        elif url_path in ("/api/replace", "/api/replace_stream"):
            self._handle_replace_stream()
        elif url_path in ("/api/merge", "/api/merge_stream"):
            self._handle_merge_stream()
        elif url_path == "/api/sample":
            self._handle_sample()
        else:
            self.send_error(404, "Endpoint not found")

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _parse_multipart_all(self):
        ctype = self.headers.get("Content-Type", "")
        if not ctype.startswith("multipart/form-data"):
            raise ValueError("Expected multipart/form-data")

        # Extract boundary accurately
        boundary = None
        for part_hdr in ctype.split(";"):
            part_hdr = part_hdr.strip()
            if part_hdr.lower().startswith("boundary="):
                boundary = part_hdr[len("boundary="):].strip().strip('"\'')
                break

        if not boundary:
            raise ValueError("Boundary not found in Content-Type header")

        content_length = int(self.headers.get("Content-Length", 0))
        if content_length <= 0:
            raise ValueError("Invalid or missing Content-Length")

        # Read complete body from socket chunk-by-chunk to prevent socket truncation on large files
        post_data = bytearray()
        bytes_left = content_length
        while bytes_left > 0:
            chunk = self.rfile.read(min(bytes_left, 1024 * 1024))
            if not chunk:
                break
            post_data.extend(chunk)
            bytes_left -= len(chunk)

        boundary_bytes = boundary.encode("ascii")
        first_delim = b"--" + boundary_bytes
        delim = b"\r\n--" + boundary_bytes

        raw_bytes = bytes(post_data)
        if raw_bytes.startswith(first_delim):
            content = raw_bytes[len(first_delim):]
            if content.startswith(b"\r\n"):
                content = content[2:]
        else:
            content = raw_bytes

        raw_parts = content.split(delim)
        form_fields = {}
        files_list = []

        for part in raw_parts:
            if not part or part == b"--\r\n" or part == b"--" or part == b"\r\n":
                continue
            if b"\r\n\r\n" not in part:
                continue

            headers_raw, body = part.split(b"\r\n\r\n", 1)
            headers_text = headers_raw.decode("utf-8", errors="ignore")

            if 'filename="' in headers_text:
                fname = headers_text.split('filename="')[1].split('"')[0]
                if fname:
                    files_list.append({"filename": fname, "bytes": body})
            else:
                for line in headers_text.split("\r\n"):
                    if "Content-Disposition:" in line and 'name="' in line:
                        field_name = line.split('name="')[1].split('"')[0]
                        form_fields[field_name] = body.decode("utf-8", errors="ignore")

        return form_fields, files_list

    def _parse_multipart(self):
        fields, files_list = self._parse_multipart_all()
        file_bytes = files_list[0]["bytes"] if files_list else None
        file_name = files_list[0]["filename"] if files_list else "uploaded.pdf"
        return fields, file_bytes, file_name

    def _handle_scan_stream(self):
        self.close_connection = True
        try:
            fields, file_bytes, file_name = self._parse_multipart()
            if not file_bytes:
                self._send_json({"error": "कोणतीही PDF फाईल अपलोड केलेली नाही."}, 400)
                return

            rules_str = fields.get("rules", "{}")
            page_range = fields.get("pages", "all")
            replacement_map = json.loads(rules_str)

            temp_in = os.path.join(UPLOAD_DIR, f"scan_{int(time.time()*1000)}_{file_name}")
            with open(temp_in, "wb") as f:
                f.write(file_bytes)

            self.send_response(200)
            self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "close")
            self.end_headers()

            def progress_callback(curr, total, msg, extra=None):
                payload = {"type": "progress", "current": curr, "total": total, "msg": msg}
                if extra:
                    payload.update(extra)
                line = (json.dumps(payload, ensure_ascii=False) + "\n").encode("utf-8")
                try:
                    self.wfile.write(line)
                    self.wfile.flush()
                except Exception:
                    pass

            stats = scan_pdf(temp_in, replacement_map, page_range, progress_callback=progress_callback)

            try:
                os.remove(temp_in)
            except Exception:
                pass

            done_payload = {
                "type": "done",
                "success": True,
                "stats": stats
            }
            line = (json.dumps(done_payload, ensure_ascii=False) + "\n").encode("utf-8")
            self.wfile.write(line)
            self.wfile.flush()

        except Exception as e:
            try:
                err_line = (json.dumps({"type": "error", "error": str(e)}, ensure_ascii=False) + "\n").encode("utf-8")
                self.wfile.write(err_line)
                self.wfile.flush()
            except Exception:
                pass

    def _handle_replace_stream(self):
        self.close_connection = True
        try:
            fields, file_bytes, file_name = self._parse_multipart()
            if not file_bytes:
                self._send_json({"error": "कोणतीही PDF फाईल अपलोड केलेली नाही."}, 400)
                return

            rules_str = fields.get("rules", "{}")
            page_range = fields.get("pages", "all")
            replacement_map = json.loads(rules_str)

            ts = int(time.time() * 1000)
            base_name, ext = os.path.splitext(file_name)
            # Safe ASCII filename on disk
            clean_base = "".join(c if (c.isascii() and (c.isalnum() or c in "._- ")) else "_" for c in base_name)
            clean_base = clean_base.strip("._ ")
            if not clean_base:
                clean_base = "document"
            temp_in = os.path.join(UPLOAD_DIR, f"in_{ts}_{clean_base}{ext}")
            out_name = f"{clean_base}_replaced_{ts}{ext}"
            temp_out = os.path.join(OUTPUT_DIR, out_name)

            with open(temp_in, "wb") as f:
                f.write(file_bytes)

            self.send_response(200)
            self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "close")
            self.end_headers()

            def progress_callback(curr, total, msg, extra=None):
                payload = {"type": "progress", "current": curr, "total": total, "msg": msg}
                if extra:
                    payload.update(extra)
                line = (json.dumps(payload, ensure_ascii=False) + "\n").encode("utf-8")
                try:
                    self.wfile.write(line)
                    self.wfile.flush()
                except Exception:
                    pass

            stats = replace_text_in_pdf(
                input_pdf=temp_in,
                output_pdf=temp_out,
                replacement_map=replacement_map,
                page_range=page_range,
                progress_callback=progress_callback
            )

            try:
                os.remove(temp_in)
            except Exception:
                pass

            download_url = f"/outputs/{out_name}"
            done_payload = {
                "type": "done",
                "success": True,
                "stats": stats,
                "download_url": download_url,
                "file_name": out_name
            }
            line = (json.dumps(done_payload, ensure_ascii=False) + "\n").encode("utf-8")
            self.wfile.write(line)
            self.wfile.flush()

        except Exception as e:
            try:
                err_line = (json.dumps({"type": "error", "error": str(e)}, ensure_ascii=False) + "\n").encode("utf-8")
                self.wfile.write(err_line)
                self.wfile.flush()
            except Exception:
                pass

    def _handle_merge_stream(self):
        self.close_connection = True
        try:
            fields, files_list = self._parse_multipart_all()
            if not files_list:
                self._send_json({"error": "कोणतीही PDF फाईल अपलोड केलेली नाही."}, 400)
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "close")
            self.end_headers()

            def send_stream(payload):
                line = (json.dumps(payload, ensure_ascii=False) + "\n").encode("utf-8")
                try:
                    self.wfile.write(line)
                    self.wfile.flush()
                except Exception:
                    pass

            ts = int(time.time() * 1000)
            merged_doc = pymupdf.open()
            total_files = len(files_list)
            total_pages_merged = 0
            merged_files_info = []

            for idx, item in enumerate(files_list, 1):
                raw_name = item["filename"]
                clean_name = "".join(c if (c.isascii() and (c.isalnum() or c in "._- ")) else "_" for c in raw_name)
                temp_path = os.path.join(UPLOAD_DIR, f"merge_{ts}_{idx}_{clean_name}")
                with open(temp_path, "wb") as f:
                    f.write(item["bytes"])

                page_count = 0
                try:
                    src_doc = pymupdf.open(temp_path)
                    page_count = len(src_doc)
                    merged_doc.insert_pdf(src_doc)
                    total_pages_merged += page_count
                    merged_files_info.append({"filename": raw_name, "pages": page_count})
                    src_doc.close()
                except Exception as src_err:
                    send_stream({"type": "progress", "msg": f"⚠️ फाईल {raw_name} वाचताना त्रुटी: {src_err}", "current": idx, "total": total_files, "pct": int((idx / total_files) * 100)})
                finally:
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass

                pct = int((idx / total_files) * 100)
                send_stream({
                    "type": "progress",
                    "current": idx,
                    "total": total_files,
                    "pages_merged": total_pages_merged,
                    "pct": pct,
                    "msg": f"फाईल {idx}/{total_files} जोडली: {raw_name} ({page_count} पाने)"
                })

            send_stream({
                "type": "progress",
                "current": total_files,
                "total": total_files,
                "pages_merged": total_pages_merged,
                "pct": 99,
                "msg": "💾 एकत्रित PDF फाईल सेव्ह करत आहे..."
            })

            if total_pages_merged == 0:
                send_stream({"type": "error", "error": "कोणतीही वैध पाने PDF फाईल्समध्ये सापडली नाहीत किंवा फाईल्स वाचता आल्या नाहीत."})
                return

            out_name = f"merged_pdf_{ts}.pdf"
            out_path = os.path.join(OUTPUT_DIR, out_name)
            merged_doc.save(out_path, garbage=3, deflate=True)
            merged_doc.close()

            done_payload = {
                "type": "done",
                "success": True,
                "file_name": out_name,
                "download_url": f"/outputs/{out_name}",
                "total_files": total_files,
                "total_pages": total_pages_merged,
                "files_info": merged_files_info
            }
            send_stream(done_payload)

        except Exception as e:
            try:
                err_line = (json.dumps({"type": "error", "error": str(e)}, ensure_ascii=False) + "\n").encode("utf-8")
                self.wfile.write(err_line)
                self.wfile.flush()
            except Exception:
                pass

    def _handle_sample(self):
        try:
            from generate_sample_pdf import create_sample_pdf
            sample_name = f"sample_marathi_notice_{int(time.time())}.pdf"
            sample_path = os.path.join(OUTPUT_DIR, sample_name)
            create_sample_pdf(sample_path, num_pages=5)
            self._send_json({
                "success": True,
                "download_url": f"/outputs/{sample_name}",
                "file_name": sample_name
            })
        except Exception as e:
            self._send_json({"error": str(e)}, 500)


def run_server(port=PORT):
    server_address = ("0.0.0.0", port)
    ThreadingHTTPServer.allow_reuse_address = True
    httpd = ThreadingHTTPServer(server_address, PDFReplacerHTTPHandler)
    print(f"\n" + "=" * 60)
    print(f" 🚀 PDF मजकूर संपादक वेब ॲप सुरू झाले आहे (Multi-threaded Live Engine)!")
    print(f" 🌐 तुमच्या ब्राउझरमध्ये ही लिंक उघडा: http://localhost:{port}")
    print(f" 🌐 किंवा: http://127.0.0.1:{port}")
    print("=" * 60 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nसर्व्हर बंद केला.")
        httpd.server_close()


if __name__ == "__main__":
    p = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(p)
