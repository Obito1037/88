/* Supplementary actual browser acceptance. Requires playwright through NODE_PATH. */
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const pack=path.join(root,'交付','八十八个地名_交付包');
const site=path.join(pack,'01_作品及成果文件','八十八个地名');
const copied=path.join(root,'tmp','验收 含空格','八十八个地名');
const qa=path.join(root,'tmp','qa');
const reportFile=path.join(pack,'工作记录','acceptance-extra.json');
const chrome=process.env.BROWSER_PATH||path.join(__dirname,'browsers','chromium-1234','chrome-win64','chrome.exe');
const edge=process.env.EDGE_PATH||path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft','Edge','Application','msedge.exe');
fs.mkdirSync(copied,{recursive:true});
fs.mkdirSync(qa,{recursive:true});
fs.mkdirSync(path.dirname(reportFile),{recursive:true});
fs.cpSync(site,copied,{recursive:true,force:true});
const url=pathToFileURL(path.join(copied,'index.html')).href;
const results=[],errors=[],requests=[],versions={};
function check(name,passed,detail){const item={name,passed:!!passed,detail:detail===undefined?null:detail};results.push(item);console.log((passed?'PASS ':'FAIL ')+name+' '+(typeof detail==='string'?detail:detail===undefined?'':JSON.stringify(detail)));}
async function getState(p){return p.evaluate(()=>APP.getState());}
async function context(browser,options={}){
 const c=await browser.newContext({viewport:{width:1366,height:768},acceptDownloads:true,offline:true,...options});
 await c.route(/^https?:/,r=>{requests.push(r.request().url());return r.abort();});
 await c.addInitScript(()=>{
  window.__audioCreated=0;
  const Native=window.AudioContext||window.webkitAudioContext;
  if(Native){const Wrapped=function(){window.__audioCreated++;return Reflect.construct(Native,Array.from(arguments));};Wrapped.prototype=Native.prototype;window.AudioContext=Wrapped;if(window.webkitAudioContext)window.webkitAudioContext=Wrapped;}
 });
 const p=await c.newPage();
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 return{c,p};
}
async function load(p){const before=Date.now();await p.goto(url);await p.evaluate(()=>document.fonts.ready);return Date.now()-before;}
async function nav(p,i,touch=false){const locator=p.locator('[data-scene="'+i+'"]');if(touch)await locator.tap();else await locator.click();await p.waitForTimeout(70);}
async function interactNine(browser,name){
 const{c,p}=await context(browser);await load(p);
 check(name+'中文与空格路径file入口',p.url().startsWith('file:')&&await p.title()==='八十八个地名 · 一根竹竿上的淮海支前路',path.relative(root,copied));
 check(name+'未开始不创建AudioContext',await p.evaluate(()=>window.__audioCreated===0));
 await p.click('#start-btn');check(name+'点击开始创建AudioContext',await p.evaluate(()=>window.__audioCreated===1));
 for(let i=0;i<9;i++){
  await nav(p,i);
  if([0,2,4,5].includes(i)){await p.click('#alternate-action');check(name+'第'+i+'幕点击替代完成',(await getState(p)).progress[i]===1);}
  if(i===1){await p.click('#primary-action');check(name+'装车完成',(await getState(p)).progress[i]===1);}
  if(i===3){await p.click('#alternate-action');check(name+'协作点击替代12手',await p.locator('.hand.joined').count()===12);}
  if(i===6){await p.click('#primary-action');check(name+'文物来源可读',await p.locator('#info-dialog').evaluate(e=>e.open)&&await p.locator('.source-entry').count()>=1);await p.click('#dialog-close');}
  if(i===7){await p.fill('#place-input','濉溪');await p.click('#poster-generate');const[download]=await Promise.all([p.waitForEvent('download'),p.click('#poster-download')]);await download.saveAs(path.join(qa,name+'-copied-poster.png'));const buf=fs.readFileSync(path.join(qa,name+'-copied-poster.png'));check(name+'复制路径海报真实导出',buf.readUInt32BE(16)===1080&&buf.readUInt32BE(20)===1920);}
  if(i===8){await p.click('#credits-sources');check(name+'尾声总来源可读',await p.locator('.source-entry').count()===12);await p.click('#dialog-close');}
 }
 check(name+'九段自由目录全部走过',(await getState(p)).visited.length===9);
 for(const size of [{width:1366,height:768},{width:1920,height:1080}]){
  await p.setViewportSize(size);let overflow=[];
  for(let i=0;i<9;i++){await nav(p,i);const dims=await p.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));if(dims.width>dims.viewport+1)overflow.push({scene:i,...dims});}
  check(name+' '+size.width+'x'+size.height+'九幕无横向溢出',overflow.length===0,overflow);
 }
 await c.close();
 const cold=[];for(let i=0;i<3;i++){const test=await context(browser);cold.push(await load(test.p));await test.c.close();}
 check(name+'三次新上下文冷加载至字体就绪小于3秒',cold.every(ms=>ms<3000),{milliseconds:cold,method:'每次新浏览器上下文，测goto至document.fonts.ready；本机自动化测量'});
}
async function keyboardAndDemo(browser){
 const{c,p}=await context(browser);await load(p);
 const skipHidden=await p.locator('.skip-link').evaluate(e=>getComputedStyle(e).opacity==='0');await p.keyboard.press('Tab');
 const skipFocused=await p.locator('.skip-link').evaluate(e=>e===document.activeElement&&getComputedStyle(e).opacity==='1');
 check('跳至作品链接默认隐藏且Tab聚焦可见',skipHidden&&skipFocused);
 await p.click('#start-btn');
 await p.locator('#carve-surface').focus();await p.keyboard.press('Enter');check('刻字面聚焦Enter完成',(await getState(p)).progress[0]===1);
 await p.click('#home-btn');await p.click('#start-btn');await p.locator('#primary-action').focus();await p.keyboard.press('Enter');check('刻字主按钮Enter完成',(await getState(p)).progress[0]===1);
 await nav(p,2);await p.locator('#primary-action').focus();await p.keyboard.press('Enter');check('推行主按钮Enter完成',(await getState(p)).progress[2]===1);
 await nav(p,0);await p.locator('#source-btn').focus();await p.keyboard.press(' ');check('其他按钮Space未被刻字快捷键拦截',await p.locator('#info-dialog').evaluate(e=>e.open));await p.keyboard.press('Escape');
 await nav(p,2);await p.locator('#alternate-action').focus();await p.keyboard.press(' ');check('点击替代按钮Space未被推行快捷键拦截',(await getState(p)).progress[2]===1);
 await nav(p,3);await p.click('#alternate-action');await nav(p,4);await p.click('#alternate-action');await nav(p,5);await p.click('#alternate-action');
 await p.click('#home-btn');await p.evaluate(()=>APP.setDemoInterval(1500));await p.click('#demo-btn');const s=await getState(p);
 check('重新开始快览重置之前交互状态',s.together===0&&s.read.length===0&&s.dots===0&&s.progress[2]===0&&s.progress[3]===0&&s.visited.length===1);
 await p.waitForTimeout(200);await p.click('#demo-pause');const paused=await getState(p);await p.waitForTimeout(400);const still=await getState(p);check('演示暂停冻结幕计时',still.paused&&still.index===paused.index&&still.sceneElapsed===paused.sceneElapsed);
 await p.click('#demo-pause');await p.waitForTimeout(250);const resumed=await getState(p);check('演示继续恢复计时',!resumed.paused&&(resumed.sceneElapsed>still.sceneElapsed||resumed.index>still.index));
 await p.click('#demo-exit');check('演示转自由体验保留当前幕',!(await getState(p)).demo&&await p.locator('#demo-bar').isHidden());
 await p.click('#home-btn');await p.click('#start-btn');check('自由体验重新开始重置交互',(await getState(p)).progress.every(n=>n===0));
 check('反复开始仅复用一个AudioContext',await p.evaluate(()=>window.__audioCreated===1));
 await c.close();
}
async function mobile(browser){
 const{c,p}=await context(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});await load(p);await p.locator('#start-btn').tap();
 await p.locator('#alternate-action').tap();check('手机触屏刻完成',(await getState(p)).progress[0]===1);
 await nav(p,2,true);await p.locator('#alternate-action').tap();check('手机触屏推完成',(await getState(p)).progress[2]===1);
 await nav(p,3,true);await p.locator('#primary-action').tap();await p.locator('#primary-action').tap();check('手机触屏第二次协作完成',await p.locator('.hand.joined').count()===12);
 await nav(p,4,true);await p.locator('#alternate-action').tap();check('手机触屏读十名称',(await getState(p)).read.length===10);
 await p.locator('[data-place="9"]').tap();check('手机地名来源打开',await p.locator('#info-dialog').evaluate(e=>e.open));await p.locator('#dialog-close').tap();
 await nav(p,5,true);for(let i=0;i<4;i++)await p.locator('#primary-action').tap();check('手机触屏数至543点',(await getState(p)).dots===543);
 await nav(p,7,true);await p.locator('#place-input').tap();await p.locator('#place-input').fill('濉溪');await p.locator('#tribute-select').selectOption({index:1});await p.locator('#poster-generate').tap();const[download]=await Promise.all([p.waitForEvent('download'),p.locator('#poster-download').tap()]);await download.saveAs(path.join(qa,'mobile-touch-poster.png'));check('手机触屏留与实际下载',await download.failure()===null&&fs.statSync(path.join(qa,'mobile-touch-poster.png')).size>10000);
 await p.evaluate(()=>window.scrollTo(0,0));let navTop=await p.locator('.bamboo-nav').boundingBox();await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));let navBottom=await p.locator('.bamboo-nav').boundingBox();check('手机竹竿目录上下滚动均常驻底部',Math.abs(navTop.y-navBottom.y)<2&&Math.abs(navBottom.y+navBottom.height-844)<2,{atTop:navTop,atBottom:navBottom});
 const toolbar=await p.locator('.scene-actions').boundingBox();check('手机底部预留空间避免遮挡操作',toolbar.y+toolbar.height<=navBottom.y,{buttonsBottom:toolbar.y+toolbar.height,navTop:navBottom.y});
 await p.screenshot({path:path.join(qa,'mobile-fixed-nav-poster.png'),fullPage:true});
 let overflow=[];for(let i=0;i<9;i++){await nav(p,i,true);if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))overflow.push(i);}
 check('手机固定导航后九幕无横向溢出',overflow.length===0,overflow);
 await c.close();
}
async function main(){
 for(const[name,executablePath]of[['Chrome',chrome],['Edge',edge]]){
  const browser=await chromium.launch({headless:true,executablePath});versions[name]=await browser.version();
  try{await interactNine(browser,name);if(name==='Chrome'){await keyboardAndDemo(browser);await mobile(browser);}}finally{await browser.close();}
 }
 check('补充测试离线无外网访问',requests.length===0,requests);
 check('补充测试无控制台或脚本错误',errors.length===0,errors);
}
main().catch(e=>{check('脚本未中断',false,e.stack);}).finally(()=>{
 const report={testedAt:new Date().toISOString(),method:'自动化真实Chrome/Edge headless，复制到中文与空格目录，以file://打开，并启用离线上下文；触屏测试为Playwright触屏仿真，不等同于真实手机或真实用户试用。',versions,results,errors,requests,pending:['另一台真实电脑离线复测','真实手机与真人可用性反馈','真人配音及音画同步','团队人工史料核验与截图']};
 fs.writeFileSync(reportFile,JSON.stringify(report,null,2));console.log('REPORT '+reportFile);if(results.some(r=>!r.passed))process.exitCode=1;
});
