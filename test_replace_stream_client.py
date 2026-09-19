import sys
import urllib.request
import json
import uuid

sys.stdout.reconfigure(encoding='utf-8')

with open("sample_test.pdf", "rb") as f:
    pdf_bytes = f.read()

boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
body = bytearray()

body.extend(f'--{boundary}\r\n'.encode('ascii'))
body.extend(b'Content-Disposition: form-data; name="file"; filename="test_auto_dl.pdf"\r\n')
body.extend(b'Content-Type: application/pdf\r\n\r\n')
body.extend(pdf_bytes)
body.extend(b'\r\n')

rules_json = json.dumps({"मतदार नोंदणी अधिकारी": "सहाय्यक मतदार नोंदणी अधिकारी", "ERO": "AERO"})
body.extend(f'--{boundary}\r\n'.encode('ascii'))
body.extend(b'Content-Disposition: form-data; name="rules"\r\n\r\n')
body.extend(rules_json.encode('utf-8'))
body.extend(b'\r\n')

body.extend(f'--{boundary}\r\n'.encode('ascii'))
body.extend(b'Content-Disposition: form-data; name="pages"\r\n\r\n')
body.extend(b'1-2\r\n')

body.extend(f'--{boundary}--\r\n'.encode('ascii'))

req = urllib.request.Request("http://localhost:8080/api/replace_stream", data=bytes(body), headers={
    "Content-Type": f"multipart/form-data; boundary={boundary}"
})

res = urllib.request.urlopen(req)
print("Replace stream status:", res.status)

for line in res:
    line_str = line.decode('utf-8').strip()
    if line_str:
        obj = json.loads(line_str)
        print("STREAM EVENT:", obj.get("type"), "| Msg:", obj.get("msg", ""), "| File:", obj.get("file_name", ""))
