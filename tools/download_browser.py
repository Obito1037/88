from pathlib import Path
import urllib.request, zipfile
root=Path(__file__).resolve().parents[1]
out=root/'tools/browsers/chromium-1234'
out.mkdir(parents=True,exist_ok=True)
archive=root/'tools/browser.zip'
urls=['https://storage.googleapis.com/chrome-for-testing-public/151.0.7922.34/win64/chrome-win64.zip','https://cdn.playwright.dev/builds/cft/151.0.7922.34/win64/chrome-win64.zip']
for url in urls:
    try:
        print('Downloading',url,flush=True)
        urllib.request.urlretrieve(url,archive)
        with zipfile.ZipFile(archive) as z:
            for info in z.infolist():
                if not (out/info.filename).resolve().is_relative_to(out.resolve()): raise ValueError('unsafe archive')
            z.extractall(out)
        print('Saved',out,flush=True)
        break
    except Exception as e: print(type(e).__name__,str(e),flush=True)
else: raise RuntimeError('Unable to download browser')
