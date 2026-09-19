import urllib.request
import urllib.parse
import json
import io
import mimetypes

# Let's test calling /api/sample first
sample_req = urllib.request.Request("http://localhost:8080/api/sample", data=b"{}", headers={"Content-Type": "application/json"})
sample_res = urllib.request.urlopen(sample_req)
sample_data = json.loads(sample_res.read().decode("utf-8"))
print("Sample response:", sample_data)

# Test downloading the sample
dl_url = f"http://localhost:8080/api/download?file={sample_data['file_name']}"
dl_res = urllib.request.urlopen(dl_url)
print("Download status:", dl_res.status, "Length:", len(dl_res.read()), "Headers:", dl_res.headers.get("Content-Disposition"))
