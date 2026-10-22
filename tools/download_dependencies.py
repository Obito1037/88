from pathlib import Path
import urllib.request, json, hashlib

root = Path(__file__).resolve().parents[1]
target = root / '工作记录' / '字体原始'
target.mkdir(parents=True, exist_ok=True)
items = {
    'SourceHanSerifSC-Regular.otf': 'https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/OTF/SimplifiedChinese/SourceHanSerifSC-Regular.otf',
    'SourceHanSerif-OFL.txt': 'https://raw.githubusercontent.com/adobe-fonts/source-han-serif/master/LICENSE.txt',
    'LXGWWenKai-Regular.ttf': 'https://raw.githubusercontent.com/lxgw/LxgwWenKai/main/fonts/TTF/LXGWWenKai-Regular.ttf',
    'LXGWWenKai-OFL.txt': 'https://raw.githubusercontent.com/lxgw/LxgwWenKai/main/OFL.txt',
}
records = []
for name, url in items.items():
    dest = target / name
    try:
        if not dest.exists():
            req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=120) as response:
                dest.write_bytes(response.read())
        records.append({'name':name,'url':url,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
        print(name, dest.stat().st_size)
    except Exception as e:
        records.append({'name':name,'url':url,'error':str(e)})
        print(name, str(e))
(target/'来源.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
