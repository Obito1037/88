(function () {
  'use strict';
  var content = window.CONTENT;
  var sources = window.SOURCES || [];
  var scenes = content.scenes;
  var places = content.places.map(function (p) { return typeof p === 'string' ? p : p.name; });
  var state = { started:false, index:0, demo:false, paused:false, muted:false, subtitles:true, held:false, progress:scenes.map(function(){return 0;}), visited:[], read:[], together:0, dots:0, demoElapsed:0, sceneElapsed:0, demoInterval:20000, lastInput:Date.now(), holdingAt:0 };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var audioContext = null, lastTone = 0, lastFrame = 0, lastFocus = null, posterReady = false;
  var $ = function(id){return document.getElementById(id);};
  var escapeHtml = function(s){return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var kindNames = {carve:'刻',depart:'装',push:'推',together:'一起',read:'读',dots:'数',relic:'看',poster:'留',credits:'记'};
  var navNames = ['序 · 竹竿','一 · 出发','二 · 山东','三 · 南下','四 · 濉溪口','五 · 人民','六 · 文物','七 · 今天','尾 · 致敬'];
  var ids = function(a){return (a || []).join(' / ');};
  function touch(){state.lastInput=Date.now();$('idle-hint').hidden=true;}
  function status(text){$('interaction-status').textContent=text;}
  function unlockAudio(){
    if(!audioContext){var Audio = window.AudioContext || window.webkitAudioContext;if(Audio){try{audioContext=new Audio();}catch(e){status('当前设备不支持声音，文字与交互仍可完整体验。');}}}
    if(audioContext && audioContext.state==='suspended'){audioContext.resume().catch(function(){});}
  }
  function tone(type){
    if(state.muted || !audioContext || audioContext.state!=='running')return;
    if(Date.now()-lastTone<100)return;lastTone=Date.now();
    var oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
    oscillator.type=type==='together'?'sine':'triangle';
    oscillator.frequency.setValueAtTime(type==='carve'?1200:type==='push'?110:type==='together'?196:360,now);
    oscillator.frequency.exponentialRampToValueAtTime(type==='carve'?250:type==='together'?294:70,now+.12);
    gain.gain.setValueAtTime(0.0001,now);gain.gain.exponentialRampToValueAtTime(type==='carve'?.018:.035,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+(type==='together'?.9:.13));
    oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(now+1);
  }
  function showDialog(title,html,eyebrow){lastFocus=document.activeElement;$('dialog-title').textContent=title;$('dialog-body').innerHTML=html;$('dialog-eyebrow').textContent=eyebrow||'证据与边界';if(!$('info-dialog').open)$('info-dialog').showModal();$('dialog-close').focus();}
  function closeDialog(){$('info-dialog').close();if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
  function sourceHtml(s){
    return '<article class="source-entry" id="source-'+escapeHtml(s.id)+'"><h3><span class="source-id">'+escapeHtml(s.id)+'</span>'+escapeHtml(s.title)+'</h3><p class="source-meta">'+escapeHtml(s.institution)+' · '+escapeHtml(s.date)+'</p><p>'+escapeHtml(s.fact)+'</p><blockquote>'+escapeHtml(s.quote)+'</blockquote><p>'+escapeHtml(s.note||'')+'</p><p class="source-status">'+escapeHtml(s.confidence)+' · '+escapeHtml(s.reviewStatus||s.status)+'</p><a href="'+escapeHtml(s.url)+'" target="_blank" rel="noopener noreferrer">查看原文（需联网，另开窗口） ↗</a></article>';
  }
  function openSources(selected){
    var chosen=selected&&selected.length?sources.filter(function(s){return selected.indexOf(s.id)!==-1;}):sources;
    showDialog(selected&&selected.length?'这一幕的史料':'史料来源总表','<p class="dialog-note">本页保留 AI 检索的来源与差异。所有条目仍待团队人工打开原文、核对并截图。离线可阅读以下摘录；原文链接仅在主动点击后联网。</p>'+chosen.map(sourceHtml).join(''));
  }
  function openAbout(){
    showDialog('关于这段阅读的路','<p>《八十八个地名——一根竹竿上的淮海支前路》是一部以文物为线索的离线交互叙事。通过刻、推、一起推、读、数、留，走近中国共产党领导下人民群众的支前力量。</p><p class="dialog-note">'+escapeHtml(content.reviewNotice)+'</p><h3>史实与艺术表达</h3><p>'+escapeHtml(content.placesNote)+'</p><p>路线示意，非地图。竹竿、车、手、侧光和群像均为艺术示意，不是文物原件复原、历史现场或真实人物的经历再现。“第八十九个地名”为当代致敬创作，不增补历史文物。543 个点为数量比例示意，每点表示 1 万人次，不能理解为独立个人名单。</p><button class="source-button" id="all-sources-in-about">查看全部史料与分歧记录 ↗</button><h3>AI 使用与素材说明</h3><p>文字、程序与交互图形由 OpenAI Codex 辅助生成；4 幅木刻风格插图由 OpenAI ImageGen 生成，并按离线网页需求压缩为 WebP。图像均标注“艺术示意 · AI 辅助生成”，没有真实历史人物的写实面孔。素材没有经过团队后期验收，不能将 AI 工作记为团队亲手完成。</p><p>声音使用 Web Audio API 程序合成，仅为操作提示；没有真人配音、真人拟音、声音克隆或仿声。可读旁白文字始终可见，可用“字幕”开关隐藏或显示。真人录音及音画同步须由团队后续完成。</p><h3>第三方资源与许可</h3><p>本地字体：思源宋体（Source Han Serif）、霞鹜文楷（LXGW WenKai），均为 SIL Open Font License 1.1。字体已子集化并内嵌，任意输入地名使用系统字体回退。许可全文见作品目录 licenses；资源登记见交付包资源清单。无外部脚本、图标库、在线音频或追踪代码。</p><h3>使用与数据</h3><p>完整阅读建议 6–8 分钟，自由体验不设倒计时。评审快览约 3 分钟，可暂停或转为自由体验。每幕可以直接跳转；空格或回车操作，右方向键推行，A / L 协作，Esc 跳过。手机可使用按钮替代全部动作。</p><p>海报为 1080 × 1920 纯 Canvas 绘制。输入只存在当前页面内存中，不上传、不保存，不使用 Cookie。关闭页面即清除。海报不含评分、称号、身份信息或排名。</p><p>谨向唐和恩与参与淮海战役支前的人们致敬。</p>','创作属性 / 使用说明');
    $('all-sources-in-about').onclick=function(){openSources();};
  }
  function buildNav(){
    $('scene-nav').innerHTML=scenes.map(function(s,i){return '<button class="nav-item" data-scene="'+i+'" aria-label="跳转：'+escapeHtml(s.title)+'">'+navNames[i]+'</button>';}).join('');
    Array.prototype.forEach.call($('scene-nav').children,function(btn){btn.onclick=function(){goTo(Number(btn.dataset.scene),true);};});
  }
  function updateNav(){
    Array.prototype.forEach.call($('scene-nav').children,function(btn,i){btn.classList.toggle('active',i===state.index);btn.classList.toggle('visited',state.visited.indexOf(i)!==-1);if(i===state.index)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current');});
    $('progress-text').textContent=String(state.index+1).padStart(2,'0')+' / 09 · 目录可自由跳转';
  }
  function start(demo){
    unlockAudio();state.started=true;state.demo=!!demo;state.paused=false;state.demoElapsed=0;state.sceneElapsed=0;state.progress=scenes.map(function(){return 0;});state.visited=[];state.read=[];state.together=0;state.dots=0;
    $('cover').hidden=true;$('experience').hidden=false;$('demo-bar').hidden=!state.demo;document.body.classList.toggle('is-demo',state.demo);
    $('demo-pause').textContent='暂停演示';goTo(0,false);touch();window.scrollTo(0,0);
  }
  function goTo(index,focus){
    state.held=false;state.index=Math.max(0,Math.min(index,scenes.length-1));state.sceneElapsed=0;touch();
    if(!state.started){state.started=true;$('cover').hidden=true;$('experience').hidden=false;}
    if(state.visited.indexOf(state.index)===-1)state.visited.push(state.index);
    var scene=scenes[state.index];$('scene').className='scene '+scene.kind;$('scene-kicker').textContent=scene.kicker;$('scene-title').textContent=scene.title;$('scene-body').textContent=scene.body;$('narration').textContent=scene.narration;$('narration').hidden=!state.subtitles;$('scene-image').src='assets/img/'+scene.image;$('scene-image').alt=scene.kind==='poster'?'田野的木刻艺术示意，不对应特定实景':'木刻风格艺术示意，不是文物原件或历史现场';$('stage-number').textContent=String(state.index+1).padStart(2,'0')+' / 09';$('instruction').textContent=scene.instruction;$('interaction-name').textContent=kindNames[scene.kind];
    $('scene-facts').innerHTML=(scene.facts||[]).map(function(f){return '<button class="fact" data-sources="'+escapeHtml((f.sourceIds||[]).join(','))+'"><span class="ref">史实 · '+escapeHtml(ids(f.sourceIds))+'</span>'+escapeHtml(f.text)+'</button>';}).join('');
    Array.prototype.forEach.call($('scene-facts').children,function(b){b.onclick=function(){openSources(b.dataset.sources.split(','));};});
    $('next-btn').innerHTML=state.index===8?'回到封面 <span>↺</span>':'跳过 / 下一幕 <span>→</span>';
    $('primary-action').hidden=false;$('alternate-action').hidden=false;status('');renderInteraction(scene.kind);updateNav();if(focus){$('scene-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});}
  }
  function next(){if(state.index<8)goTo(state.index+1,true);else home();}
  function home(){state.started=false;state.demo=false;state.held=false;document.body.classList.remove('is-demo');$('experience').hidden=true;$('cover').hidden=false;$('start-btn').focus();window.scrollTo(0,0);}
  var cart='<g fill="none" stroke="currentColor" stroke-width="3"><path d="M-23 -20 L15 -20 L23 -4 L-15 -4 Z M-20 -22 L-36 -36 M23 -4 L36 1"/><circle cx="0" cy="3" r="10"/><path d="M0 -7 L0 13 M-10 3 L10 3"/><path d="M-14 -23 Q-23 -43 -9 -42 L3 -41 Q13 -32 10 -22 M0 -23 Q-4 -39 11 -38 L20 -35 Q25 -27 18 -21"/></g>';
  var hand='<svg class="hand" viewBox="0 0 45 110" aria-hidden="true"><path fill="currentColor" d="M13 110 L12 72 Q2 55 4 42 Q6 35 11 42 L17 52 L13 16 Q14 10 19 15 L24 44 L22 8 Q23 3 27 7 L31 43 L32 15 Q33 10 37 15 L38 46 L40 30 Q44 25 45 33 L45 62 Q43 72 35 80 L36 110 Z"/></svg>';
  function renderInteraction(kind){
    var node=$('interaction');posterReady=false;
    if(kind==='carve'){
      node.innerHTML='<div class="carve-panel"><p class="panel-caption">把第一个地名，慢慢刻下。</p><div class="carve-wood" id="carve-surface" role="button" tabindex="0" aria-label="按住三秒刻出陶障区"><div class="carve-word" aria-hidden="true">陶障区</div><div class="carve-word reveal" id="carve-reveal" aria-hidden="true">陶障区</div></div><div class="thin-progress" role="progressbar" id="carve-progress" aria-label="刻字进度" aria-valuemin="0" aria-valuemax="100"><span id="carve-line"></span></div></div>';
      bindHold($('carve-surface'));$('primary-action').textContent='按住刻字';$('alternate-action').textContent='点击刻完';updateCarve();
    }else if(kind==='depart'){
      node.innerHTML='<div class="depart-panel"><svg viewBox="0 0 360 120" aria-label="小车装载示意"><path d="M40 100 H320" stroke="#8b7b59" stroke-width="2"/><g transform="translate(180 82) scale(1.3)">'+cart+'</g><g class="grain-sack" id="grain-sack" fill="#a92720" stroke="#efe6d2" stroke-width="2"><path d="M120 58 Q108 31 123 25 L141 26 Q155 41 150 59Z"/><path d="M167 57 Q159 26 173 22 L189 24 Q207 41 199 58Z"/><path d="M207 58 Q203 37 214 31 L229 34 Q244 49 237 59Z"/></g></svg><p class="panel-caption">一车物资，一份支援。</p><p class="route-label">装载动作 · 艺术示意</p></div>';
      $('primary-action').textContent='点击装车';$('alternate-action').hidden=true;if(state.progress[state.index])$('grain-sack').classList.add('loaded');
    }else if(kind==='push'){
      var routePlaces=places.slice(1,6),points=[[45,96],[155,62],[265,96],[375,47],[485,77]];
      node.innerHTML='<div class="route-panel"><svg class="route-svg" id="route-surface" viewBox="0 0 540 155" role="img" aria-label="五个名称的阅读路线"><path class="route-base" d="M45 96 L155 62 L265 96 L375 47 L485 77"/><path class="route-done" id="route-done" d="M45 96 L155 62 L265 96 L375 47 L485 77" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>'+points.map(function(p,i){return '<g class="route-point" id="route-point-'+i+'"><circle cx="'+p[0]+'" cy="'+p[1]+'" r="5"/><text x="'+p[0]+'" y="'+(p[1]+34)+'">'+routePlaces[i]+'</text></g>';}).join('')+'<g class="cart-icon" id="route-cart" transform="translate(45 80) scale(.7)">'+cart+'</g></svg><p class="route-label">路线示意，非地图 · 仅按报道列举顺序呈现</p></div>';
      bindHold($('route-surface'));var dragLast=null;$('route-surface').addEventListener('pointerdown',function(e){dragLast=e.clientX;});$('route-surface').addEventListener('pointermove',function(e){if(state.held&&dragLast!==null){state.progress[state.index]=Math.min(1,state.progress[state.index]+Math.abs(e.clientX-dragLast)/900);dragLast=e.clientX;updatePush();}});
      $('primary-action').textContent='按住向前推';$('alternate-action').textContent='点击走完';updatePush();
    }else if(kind==='together'){
      node.innerHTML='<div class="together-panel"><svg class="gather-cart" viewBox="0 0 400 90" aria-label="合力越过泥坎的艺术示意"><path d="M0 76 L175 76 L235 47 L400 47" fill="none" stroke="#75664b" stroke-width="3"/><g class="movable" id="gather-cart-move" transform="translate(155 62)">'+cart+'</g></svg><div class="hands" id="hands">'+Array(13).join(hand)+'</div><p class="together-caption" id="together-caption">许多双手，同一个方向。</p></div>';
      $('primary-action').textContent=state.together===0?'先推一下':'一起推';$('alternate-action').textContent='点击一起推';updateTogether();
    }else if(kind==='read'){
      node.innerHTML='<div class="read-panel"><p class="panel-caption">把侧光移过，读出名称。</p><div class="read-wood" id="read-wood">'+places.map(function(p,i){return '<button class="place-mark" data-place="'+i+'" aria-label="读出'+p+'并查看来源">'+escapeHtml(p)+'</button>';}).join('')+'</div><label class="light-control" for="light-slider"><span>侧光</span><input id="light-slider" type="range" min="0" max="9" step="1" value="0" aria-label="沿竹竿移动侧光"><span>→</span></label><p class="read-caption" id="read-caption"></p><p class="read-note">选用报道列举的10个名称 · 交互为艺术示意，非原件复原</p></div>';
      $('light-slider').oninput=function(){readPlace(Number(this.value),false);};Array.prototype.forEach.call($('read-wood').children,function(b){b.onclick=function(){readPlace(Number(b.dataset.place),false);openSources(content.placeSourceIds||['S01']);};});
      $('read-wood').onpointermove=function(e){if(e.buttons||e.pointerType==='mouse'){var r=this.getBoundingClientRect();readPlace(Math.max(0,Math.min(9,Math.floor((e.clientX-r.left)/r.width*10))),false);}};
      $('primary-action').textContent='读下一个名称';$('alternate-action').textContent='点击读完';readPlace(0,false);
    }else if(kind==='dots'){
      node.innerHTML='<div class="dot-panel"><p class="dot-number"><span id="dot-number">0</span><small> 万人次</small></p><p class="dot-stat">一点，表示一万人次。<span id="dot-count">0 / 543 点</span></p><canvas id="dot-canvas" class="dot-canvas" aria-label="543个光点，代表543万人次的比例示意"></canvas><p class="dot-stat" id="dot-stat"></p><blockquote class="dot-quote" id="dot-quote" hidden>'+escapeHtml(content.quote)+'<small>'+escapeHtml(content.quoteAttribution)+'</small></blockquote></div>';
      $('primary-action').textContent='让光点汇入';$('alternate-action').textContent='点击展开全部';node.onwheel=function(){if(Date.now()-lastTone>500)advanceDots();};updateDots();
    }else if(kind==='relic'){
      node.innerHTML='<div class="relic-panel"><p>走过的路，留在刻痕里。</p><small>竹竿图像为艺术示意，不是文物照片。</small></div>';$('primary-action').textContent='阅读文物来源';$('alternate-action').hidden=true;
    }else if(kind==='poster'){
      node.innerHTML='<div class="poster-panel"><div class="poster-form"><label for="place-input">从你所在的地方，致敬。</label><input id="place-input" autocomplete="off" placeholder="写下所在地名，最多8个字" aria-describedby="place-validation"><label for="tribute-select">留下一句心意</label><select id="tribute-select">'+content.posterMessages.map(function(t){return '<option>'+escapeHtml(t)+'</option>';}).join('')+'</select><button id="poster-generate" class="button solid">生成致敬海报 <span>↓</span></button><p class="poster-status" id="place-validation" role="status"></p><p class="poster-note">1080 × 1920 · 仅在本地生成<br>“第八十九个地名”为当代致敬创作，不增补历史文物。</p></div><div><canvas id="poster-canvas" width="1080" height="1920" class="poster-preview" aria-label="致敬海报预览"></canvas><a id="poster-download" class="poster-download" hidden>下载海报 PNG ↓</a></div></div>';
      $('poster-generate').onclick=generatePoster;$('place-input').oninput=function(){touch();var clean=Array.from(this.value.replace(/[\u0000-\u001f\u007f]/g,''));if(clean.length>8){this.value=clean.slice(0,8).join('');$('place-validation').textContent='地名已保留前8个字。';}else $('place-validation').textContent='';posterReady=false;$('poster-download').hidden=true;};$('tribute-select').onchange=function(){posterReady=false;$('poster-download').hidden=true;};
      $('primary-action').textContent='生成海报';$('alternate-action').hidden=true;drawPoster('你所在的地方',content.posterMessages[0],false);
    }else{
      node.innerHTML='<div class="credits-panel"><p class="credits-places">'+places.join(' · ')+'</p><div class="credits-links"><button id="credits-sources">查阅全部史料 ↗</button><button id="credits-about">创作与 AI 说明 ↗</button></div><p class="credits-small">10个名称，选自报道的列举。<br>这段阅读在此停留，史料核验与记忆仍需继续。</p></div>';
      $('credits-sources').onclick=function(){openSources();};$('credits-about').onclick=openAbout;$('primary-action').textContent='重新体验';$('alternate-action').hidden=true;
    }
    if(kind!=='dots')node.onwheel=null;
  }
  function bindHold(el){el.addEventListener('pointerdown',function(e){if(e.button!==0&&e.pointerType==='mouse')return;e.preventDefault();touch();state.held=true;state.holdingAt=Date.now();try{el.setPointerCapture(e.pointerId);}catch(err){}});el.addEventListener('pointerup',function(){state.held=false;});el.addEventListener('pointercancel',function(){state.held=false;});}
  function updateCarve(){var p=state.progress[state.index];$('carve-reveal').style.clipPath='inset(0 '+((1-p)*100)+'% 0 0)';$('carve-line').style.width=(p*100)+'%';$('carve-progress').setAttribute('aria-valuenow',Math.round(p*100));if(p>=1)status('陶障区，刻下了。可以继续阅读。');}
  function updatePush(){
    var p=state.progress[state.index],points=[[45,96],[155,62],[265,96],[375,47],[485,77]],part=Math.min(3,Math.floor(p*4)),t=p*4-part;
    var x=points[part][0]+(points[part+1][0]-points[part][0])*t,y=points[part][1]+(points[part+1][1]-points[part][1])*t;
    $('route-cart').setAttribute('transform','translate('+x+' '+(y-17)+') scale(.7)');$('route-done').style.strokeDashoffset=String(100-p*100);
    points.forEach(function(q,i){$('route-point-'+i).classList.toggle('lit',p>=i/4);});if(p>=1)status('五个名称已读过。路程不按示意图比例计量。');else status('已读到 '+places[1+Math.min(4,Math.floor(p*4))]+' · 按住或拖动继续');
  }
  function updateTogether(){var count=state.together>=2?12:1;Array.prototype.forEach.call($('hands').children,function(h,i){h.classList.toggle('joined',i<count);});$('gather-cart-move').setAttribute('transform',state.together>=2?'translate(300 33)':state.together===1?'translate(161 60)':'translate(155 62)');$('together-caption').textContent=state.together>=2?'许多双手，把路接续。':state.together===1?'一个人推不动。再一起用力。':'许多双手，同一个方向。';if(state.together>=2){$('primary-action').textContent='已经一起向前';status('12只手的艺术示意，表达协作，不对应具体人数。');state.progress[state.index]=1;}else $('primary-action').textContent=state.together===1?'一起推':'先推一下';}
  function readPlace(n,silent){
    touch();if(state.read.indexOf(n)===-1)state.read.push(n);$('light-slider').value=n;
    Array.prototype.forEach.call($('read-wood').children,function(b,i){b.classList.toggle('read',state.read.indexOf(i)!==-1);b.classList.toggle('lit',i===n);});
    $('read-caption').textContent=places[n]+' · '+ids(content.placeSourceIds||['S01'])+' · 点击名称可查看出处';state.progress[state.index]=state.read.length/10;
    if(!silent)status('已读 '+state.read.length+' / 10 个选定名称'+(state.read.length===10?'。非完整清单，非全部行程终点。':''));
  }
  function advanceDots(){touch();state.dots=Math.min(543,state.dots+136);tone('dots');updateDots();}
  function updateDots(){
    var canvas=$('dot-canvas');if(!canvas)return;var r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(260,r.width),h=Math.max(120,r.height);canvas.width=w*dpr;canvas.height=h*dpr;var ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
    for(var i=0;i<543;i++){var col=i%61,row=Math.floor(i/61),x=12+col*(w-24)/60,y=20+Math.sin(col/10)*15+row*(h-42)/9;ctx.fillStyle=i<state.dots?(i%13===0?'#d76d5e':'#efe6d2'):'rgba(239,230,210,.12)';ctx.beginPath();ctx.arc(x,y,Math.max(1.3,Math.min(2.3,w/260)),0,Math.PI*2);ctx.fill();}
    $('dot-number').textContent=state.dots;$('dot-count').textContent=' '+state.dots+' / 543 点';$('dot-stat').textContent=state.dots>=408?'小车 88.1 万辆 · 担架 20.6 万副 · 史实 S04':state.dots>=136?'543万人次支前民工 · 史实 S04':'让分散的光点，慢慢汇成一条路。';$('dot-quote').hidden=state.dots<543;state.progress[state.index]=state.dots/543;if(state.dots>=543)status('543个点全部呈现。减少动效模式也保留相同数量。');
  }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){var chars=Array.from(text),line='';chars.forEach(function(ch){if(ctx.measureText(line+ch).width>maxWidth){ctx.fillText(line,x,y);line=ch;y+=lineHeight;}else line+=ch;});if(line)ctx.fillText(line,x,y);return y;}
  function drawPoster(place,message,ready){
    var canvas=$('poster-canvas'),ctx=canvas.getContext('2d'),w=1080,h=1920;ctx.fillStyle='#efe6d2';ctx.fillRect(0,0,w,h);
    var seed=88;function random(){seed=(seed*9301+49297)%233280;return seed/233280;}
    for(var n=0;n<18000;n++){ctx.fillStyle='rgba(70,48,16,'+(random()*.08)+')';ctx.fillRect(random()*w,random()*h,random()*2+1,1);}
    ctx.strokeStyle='#1c1a17';ctx.lineWidth=2;ctx.strokeRect(58,58,964,1804);ctx.textAlign='left';ctx.fillStyle='#1c1a17';ctx.font='28px "Microsoft YaHei",sans-serif';ctx.fillText('一 根 竹 竿 上 的 淮 海 支 前 路',100,140);
    ctx.font='900 110px BambooSerif, "SimSun",serif';ctx.fillText('八十八个地名',92,300);ctx.font='29px "Microsoft YaHei",sans-serif';ctx.fillStyle='#665c49';ctx.fillText('从历史，走到今天。',100,365);
    ctx.save();ctx.translate(110,650);ctx.rotate(-.15);ctx.fillStyle='#1c1a17';ctx.beginPath();ctx.moveTo(0,40);ctx.lineTo(870,0);ctx.lineTo(875,98);ctx.lineTo(7,139);ctx.closePath();ctx.fill();ctx.strokeStyle='#efe6d2';ctx.lineWidth=3;
    for(var i=0;i<7;i++){var bx=i*140+20;ctx.beginPath();ctx.moveTo(bx,36-i*6);ctx.lineTo(bx+5,135-i*6);ctx.stroke();}
    for(var j=0;j<34;j++){var xx=random()*850,yy=random()*64+43-xx*.04;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+random()*70+6,yy-3);ctx.stroke();}ctx.restore();
    ctx.fillStyle='#a92720';ctx.fillRect(100,900,70,5);ctx.font='34px "Microsoft YaHei",sans-serif';ctx.fillText('第八十九个地名',100,988);ctx.fillStyle='#1c1a17';ctx.font='82px BambooKai,"KaiTi","Microsoft YaHei",sans-serif';var end=wrapText(ctx,place,95,1120,870,110);
    ctx.fillStyle='#514636';ctx.font='40px BambooSerif,"SimSun",serif';wrapText(ctx,message,100,Math.max(1300,end+100),850,66);
    ctx.strokeStyle='#b3a58a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(100,1530);ctx.lineTo(980,1530);ctx.stroke();ctx.fillStyle='#1c1a17';ctx.font='30px BambooSerif,"SimSun",serif';ctx.fillText('致敬淮海战役 543 万人次支前民工',100,1610);ctx.font='22px "Microsoft YaHei",sans-serif';ctx.fillStyle='#665c49';ctx.fillText('统计来源：新华报业 / 扬子晚报（2021-04-25）S04',100,1660);
    var date=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());ctx.fillText(date.replace(/\//g,'.')+' · 当代致敬创作，不增补历史文物',100,1730);ctx.fillText('文字与程序图形含 AI 辅助内容 · 史料待团队核验',100,1785);
    if(!ready){ctx.fillStyle='#a92720';ctx.font='24px "Microsoft YaHei",sans-serif';ctx.fillText('海报预览 · 输入地名后生成',100,1830);}
  }
  function generatePoster(){
    touch();var place=$('place-input').value.trim(),length=Array.from(place).length;if(!length){$('place-validation').textContent='请先填写你所在的地名。';$('place-input').focus();return false;}if(length>8){$('place-validation').textContent='地名请控制在8个字以内。';return false;}
    drawPoster(place,$('tribute-select').value,true);
    try{$('poster-download').href=$('poster-canvas').toDataURL('image/png');$('poster-download').download='第八十九个地名_致敬海报.png';$('poster-download').hidden=false;$('place-validation').textContent='海报已在本地生成，点击右侧下载。';posterReady=true;state.progress[state.index]=1;status('输入不会上传或保存。');return true;}catch(e){$('place-validation').textContent='当前浏览器未允许导出，请在 Chrome 或 Edge 中打开本地作品。';return false;}
  }
  function action(){
    touch();var kind=scenes[state.index].kind;
    if(kind==='depart'){state.progress[state.index]=1;$('grain-sack').classList.add('loaded');tone('push');status('物资就位。画面为装载动作的艺术示意。');}
    else if(kind==='together'){state.together=Math.min(2,state.together+1);tone('together');updateTogether();}
    else if(kind==='read')readPlace((Number($('light-slider').value)+1)%10,false);
    else if(kind==='dots')advanceDots();
    else if(kind==='relic')openSources(scenes[state.index].sourceIds);
    else if(kind==='poster')generatePoster();
    else if(kind==='credits')start(false);
  }
  function alternate(){
    touch();var kind=scenes[state.index].kind;state.progress[state.index]=1;
    if(kind==='carve'){updateCarve();tone('carve');}else if(kind==='push'){updatePush();tone('push');}else if(kind==='together'){state.together=2;updateTogether();tone('together');}else if(kind==='read'){state.read=places.map(function(p,i){return i;});readPlace(9,false);}else if(kind==='dots'){state.dots=543;updateDots();}else action();
  }
  $('start-btn').onclick=function(){start(false);};$('demo-btn').onclick=function(){start(true);};$('home-btn').onclick=home;$('source-btn').onclick=function(){openSources(state.started?scenes[state.index].sourceIds:null);};$('about-btn').onclick=openAbout;$('dialog-close').onclick=closeDialog;
  $('info-dialog').addEventListener('click',function(e){if(e.target===this){var r=this.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  $('info-dialog').addEventListener('close',function(){touch();});
  $('mute-btn').onclick=function(){state.muted=!state.muted;this.textContent=state.muted?'声音 关':'声音 开';this.setAttribute('aria-pressed',state.muted);touch();};
  $('subtitle-btn').onclick=function(){state.subtitles=!state.subtitles;this.textContent=state.subtitles?'字幕 开':'字幕 关';this.setAttribute('aria-pressed',state.subtitles);$('narration').hidden=!state.subtitles;touch();};
  $('next-btn').onclick=next;$('alternate-action').onclick=alternate;
  $('primary-action').addEventListener('pointerdown',function(e){if(['carve','push'].indexOf(scenes[state.index].kind)!==-1){e.preventDefault();state.held=true;touch();try{this.setPointerCapture(e.pointerId);}catch(err){}}});
  $('primary-action').addEventListener('pointerup',function(){state.held=false;});$('primary-action').addEventListener('pointercancel',function(){state.held=false;});$('primary-action').onclick=function(e){if(['carve','push'].indexOf(scenes[state.index].kind)===-1)action();else if(e.detail===0)alternate();};
  document.addEventListener('pointerup',function(){state.held=false;});window.addEventListener('blur',function(){state.held=false;});
  document.addEventListener('keydown',function(e){
    if(!state.started||$('info-dialog').open)return;var tag=e.target.tagName;if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;
    if(e.key==='Escape'){e.preventDefault();next();return;}
    var kind=scenes[state.index].kind;
    var focusedControl=tag==='BUTTON'||tag==='A';
    if(e.key==='Enter'&&['carve','push'].indexOf(kind)!==-1&&(!focusedControl||e.target===$('primary-action')||e.target===$('carve-surface'))&&!e.repeat){e.preventDefault();alternate();}
    else if((e.key===' '||e.key==='ArrowRight')&&['carve','push'].indexOf(kind)!==-1&&(!focusedControl||e.target===$('primary-action')||e.target===$('carve-surface'))){e.preventDefault();state.held=true;touch();}
    else if((e.key.toLowerCase()==='a'||e.key.toLowerCase()==='l')&&kind==='together'&&!e.repeat){e.preventDefault();action();}
    else if(e.key==='ArrowRight'&&kind==='read'){e.preventDefault();action();}
    else if(e.key==='ArrowLeft'&&kind==='read'){e.preventDefault();readPlace((Number($('light-slider').value)+9)%10,false);}
    else if((e.key===' '||e.key==='Enter')&&e.target===document.body&&!e.repeat){e.preventDefault();action();}
  });
  document.addEventListener('keyup',function(e){if(e.key===' '||e.key==='ArrowRight')state.held=false;});
  document.addEventListener('pointerdown',touch);document.addEventListener('keydown',touch);
  $('demo-pause').onclick=function(){if(state.index===8&&state.sceneElapsed>=state.demoInterval){start(true);return;}state.paused=!state.paused;this.textContent=state.paused?'继续演示':'暂停演示';};$('demo-exit').onclick=function(){state.demo=false;state.held=false;$('demo-bar').hidden=true;document.body.classList.remove('is-demo');touch();};
  window.addEventListener('resize',function(){if(state.started&&scenes[state.index].kind==='dots')updateDots();});
  function demoAct(ratio){
    var kind=scenes[state.index].kind;
    if(kind==='carve'){state.progress[state.index]=Math.min(1,ratio*3);updateCarve();}
    else if(kind==='push'){state.progress[state.index]=Math.min(1,ratio*1.65);updatePush();}
    else if(kind==='depart'&&ratio>.25&&!state.progress[state.index])action();
    else if(kind==='together'){var step=ratio>.45?2:ratio>.15?1:0;if(step!==state.together){state.together=step;updateTogether();}}
    else if(kind==='read'){var n=Math.min(9,Math.floor(ratio*14));if(Number($('light-slider').value)!==n)readPlace(n,true);}
    else if(kind==='dots'){var num=Math.min(543,Math.floor(ratio*1.8*543));if(state.dots!==num){state.dots=num;updateDots();}}
    else if(kind==='poster'&&ratio>.3&&!posterReady){$('place-input').value='濉溪';generatePoster();}
  }
  function frame(now){
    var dt=lastFrame?Math.min(100,now-lastFrame):0;lastFrame=now;
    if(state.started){
      var kind=scenes[state.index].kind;
      if(state.held&&!state.demo&&['carve','push'].indexOf(kind)!==-1){state.progress[state.index]=Math.min(1,state.progress[state.index]+dt/(kind==='carve'?2900:28000));touch();if(kind==='carve')updateCarve();else updatePush();if(state.progress[state.index]<1&&Date.now()-lastTone>260)tone(kind);else if(state.progress[state.index]>=1)state.held=false;}
      if(!state.demo&&!$('info-dialog').open&&Date.now()-state.lastInput>=15000)$('idle-hint').hidden=false;
      if(state.demo&&!state.paused&&!$('info-dialog').open){state.sceneElapsed+=dt;state.demoElapsed+=dt;demoAct(state.sceneElapsed/state.demoInterval);$('demo-countdown').textContent='第 '+(state.index+1)+' / 9 段 · '+Math.max(0,Math.ceil((state.demoInterval-state.sceneElapsed)/1000))+' 秒';$('demo-progress').style.width=((state.index+Math.min(1,state.sceneElapsed/state.demoInterval))/9*100)+'%';if(state.sceneElapsed>=state.demoInterval){if(state.index<8)goTo(state.index+1,false);else{state.paused=true;$('demo-pause').textContent='重新演示';$('demo-countdown').textContent='九段叙事已完整呈现';}}}
    }
    requestAnimationFrame(frame);
  }
  buildNav();requestAnimationFrame(frame);
  if(/[?&]demo=1(?:&|$)/.test(window.location.search)){$('demo-btn').textContent='点击开始评审快览（约3分钟）';$('demo-btn').focus();}
  window.APP={start:start,goTo:function(i){goTo(i,false);},getState:function(){return JSON.parse(JSON.stringify(state));},setDemoInterval:function(ms){state.demoInterval=Math.max(100,Number(ms)||20000);},openSources:openSources,openAbout:openAbout};
}());
