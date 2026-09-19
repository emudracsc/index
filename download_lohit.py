import urllib.request
import re
import tarfile
import zipfile
import io
import os

url = 'https://releases.pagure.org/lohit/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'href=[\"\'](lohit-marathi[^\"]*\.tar\.gz)[\"\']', html)
print('Found archives:', matches)

if matches:
    latest = sorted(matches)[-1]
    archive_url = f"https://releases.pagure.org/lohit/{latest}"
    print(f"Downloading from {archive_url}...")
    data = urllib.request.urlopen(urllib.request.Request(archive_url, headers={'User-Agent': 'Mozilla/5.0'})).read()
    
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        for member in tar.getmembers():
            if member.name.endswith(".ttf"):
                print(f"Extracting {member.name}...")
                f = tar.extractfile(member)
                if f:
                    content = f.read()
                    with open("Lohit-Marathi.ttf", "wb") as out_ttf:
                        out_ttf.write(content)
                    print(f"Successfully saved Lohit-Marathi.ttf ({len(content)} bytes)!")
