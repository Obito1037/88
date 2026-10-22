/* Requires playwright and FFmpeg; video source is the actual browser recording. */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'tmp/qa'),work=path.join(qa,'video-build');fs.mkdirSync(work,{recursive:true});
const pack=path.join(root,'交付/八十八个地名_交付包'),site=path.join(pack,'01_作品及成果文件/八十八个地名');
const output=path.join(pack,'02_作品展示视频');fs.mkdirSync(output,{recursive:true});
const ff=process.env.FFMPEG_PATH||path.join(__dirname,'python_packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const chrome=process.env.BROWSER_PATH||path.join(__dirname,'browsers/chromium-1234/chrome-win64/chrome.exe');
const cards=[
 ['八十八个地名','一根竹竿上的淮海支前路',['九段叙事 · 六个交互 · 本地离线运行','以下为实际网页运行录屏','审核版 / 无真人配音，保留可读字幕'],10],
 ['史料，留在每一幕。','事实可以追溯，差异需要保留。',['上屏事实附来源编号；点击即可查看本地说明','10个名称选自报道列举，非完整88地名清单','543个光点对应543万人次，非独立个人名单','收藏地、完整路线等差异保留在核验记录'],30],
 ['如实说明，如何完成。','文字、代码和4张插图使用AI辅助。',['场景图为艺术示意，保留AI标识和元数据','声音为程序合成操作提示；本录屏不含音频','字体按SIL OFL许可使用，授权文本随包提供','海报纯Canvas本地生成，输入不上网、不保存'],25],
 ['交付审核版，交给团队继续。','技术交付与参赛审核，是不同的完成状态。',['已经提供：网页、源码、文档、截图、运行录屏','仍需亲手完成：史料复核、实拍、真人配音和后期','仍需实际开展：另一台电脑复测、同学体验与改稿','报名、承诺书、盖章和最终提交由团队完成'],33]
];
function run(args){const r=cp.spawnSync(ff,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||'ffmpeg failed');}
async function main(){
 const info=JSON.parse(fs.readFileSync(path.join(qa,'video-result.json'),'utf8')),source=path.join(root,info.video);
 const b=await chromium.launch({headless:true,executablePath:chrome}),p=await b.newPage({viewport:{width:1920,height:1080}});
 const fonts=fs.readFileSync(path.join(site,'css/fonts.css'),'utf8');
 for(let i=0;i<cards.length;i++){
  const [title,sub,lines]=cards[i];await p.setContent('<html lang="zh-CN"><head><meta charset="UTF-8"><style>'+fonts+'html,body{margin:0;width:1920px;height:1080px;background:#efe6d2;color:#1c1a17}main{padding:110px 140px}small{font:24px sans-serif;letter-spacing:5px;color:#8b352b}h1{font-size:100px;margin:70px 0 25px;font-weight:400}h2{font-size:38px;font-weight:400;margin:0 0 65px;color:#6b5d46}p{font-size:31px;line-height:1.7;margin:20px 0;border-left:4px solid #b3261e;padding-left:28px}.foot{position:absolute;bottom:55px;left:140px;right:140px;border-top:1px solid #b9aa8b;padding-top:20px;font:22px sans-serif;display:flex;justify-content:space-between}</style></head><body><main><small>交互叙事作品 / 交付审核版</small><h1>'+title+'</h1><h2>'+sub+'</h2>'+lines.map(x=>'<p>'+x+'</p>').join('')+'</main><div class="foot"><span>八十八个地名 · AI辅助创作已披露</span><span>2026.10.22</span></div></body></html>');await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(work,'card-'+i+'.png')});
 }
 await b.close();
 const common=['-an','-vf','fps=25,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','23','-movflags','+faststart'];
 const demo=path.join(output,'作品快览_实际运行_无配音.mp4');run(['-i',source,...common,'-metadata','comment=Actual offline browser recording; no audio captured; AI-assisted review build',demo]);console.log('Encoded actual demo');
 const reviewDemo=path.join(work,'demo.mp4');run(['-ss','2.5','-i',source,'-t','182','-vf','tpad=stop_mode=clone:stop_duration=3,fps=25,format=yuv420p','-an','-c:v','libx264','-preset','veryfast','-crf','23',reviewDemo]);
 for(let i=0;i<cards.length;i++){run(['-loop','1','-framerate','25','-i',path.join(work,'card-'+i+'.png'),'-t',String(cards[i][3]),...common,path.join(work,'card-'+i+'.mp4')]);console.log('Encoded card '+i);}
 const pieces=['card-0.mp4','demo.mp4','card-1.mp4','card-2.mp4','card-3.mp4'];fs.writeFileSync(path.join(work,'concat.txt'),pieces.map(x=>"file '"+x+"'").join('\n'));
 const review=path.join(root,'交付/单独上传/作品演示视频_审核版.mp4');run(['-f','concat','-safe','1','-i',path.join(work,'concat.txt'),'-c','copy','-movflags','+faststart','-metadata','title=八十八个地名 交付审核版','-metadata','comment=Actual browser demo with explanatory title cards; silent; AI assistance disclosed',review]);
 const manifest={createdAt:new Date().toISOString(),files:[{path:path.relative(root,demo).replace(/\\/g,'/'),width:1920,height:1080,audio:false,kind:'实际网页全程快览录屏'},{path:path.relative(root,review).replace(/\\/g,'/'),width:1920,height:1080,durationSeconds:280,audio:false,kind:'真实网页快览加说明字幕卡；未制作真人配音'}],note:'视频不冒充人工拍摄或历史影像；插图艺术示意与AI属性保留在界面中。'};
 fs.writeFileSync(path.join(pack,'工作记录/video-manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
