import {initGreeting} from './greeting.js';
import {capacity,createGame,step,nearestLantern,timeLeft,maps} from './game.js';
import {runBench} from './benchmark.js';
import {makeWorld} from './world.js';
import {mapped,binding,initPreferences} from './preferences.js';
import {showScores,enterScore} from './scores.js';
const el=id=>document.getElementById(id);
initPreferences();let spawnNotice=null;const seed=12;
let draw;
try{draw=makeWorld(el('world'));}catch(error){el('intro').textContent='Hãy bật tăng tốc đồ họa để mở game 3D.';el('start').disabled=true;console.error(error);}
let game=createGame(),screen='menu',total=0,yaw=0,last=0,bank=0,audio,muted=false,flash='',flashUntil=0;
const held=new Set(),taps=new Set(),keyCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyE','KeyF']);
function setting(name,fallback){try{return localStorage.getItem('lantern.'+name)??fallback;}catch{return fallback;}}
for(const [name,defaultValue] of [['volume',40],['sensitivity',5]]){
 const input=el(name);input.value=setting(name,defaultValue);
 input.oninput=()=>{try{localStorage.setItem('lantern.'+name,input.value);}catch{}};
}
function enableSound(){try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function tone(freq,duration=.15,level=.09,type='sine'){
 if(muted||!audio||Number(el('volume').value)===0)return;
 const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(Math.max(.00011,level*Number(el('volume').value)/100),t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
 o.connect(g).connect(audio.destination);o.start();o.stop(t+duration);
}
el('sound').onclick=()=>{enableSound();muted=!muted;el('sound').textContent=muted?'♪':'♫';el('sound').setAttribute('aria-label',muted?'Bật âm thanh':'Tắt âm thanh');tone(580);};
function clear(){held.clear();taps.clear();bank=0;}
function closeDialog(){if(el('dialog').open)el('dialog').close();}
function dialog(mode,title,body,actions){
 clear();closeDialog();screen=mode;
 el('dialog').querySelector('h2').textContent=title;el('dialog').querySelector('p').textContent=body;
 el('save-score').hidden=true;el('ranking').hidden=true;el('sliders').hidden=mode!=='settings';el('actions').replaceChildren();
 for(const [label,fn] of actions){const b=document.createElement('button');b.className='primary';b.textContent=label;b.onclick=fn;el('actions').append(b);}
 el('dialog').showModal();hud();
}
let dawnProgress=0,dawnStarted=0;
function home(){dawnProgress=0;closeDialog();clear();screen='menu';game=createGame();total=0;yaw=0;hud();}
function introduce(night){
 dawnProgress=0;
 spawnNotice=null;game=createGame(seed,{},night);yaw=0;enableSound();
 const messages=['Giữ ít nhất ba đèn sáng đến bình minh. Dầu dưới 30 khiến Bóng Mực có thể tới hút dầu.',
 'Qua cầu tre hoặc dùng bục nhảy để đến đảo bên kia. Giữ túi đom đóm khỏi Gió Lạc.',
 'Theo dốc lên tầng một, rồi dùng bục nhảy tới tháp chuông. Hãy để ý lá bay trước khi gió mạnh đến.'];
 dialog('intro','Đêm '+night+' · '+maps[night].name,'Ông Đăng nhắn: “'+messages[night-1]+'”',[['Vào đảo',()=>{closeDialog();screen='play';clear();hud();}]]);
}
function result(){
 const won=game.status==='won',n=game.night;if(won)total+=game.score;
 const title=won?'Đảo đã sáng đèn':game.reason==='dawn'?'Bình minh đã đến':'Mây đã tắt lửa';
 tone(won?880:165,.6);dialog('result',title,'Đêm '+n+' · '+game.score+' điểm. Tổng điểm các Đêm đã thắng: '+total+'.',
 won?[[n<3?'Đêm kế tiếp':'Đón bình minh',()=>n<3?introduce(n+1):dawnDialog('dawn','Bình Minh','Ba hòn đảo đã sáng. Tổng điểm: '+total+'.',[['Về menu',home]])],['Về menu',home]]:
 [['Chơi lại Đêm này',()=>introduce(n)],['Về menu',home]]);
 if(!won)enterScore(total,n-1,seed);
}
function dawnDialog(...args){dialog(...args);enterScore(total,3,seed);}
function resume(){if(game.status==='paused'){step(game,{pause:false});step(game,{pause:true});}closeDialog();screen='play';clear();hud();}
function pause(){
 if(screen==='play'){game.controls.pause=false;step(game,{pause:true});}
 dialog('pause','Tạm dừng','Đêm '+game.night+' · '+game.map.name,[['Tiếp tục',resume],['Chơi lại Đêm',()=>introduce(game.night)],['Cài đặt',()=>settings(pause)],['Về menu',home]]);
}
function settings(back){dialog('settings','Cài đặt','Kéo chuột ngang trên đảo để xoay camera.',[['Quay lại',back]]);}
function help(){
 const fromMenu=screen==='menu';if(!fromMenu&&screen==='play')pause();
 dialog('help','Cách chơi',['KeyW','KeyA','KeyS','KeyD'].map(binding).join(' ')+' di chuyển, '+binding('Space')+' nhảy, '+binding('ShiftLeft')+' lướt, '+binding('KeyE')+' nạp hoặc châm dầu, '+binding('KeyF')+' tỏa sáng. Kéo chuột để xoay góc nhìn. Thắp lần đầu cần 10 con, thắp lại cần 5. Giữ ít nhất 60% số đèn sáng đến bình minh. Tỏa sáng dùng 3 con.',
 [['Đã hiểu',fromMenu?home:resume],['Cài đặt',()=>settings(fromMenu?home:pause)]]);
}
el('dialog').addEventListener('cancel',e=>{e.preventDefault();if(screen==='pause')resume();else if(screen==='settings')el('actions').firstElementChild.click();else if(screen==='help')el('actions').firstElementChild.click();});
el('scores').onclick=()=>{dialog('scores','Bảng xếp hạng','10 thành tích cao nhất trên máy này.',[['Về menu',home]]);showScores();};el('options').onclick=()=>settings(home);
el('start').onclick=()=>{total=0;introduce(1);};el('pause').onclick=pause;el('help').onclick=help;
function press(k){held.add(k);taps.add(k);}
window.addEventListener('keydown',e=>{
 if(mapped(e.code)==='KeyP'&&!e.repeat&&['play','pause'].includes(screen)){e.preventDefault();screen==='play'?pause():resume();return;}
 if(screen==='play'&&keyCodes.has(mapped(e.code))){e.preventDefault();if(!e.repeat)press(mapped(e.code));}
});
window.addEventListener('keyup',e=>held.delete(mapped(e.code)));window.addEventListener('blur',()=>{if(screen==='play')pause();});
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);press(k);};b.onlostpointercapture=()=>held.delete(k);});
el('world').onpointerdown=e=>{if(screen==='play')el('world').setPointerCapture(e.pointerId);};
el('world').onpointermove=e=>{if(screen==='play'&&el('world').hasPointerCapture(e.pointerId))yaw-=e.movementX*Number(el('sensitivity').value)*.065;};
function hud(){
 const play=screen==='play',menu=screen==='menu',p=game.player;
 el('game').className=menu?'menu':'play';el('menu').hidden=!menu;el('hud').hidden=menu;el('touch').hidden=!play;el('pause').hidden=!play;
 const rising=screen==='sunrise';el('skip-dawn').hidden=!rising;el('help').hidden=rising;
 if(rising)el('hud').hidden=true;
 el('abilities').hidden=!play;el('legend').hidden=!menu;el('guide').hidden=true;
 el('count').textContent=game.lanterns.filter(l=>l.lit).length+' / '+game.lanterns.length+' · cần '+Math.ceil(.6*game.lanterns.length);
 el('bag').textContent=p.carried+' / '+capacity(p);
 el('life').textContent='♥'.repeat(p.flames)+'♡'.repeat(Math.max(0,3-p.flames));el('score').textContent=game.score;
 const seconds=Math.ceil(timeLeft(game));el('timer').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');el('timer').parentElement.classList.toggle('urgent',seconds<=30);
 const cd=n=>n?(n/60).toFixed(1)+'s':'✓';el('abilities').textContent=binding('ShiftLeft')+' · Lướt '+cd(p.dashCD)+'　 '+binding('KeyF')+' · Tỏa sáng '+cd(p.pulseCD)+(p.charm?'　 Bùa '+Math.ceil(p.charm/60)+'s':'');
 const l=nearestLantern(game);const hint=l?(l.lit?'E – Châm dầu · '+Math.round(l.oil/60)+'/100':'E – Nạp ánh sáng ('+l.deposited+'/'+(l.ever_lit?5:10)+')'):game.sim<flashUntil?flash:'';
 el('prompt').textContent=hint.replace(/^E –/,binding('KeyE')+' –');el('prompt').hidden=!play||!hint;
 const warn=game.night===3&&game.sim%1800>=1680;
 const warnings=[];if(warn||game.wind.active)warnings.push(warn?'Gió sắp thổi':'Gió mạnh');if(seconds<=10)warnings.push('Bình minh trong '+seconds+' s');
 const low=game.lanterns.filter(l=>l.lit&&l.oil<1800);if(low.length)warnings.push('Sắp hết dầu · '+low.map(l=>l.id).join(', '));
 el('weather').hidden=!play||!warnings.length;el('weather').textContent=warnings.join('　·　');
 const alert=el('shade-alert');alert.hidden=!play||!spawnNotice||game.sim>=spawnNotice.until;
 if(!alert.hidden){const dx=spawnNotice.pos[0]-p.pos[0],dz=spawnNotice.pos[2]-p.pos[2],a=Math.atan2(dx,dz)-yaw*Math.PI/180;
 const sx=Math.sin(a),sy=Math.cos(a),scale=.40/Math.max(Math.abs(sx),Math.abs(sy),.01);
 alert.style.left=(50+100*scale*sx)+'%';alert.style.top=(50+100*scale*sy)+'%';
 alert.innerHTML='<b>↑</b> Bóng Mực xuất hiện';alert.firstChild.style.transform='rotate('+Math.atan2(sx,-sy)+'rad)';}
}
const fx={mote_picked:870,lantern_lit:1175,pulse:680,dash:480,player_hit:140,shade_spawned:186,charm_picked:990,drifter_steal:220};
function gameplay(){
 const axis=(a,b)=>Number(held.has(a)||held.has(b));const down=k=>held.has(k)||taps.has(k);
 const events=step(game,{cam_yaw_deg:yaw,move:[axis('KeyD','ArrowRight')-axis('KeyA','ArrowLeft'),axis('KeyS','ArrowDown')-axis('KeyW','ArrowUp')],
  pause:false,jump:down('Space'),interact:down('KeyE'),pulse:down('KeyF'),dash:down('ShiftLeft')||down('ShiftRight')});taps.clear();
 if(game.jumped)tone(520);for(const e of events){if(['deposit','refuel'].includes(e.name))game.arc={id:e.data.lantern_id,tick:game.sim};if(e.name==='shade_spawned'){const sh=game.shades.find(s=>s.id===e.data.id);if(sh)spawnNotice={pos:[...sh.pos],until:game.sim+180};}if(fx[e.name])tone(fx[e.name]);if(e.name==='lantern_lit'||e.name==='player_hit'){flash=e.name==='lantern_lit'?'Đèn đã sáng':'Mây mất một ngọn lửa';flashUntil=game.sim+90;}}
 if(game.sim%60===0&&timeLeft(game)<=10)tone(960,.12);
 if(game.sim%180===1)tone([220,261.63,329.63,293.66][Math.floor(game.sim/180)%4],2.2,.035);
 if(game.night===3&&game.sim%1800===1680)tone(310,1.2,.12,'triangle');
 if(['won','lost'].includes(game.status)){
  if(timeLeft(game)<=0&&game.reason!=='no_flames'){
   clear();screen='sunrise';dawnStarted=last;hud();el('skip-dawn').focus();
  }else result();
 }
}
function finishSunrise(){
 if(screen!=='sunrise')return;
 dawnProgress=1;result();
}
el('skip-dawn').onclick=finishSunrise;
function frame(t){
 const dt=Math.min(.18,(t-last)/1000);last=t;
 if(screen==='play'||game.status==='paused'){
  bank+=dt;while(bank>=1/60){bank-=1/60;if(screen==='play')gameplay();else if(game.status==='paused')step(game,{pause:false});}
  hud();
 }
 if(screen==='sunrise'){
  const progress=Math.min(1,(t-dawnStarted)/6500);
  if(el('reduced').checked||progress>=1)finishSunrise();
  else dawnProgress=progress*progress*(3-2*progress);
 }
 game.reduced=el('reduced').checked;game.accessible=el('palette').checked;const guide=draw?.(game,screen,t/1000,yaw,dawnProgress);
 if(screen==='play'&&guide&&!guide.visible){el('guide').hidden=false;el('guide').innerHTML='<i>➤</i> '+guide.id;el('guide').firstChild.style.transform='rotate('+((Math.PI/2-guide.angle)*180/Math.PI)+'deg)';}
 requestAnimationFrame(frame);
}
el('palette').checked=setting('palette','off')==='on';
function applyPalette(){document.body.classList.toggle('accessible',el('palette').checked);}
el('palette').onchange=()=>{try{localStorage.setItem('lantern.palette',el('palette').checked?'on':'off');}catch{}applyPalette();};applyPalette();
const params=new URLSearchParams(location.search);
if(params.has("bench")){document.body.classList.add("benchmark");runBench(draw,Number(params.get("bench")),Number(params.get("duration")));}else{hud();requestAnimationFrame(frame);}
initGreeting(enableSound,()=>tone(55+Math.random()*35,.23,.18,'triangle'));
