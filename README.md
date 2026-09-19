# 📄 मराठी व इंग्रजी PDF मजकूर संपादक (PDF Text Find & Replace)

PDF फाईल्समधील कोणताही मराठी (देवनागरी) किंवा इंग्रजी मजकूर (नाव, पत्ता, तारीख, अधिकारी, नंबर इत्यादी) शोधून बदलण्यासाठी (Find & Replace) हाय-स्पीड प्रोग्रॅम.

---

## 🚀 हे कसे वापरायचे? (३ सोपे पर्याय)

### पर्याय १: डेस्कटॉप अ‍ॅप (GUI - सर्वात सोपा पर्याय)
फक्त **[start_replacer.bat](file:///c:/Users/user/.gemini/antigravity-ide/scratch/pdf/start_replacer.bat)** फाईलवर **डबल-क्लिक (Double Click)** करा.
1. **PDF निवडा**: तुमची PDF फाईल सिलेक्ट करा.
2. **शब्द टाका**: 
   - **Find (जुना शब्द)** आणि **Replace (नवीन शब्द)** भरा व **'➕ नियम जोडा'** दाबा.
   - किंवा **'📂 JSON / CSV लोड करा'** दाबून फाईलमधून सर्व शब्द एकदाच भरा.
3. **पानांची श्रेणी**: सर्व पाने (`all`) किंवा चाचणीसाठी `1-5`.
4. **बदला**: **'⚡ मजकूर बदला (Replace & Save)'** दाबा! 
5. बदल पूर्ण झाल्यावर **'📄 तयार झालेली PDF उघडा'** बटण दाबून त्वरित नवीन PDF तपासा.

---

### पर्याय २: कमांड लाईन (CLI - जलद व बॅच प्रोसेसिंग)

#### १) एका शब्दासाठी:
```powershell
& "$HOME\.local\bin\uv.exe" run --with pymupdf --with tqdm python pdf_text_replacer.py -i "input.pdf" -o "output.pdf" -f "कणकवली" -r "कुडाळ"
```

#### २) ५०-१०० शब्द एकाच वेळी बदलण्यासाठी (JSON किंवा CSV मॅपिंग):
[replacements_sample.json](file:///c:/Users/user/.gemini/antigravity-ide/scratch/pdf/replacements_sample.json) मध्ये शब्द भरा आणि चालवा:
```powershell
& "$HOME\.local\bin\uv.exe" run --with pymupdf --with tqdm python pdf_text_replacer.py -i "input.pdf" -o "output.pdf" -m replacements_sample.json
```

#### ३) फक्त स्कॅन करा (Dry-run - शब्द बदलण्याआधी कुठे व किती आहेत ते मोजणे):
```powershell
& "$HOME\.local\bin\uv.exe" run --with pymupdf --with tqdm python pdf_text_replacer.py -i "input.pdf" -m replacements_sample.json --scan-only
```

#### ४) फक्त ठराविक पानांवर बदल करण्यासाठी:
```powershell
& "$HOME\.local\bin\uv.exe" run --with pymupdf --with tqdm python pdf_text_replacer.py -i "input.pdf" -o "output.pdf" -f "कणकवली" -r "कुडाळ" -p "1-10"
```

---

## 📁 प्रमुख फाईल्स:

| फाईल | वर्णन |
| :--- | :--- |
| 🖱️ **[start_replacer.bat](file:///c:/Users/user/.gemini/antigravity-ide/scratch/pdf/start_replacer.bat)** | १-क्लिक डेस्कटॉप GUI सुरू करणारी फाईल |
| 🖥️ **[pdf_text_replacer_gui.py](file:///c:/Users/user/.gemini/antigravity-ide/scratch/pdf/pdf_text_replacer_gui.py)** | ग्राफिकल यूजर इंटरफेस (Desktop App) |
| ⚡ **[pdf_text_replacer.py](file:///c:/Users/user/.gemini/antigravity-ide/scratch/pdf/pdf_text_replacer.py)** | हाय-स्पीड कोर रिप्लेसमेंट इंजिन (CLI व लायब्ररी) |
| 📋 **[replacements_sample.json](file:///c:/Users/user/.gemini/antigravity-ide/scratch/pdf/replacements_sample.json)** | बदलण्याचे नियम (JSON फॉरमॅट) |
| 📊 **[replacements_sample.csv](file:///c:/Users/user/.gemini/antigravity-ide/scratch/pdf/replacements_sample.csv)** | बदलण्याचे नियम (CSV फॉरमॅट) |
| 🧪 **[generate_sample_pdf.py](file:///c:/Users/user/.gemini/antigravity-ide/scratch/pdf/generate_sample_pdf.py)** | चाचणीसाठी नमुना PDF तयार करणारी स्क्रिप्ट |

---

## 💡 महत्त्वाच्या टिप्स:
1. **चाचणी (Testing)**: मोठ्या फाईलवर प्रोसेस करण्यापूर्वी प्रथम `-p "1-5"` देऊन ५ पानांवर आउटपुट तपासून घ्या.
2. **देवनागरी फॉन्ट**: विंडोज मधील `Nirmala UI` आणि `Mangal` फॉन्टचा वापर करून मराठी अक्षरांचे काना, मात्रा, वेलांटी, जोडाक्षरे अचूक ठेवली जातात.
3. **स्कॅन मोड**: प्रत्यक्ष बदल करण्याआधी `--scan-only` किंवा GUI मधील **'🔍 फक्त स्कॅन करा'** बटण वापरून शब्द सापडत आहेत का याची खात्री करता येते.
