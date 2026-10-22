from pathlib import Path
import json, subprocess, os, shutil, sys
from PIL import Image, ImageOps, ImageDraw
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'交付'
manifest=json.loads((OUT/'八十八个地名_交付包'/'工作记录'/'documents-manifest.json').read_text(encoding='utf-8'))
runtime=Path(os.environ.get('USERPROFILE',''))/'.cache'/'codex-runtimes'/'codex-primary-runtime'
poppler=os.environ.get('PDFTOPPM') or shutil.which('pdftoppm') or str(runtime/'dependencies'/'native'/'poppler'/'Library'/'bin'/'pdftoppm.exe')
qa=ROOT/'tmp'/'pdf-review'; qa.mkdir(parents=True,exist_ok=True)
rendered=[]
for n,item in enumerate(manifest):
    if len(sys.argv)>1 and str(n+1) not in sys.argv[1:]: continue
    dest=qa/f'doc-{n+1:02d}'; dest.mkdir(exist_ok=True)
    prefix=dest/'page'
    subprocess.run([str(poppler),'-r','110','-png',str(OUT/item['path']),str(prefix)],check=True,stdout=subprocess.DEVNULL)
    files=sorted(dest.glob('page-*.png'),key=lambda p:int(p.stem.split('-')[-1]))
    assert len(files)==item['pages'],(item['path'],len(files),item['pages'])
    for p in files: rendered.append((n+1,item['path'],p))
for start in range(0,len(rendered),4):
    sheet=Image.new('RGB',(1056,1512),'#cccccc'); draw=ImageDraw.Draw(sheet)
    for slot,(doc,name,path) in enumerate(rendered[start:start+4]):
        im=Image.open(path).convert('RGB'); im.thumbnail((512,724))
        x=8+(slot%2)*528; y=26+(slot//2)*756
        sheet.paste(im,(x,y)); draw.text((x,y-18),f'Document {doc} / {path.stem}',fill='black')
    sheet.save(qa/f'contact-{start//4+1:02d}.jpg',quality=90)
print('Rendered pages:',len(rendered),'Contact sheets:',(len(rendered)+3)//4)
