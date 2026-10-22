from pathlib import Path
import sys, base64, shutil, json
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'tools/python_packages'))
from fontTools import subset
from fontTools.ttLib import TTFont
site=root/'交付/八十八个地名_交付包/01_作品及成果文件/八十八个地名'
src=root/'工作记录/字体原始'
text=''.join(p.read_text(encoding='utf-8-sig') for p in site.rglob('*') if p.suffix in ['.js','.html','.css','.txt'] and p.name!='fonts.css')
text+=''.join(chr(i) for i in range(32,127))+'北京上海广州深圳成都武汉西安南京杭州濉溪陶障区中国年月日致敬记住这条路接过这份记忆'
css=[]
records=[]
for filename,name,lic in [('SourceHanSerifSC-Regular.otf','BambooSerif','SourceHanSerif-OFL.txt'),('LXGWWenKai-Regular.ttf','BambooKai','LXGWWenKai-OFL.txt')]:
    font=TTFont(src/filename)
    opt=subset.Options(); opt.flavor='woff2'; opt.layout_features=['*']; opt.name_IDs=['*'];opt.name_legacy=True;opt.name_languages=['*']
    worker=subset.Subsetter(options=opt);worker.populate(text=text);worker.subset(font)
    for item in font['name'].names:
        if item.nameID in [1,3,4,6,16,17]:
            replacement=name+(' Regular' if item.nameID in [4] else '')
            item.string=replacement.encode(item.getEncoding())
    font.flavor='woff2'
    out=src/(name+'.woff2');font.save(out)
    data=base64.b64encode(out.read_bytes()).decode()
    css.append('@font-face{font-family:"'+name+'";src:url(data:font/woff2;base64,'+data+') format("woff2");font-weight:100 900;font-display:swap;}')
    (site/'licenses').mkdir(exist_ok=True)
    shutil.copyfile(src/lic,site/'licenses'/lic)
    records.append({'family':name,'file':filename,'subsetBytes':out.stat().st_size,'license':lic,'note':'为本作固定文案子集化；用户输入地名使用系统字体回退。保留原版权和许可，子集字体已改名。'})
css.append('body{font-family:"BambooSerif","Songti SC","SimSun",serif;} h1,h2,.hero-title,.scene-title{font-family:"BambooSerif","Songti SC","SimSun",serif;} .carve-text,.bamboo-word{font-family:"BambooKai","KaiTi",serif;}')
(site/'css/fonts.css').write_text('\n'.join(css),encoding='utf-8')
(root/'工作记录/字体处理.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
