"""Package public deliverables only; source uploads and local dependencies stay excluded."""
from pathlib import Path
import json, hashlib, zipfile

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'交付'
PACK=OUT/'八十八个地名_交付包'
SITE=PACK/'01_作品及成果文件'/'八十八个地名'
# Stable text bytes keep the published SHA256 ledger valid after a Git checkout.
for p in OUT.rglob('*'):
    if p.is_file() and p.suffix in {'.txt','.md','.json','.js','.css','.html'}:
        text=p.read_text(encoding='utf-8-sig')
        p.write_bytes(('\n'.join(line.rstrip() for line in text.splitlines()).rstrip()+'\n').encode('utf-8'))
qa=json.loads((PACK/'工作记录/qa-report.json').read_text(encoding='utf-8'))
extra=json.loads((PACK/'工作记录/acceptance-extra.json').read_text(encoding='utf-8'))
assert all(x['passed'] for x in qa['results']+extra['results']), 'Fix failed browser checks first'
assert len(list((OUT/'单独上传/作品截图').glob('*.png')))<=10
assert (OUT/'单独上传/作品演示视频_审核版.mp4').is_file()
site_size=sum(p.stat().st_size for p in SITE.rglob('*') if p.is_file())
assert site_size<150*1024*1024
readme='''八十八个地名｜交付审核版

开始体验：完整解压后，双击
八十八个地名_交付包/01_作品及成果文件/八十八个地名/index.html
不需要安装开发环境，不需要网络。建议桌面Chrome或Edge。

本次交付：九段离线交互网页、全部源代码、4张AI场景图、内嵌授权字体、
9份PDF、10张实际运行截图、实际运行快览、4分40秒字幕演示视频、
系统填报稿、评审视频脚本、12页PPT文字提纲、公开过程与验收记录。
PPT文件未生成；演示视频已提供。视频没有音轨；网页音效为程序合成。

自动化实测：Chrome/Edge共84项检查通过，含中文与空格路径、离线、
六核心操作、海报导出、键盘、手机触屏仿真、1366/1920桌面布局。
原速自动快览已真实运行并录制。网页无脚本错误、无自动联网请求。
这些是机器浏览器检查，不是团队人工试用或另一台真实电脑验收。

人工待办：史料逐条复核与截图、团队读稿改写、竹竿实拍、真人配音、
图像后期、音画同步、真人体验、另一台电脑离线复测、报名及承诺书盖章。
详见“团队接手手册.pdf”。不得把AI已完成工作记作学生亲手贡献。

归档区别：
八十八个地名_审核交付.zip 包含全部交付材料，适合保存和团队接手。
八十八个地名_作品材料包.zip 仅含作品与成果材料目录，供最终人工改定后使用。
“单独上传”中的演示视频和截图可按报名系统要求分别上传。
当前是审核版，未替团队完成正式参赛审核或提交。
'''
(OUT/'00_先读我.txt').write_bytes(readme.encode('utf-8'))
checks=[]
definitions=[
('T01','通过','Chrome中文及空格路径file://全九段，见acceptance-extra.json'),
('T02','通过','Edge中文及空格路径file://全九段，见acceptance-extra.json'),
('T03','通过','浏览器offline上下文与外网拦截；本地完整运行'),
('T04','通过','两组自动化检查均零脚本与控制台错误'),
('T05','通过','长按/键盘与点击替代，手机触屏仿真均完成六核心操作'),
('T06','通过','真实等待15.5秒后提示显示'),
('T07','通过','目录任意跳转、下一幕、Esc；手机底部目录常驻'),
('T08','通过','180秒模式按原速走过九段并结束，留实际MP4'),
('T09','通过','Chrome/Edge实际下载PNG，尺寸1080x1920；视觉检查海报'),
('T10','待团队','已有各幕旁白文字，尚无真人音频，不能验证音画误差<0.5秒'),
('T11','通过','未开始不创建AudioContext；点击开始解锁；静音状态切换'),
('T12','通过（仿真范围）','1366/1920九幕无横向溢出；390手机仿真操作可走通、导航不遮挡底部按钮'),
('T13','通过','正式AI场景图已替换素材位，无未完成场景；输入提示属于正常表单'),
('T14','通过','上屏事实S编号均有效，地名可打开来源层；史料仍待团队核验'),
('T15','通过','4张AI图角标与WebP XMP trainedAlgorithmicMedia保留'),
('T16','通过','关于页具来源、AI、资源许可和路线示意说明'),
('T17','通过（已有身份范围）','未录入参赛学校/团队/成员/导师；文档作者为空；原始资料不打包'),
('T18','通过（AI视觉检查）','四张场景图已查看，无写实真实人物面孔、旗帜或徽章；均标艺术示意'),
('T19','通过','无得分/排名/通关玩法与血腥画面'),
('T20','通过（本机测量）',f'作品目录{site_size/1024/1024:.2f}MiB；Chrome三次176–187ms，Edge264–349ms至字体就绪'),
('T21','待团队','尚未在另一台没有开发环境的真实电脑上复测')]
checks=[{'id':i,'status':s,'evidence':e} for i,s,e in definitions]
report={'build':'1.0-review','browserChecks':len(qa['results'])+len(extra['results']),'siteBytes':site_size,'formalSubmissionReady':False,'acceptance':checks,'note':'通过仅限已记录的自动化和AI检查范围。T10/T21及团队人工贡献仍需真实完成。'}
(PACK/'工作记录/交付验收.json').write_bytes(json.dumps(report,ensure_ascii=False,indent=2).encode('utf-8'))
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
files=[p for p in OUT.rglob('*') if p.is_file() and p.suffix!='.zip' and p.name not in ['交付文件清单.json','归档校验.txt']]
manifest=[{'path':p.relative_to(OUT).as_posix(),'bytes':p.stat().st_size,'sha256':digest(p)} for p in sorted(files)]
(OUT/'交付文件清单.json').write_bytes(json.dumps(manifest,ensure_ascii=False,indent=2).encode('utf-8'))
archives=[]
for name,paths,base in [('八十八个地名_审核交付.zip',files+[OUT/'交付文件清单.json'],OUT),('八十八个地名_作品材料包.zip',[p for p in PACK.rglob('*') if p.is_file()],OUT)]:
    target=OUT/name
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(paths):z.write(p,p.relative_to(base).as_posix())
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        for i in z.infolist():assert not i.filename.startswith('/') and '..' not in Path(i.filename).parts
    archives.append(f'{digest(target)}  {name}  ({target.stat().st_size} bytes)')
(OUT/'归档校验.txt').write_bytes(('\n'.join(archives)+'\n').encode('utf-8'))
print(json.dumps({'files':len(manifest),'checks':report['browserChecks'],'siteMiB':round(site_size/1024/1024,2),'archives':archives},ensure_ascii=False))
