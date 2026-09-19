import urllib.request

urls = [
    "https://raw.githubusercontent.com/google/fonts/main/ofl/lohitmarathi/Lohit-Marathi.ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/lohitdevanagari/Lohit-Devanagari.ttf",
    "https://github.com/google/fonts/raw/main/ofl/lohitmarathi/Lohit-Marathi.ttf",
    "https://github.com/google/fonts/raw/main/ofl/lohitdevanagari/Lohit-Devanagari.ttf",
    "https://raw.githubusercontent.com/fedora-fonts/lohit-marathi-fonts/master/Lohit-Marathi.ttf",
    "https://raw.githubusercontent.com/fedora-fonts/lohit-devanagari-fonts/master/Lohit-Devanagari.ttf",
    "https://github.com/satbyy/marathi-fonts/raw/master/Lohit-Marathi.ttf",
]

for u in urls:
    try:
        print(f"Trying {u}...")
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=10)
        data = res.read()
        if len(data) > 10000:
            with open("Lohit-Marathi.ttf", "wb") as f:
                f.write(data)
            print(f"SUCCESS! Saved Lohit-Marathi.ttf ({len(data)} bytes) from {u}")
            break
    except Exception as e:
        print(f"Failed {u}: {e}")
