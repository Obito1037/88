/* npm install playwright; optional BROWSER_PATH / EDGE_PATH / NODE_PATH. */
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const pack=path.join(root,'交付/八十八个地名_交付包');
const site=path.join(pack,'01_作品及成果文件/八十八个地名');
const qa=path.join(root,'tmp/qa');
const screenshots=path.join(root,'交付/单独上传/作品截图');
for(const p of [qa,screenshots])fs.mkdirSync(p,{recursive:true});
const chrome=process.env.BROWSER_PATH||path.join(__dirname,'browsers/chromium-1234/chrome-win64/chrome.exe');
const edge=process.env.EDGE_PATH||path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe');
const url=pathToFileURL(path.join(site,'index.html')).href;
let results=[],errors=[],requests=[];
function check(name,passed,detail){results.push({name,passed:!!passed,detail});console.log((passed?'PASS ':'FAIL ')+name+(detail?' '+detail:''));}
async function setup(browser,options={}){
 const c=await browser.newContext({viewport:{width:1920,height:1080},acceptDownloads:true,...options});
 await c.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort();});
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(url);await p.evaluate(()=>document.fonts.ready);return{c,p};
}
async function state(p){return p.evaluate(()=>APP.getState());}
async function shot(p,n,name){await p.screenshot({path:path.join(screenshots,String(n).padStart(2,'0')+'_'+name+'.png')});}
async function go(p,i){await p.evaluate(i=>APP.goTo(i),i);await p.waitForTimeout(200);}
async function smoke(){
 const browser=await chromium.launch({headless:true,executablePath:chrome});
 const {c,p}=await setup(browser);check('Chrome离线入口',await p.title()==='八十八个地名 · 一根竹竿上的淮海支前路',await browser.version());
 await shot(p,1,'封面');await p.click('#start-btn');await p.locator('#primary-action').focus();
 await p.keyboard.down(' ');await p.waitForTimeout(1000);await p.keyboard.up(' ');const partial=(await state(p)).progress[0];await p.waitForTimeout(250);
 check('刻字中断保留进度',partial>0.15&&partial<0.6&&(await state(p)).progress[0]===partial,partial.toFixed(3));
 await p.keyboard.down(' ');await p.waitForTimeout(2300);await p.keyboard.up(' ');check('刻字累计三秒完成',(await state(p)).progress[0]===1);await shot(p,2,'刻');
 await go(p,1);await p.click('#primary-action');check('装车反馈',(await state(p)).progress[1]===1);await shot(p,3,'出发');
 await go(p,2);await p.locator('#primary-action').focus();const pushStart=Date.now();await p.keyboard.down('ArrowRight');await p.waitForTimeout(29000);await p.keyboard.up('ArrowRight');
 check('推车五节点四十秒内完成',(await state(p)).progress[2]===1&&Date.now()-pushStart<40000,Math.round((Date.now()-pushStart)/1000)+'秒');check('推车五节点均点亮',await p.locator('.route-point.lit').count()===5);await shot(p,4,'推');
 await go(p,3);await p.keyboard.press('a');check('首次推行动作',(await state(p)).together===1);await p.keyboard.press('l');check('第二次协作十二只手',await p.locator('.hand.joined').count()===12);await shot(p,5,'一起推');
 await go(p,4);await p.locator('#light-slider').focus();await p.keyboard.press('Home');for(let i=0;i<9;i++)await p.keyboard.press('ArrowRight');check('键盘侧光读十地名',(await state(p)).read.length===10);await shot(p,6,'读');
 await p.locator('[data-place="9"]').click();check('地名来源弹窗',await p.locator('#info-dialog').evaluate(e=>e.open)&&await p.locator('#source-S01').count()===1);await p.keyboard.press('Escape');check('弹窗Esc关闭',!await p.locator('#info-dialog').evaluate(e=>e.open));
 await go(p,5);for(let i=0;i<4;i++)await p.click('#primary-action');check('543点与统计同屏',(await state(p)).dots===543&&(await p.locator('#dot-stat').innerText()).includes('88.1'));await shot(p,7,'数');
 await go(p,6);await shot(p,8,'文物');
 await go(p,7);await p.click('#poster-generate');check('空地名校验',(await p.locator('#place-validation').innerText()).includes('请先'));
 await p.fill('#place-input','一二三四五六七八九十');check('地名限制八字符',Array.from(await p.inputValue('#place-input')).length===8);
 await p.fill('#place-input','濉溪');await p.click('#poster-generate');const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#poster-download')]);await dl.saveAs(path.join(qa,'poster.png'));
 const buf=fs.readFileSync(path.join(qa,'poster.png'));check('海报本地PNG下载1080x1920',buf.readUInt32BE(16)===1080&&buf.readUInt32BE(20)===1920);check('仅三个固定寄语',await p.locator('#tribute-select option').count()===3);await shot(p,9,'留');
 await go(p,8);await shot(p,10,'尾声');await p.click('#about-btn');check('AI与声音披露',(await p.locator('#dialog-body').innerText()).includes('程序合成'));await p.click('#dialog-close');
 await go(p,0);await p.click('#subtitle-btn');check('字幕开关',await p.locator('#narration').isHidden());await p.click('#subtitle-btn');await p.click('#mute-btn');check('静音状态',(await state(p)).muted);await p.click('#mute-btn');
 await p.waitForTimeout(15500);check('十五秒无操作提示',await p.locator('#idle-hint').isVisible());await p.keyboard.press('Escape');check('Esc跳过',(await state(p)).index===1);
 await p.locator('[data-scene="7"]').click();check('目录自由跳转',(await state(p)).index===7);
 await p.evaluate(()=>APP.setDemoInterval(300));await p.click('#home-btn');await p.click('#demo-btn');await p.waitForFunction(()=>APP.getState().paused&&APP.getState().index===8);check('快览九段自动完成',(await state(p)).visited.length===9);
 await c.close();
 const mobile=await setup(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});await mobile.p.click('#start-btn');let over=[];
 for(let i=0;i<9;i++){await go(mobile.p,i);if(await mobile.p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))over.push(i);}
 check('390像素手机九段无横向溢出',over.length===0,JSON.stringify(over));await go(mobile.p,7);await mobile.p.screenshot({path:path.join(qa,'mobile-poster.png'),fullPage:true});await mobile.c.close();
 const reduced=await setup(browser,{reducedMotion:'reduce',viewport:{width:1366,height:768}});await go(reduced.p,5);await reduced.p.click('#alternate-action');check('减少动效保留543点',(await state(reduced.p)).dots===543);await reduced.p.screenshot({path:path.join(qa,'reduced-dots.png')});await reduced.c.close();await browser.close();
 const eb=await chromium.launch({headless:true,executablePath:edge});const ep=await setup(eb,{viewport:{width:1366,height:768}});await ep.p.click('#start-btn');await ep.p.click('#alternate-action');await go(ep.p,7);await ep.p.fill('#place-input','南京');await ep.p.click('#poster-generate');const [ed]=await Promise.all([ep.p.waitForEvent('download'),ep.p.click('#poster-download')]);await ed.saveAs(path.join(qa,'edge-poster.png'));
 check('Edge离线操作与海报导出',fs.statSync(path.join(qa,'edge-poster.png')).size>10000,await eb.version());await ep.p.screenshot({path:path.join(qa,'edge-desktop.png')});await ep.c.close();await eb.close();
 check('运行期间无自动外网请求',requests.length===0,requests.length);check('浏览器无脚本或控制台错误',errors.length===0,errors.join('; '));
 const report={testedAt:new Date().toISOString(),method:'自动化浏览器实际打开file://；不是团队真人试用',results,errors,requests,pending:['团队人工逐条史料核验与截图','真人配音、后期及音画验收','另一台真实电脑离线复测','报名、承诺书与盖章','真实用户可用性反馈']};
 fs.writeFileSync(path.join(pack,'工作记录/qa-report.json'),JSON.stringify(report,null,2));if(results.some(r=>!r.passed))process.exitCode=1;
}
async function record(){
 const b=await chromium.launch({headless:true,executablePath:chrome});const{c,p}=await setup(b,{recordVideo:{dir:path.join(qa,'video'),size:{width:1920,height:1080}}});
 await p.waitForTimeout(2500);await p.click('#demo-btn');console.log('RECORD 9 scenes / 180 seconds started');
 for(let i=1;i<9;i++){await p.waitForFunction(i=>APP.getState().index>=i,i,{timeout:35000});console.log('RECORD scene '+(i+1));}
 await p.waitForFunction(()=>APP.getState().paused,null,{timeout:35000});await p.waitForTimeout(1500);check('三分钟原速快览实际录屏',(await state(p)).index===8&&errors.length===0);
 const v=p.video();await c.close();const out=await v.path();await b.close();fs.writeFileSync(path.join(qa,'video-result.json'),JSON.stringify({video:path.relative(root,out).replace(/\\/g,'/'),width:1920,height:1080,hasAudio:false,note:'实际运行快览；浏览器自动录屏不捕获音频。'},null,2));console.log(out);
}
(process.argv.includes('--record')?record():smoke()).catch(e=>{console.error(e);process.exitCode=1;});
