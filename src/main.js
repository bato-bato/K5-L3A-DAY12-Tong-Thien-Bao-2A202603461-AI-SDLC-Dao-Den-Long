import {createGame,step,shrines,rules} from './game.js';
import {makeWorld} from './world.js';
const el=id=>document.getElementById(id);
let draw;
try{draw=makeWorld(el('world'));}catch(error){el('intro').textContent='Trình duyệt chưa mở được đồ họa 3D. Hãy bật tăng tốc đồ họa và tải lại trang.';el('start').disabled=true;console.error(error);}
let s=createGame(),mode='menu',beforeDialog,muted=true,audio,last=0,bank=0,jump=false,light=false,message='',messageEnd=0;
const keys=new Set(),controls=new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE']);
function tone(hz,duration=.18){
 if(muted||!audio)return;
 const osc=audio.createOscillator(),amp=audio.createGain(),t=audio.currentTime;osc.frequency.value=hz;amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(.08,t+.02);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
 osc.connect(amp).connect(audio.destination);osc.start();osc.stop(t+duration);
}
el('sound').onclick=async()=>{try{audio??=new AudioContext();await audio.resume();muted=!muted;el('sound').textContent=muted?'♪':'♫';el('sound').setAttribute('aria-label',muted?'Bật âm thanh':'Tắt âm thanh');el('sound').title=el('sound').getAttribute('aria-label');tone(660);}catch{el('sound').title='Âm thanh chưa khả dụng';}};
function ui(){
 el('game').classList.toggle('menu',mode==='menu');el('menu').hidden=mode!=='menu';el('hud').hidden=mode==='menu';el('pause').hidden=mode!=='play';el('touch').hidden=mode!=='play';
 el('count').textContent=s.lit.filter(Boolean).length+' / 3';el('bag').textContent=String(s.bag);el('life').textContent=s.lives+' / 3';
 const idx=shrines.findIndex((p,i)=>!s.lit[i]&&Math.hypot(s.x-p.x,s.z-p.z)<=rules.reach);
 const hint=idx>=0?(s.bag>=rules.cost?'E · Thắp đèn '+shrines[idx].name:shrines[idx].name+' · Cần thêm '+(rules.cost-s.bag)+' đom đóm'):(s.tick<messageEnd?message:'');
 el('prompt').textContent=hint;el('prompt').hidden=mode!=='play'||!hint;
}
function clearInput(){keys.clear();jump=false;light=false;bank=0;}
function popup(title,body,button){
 clearInput();beforeDialog=mode;mode='dialog';el('dialog').querySelector('h2').textContent=title;el('dialog').querySelector('p').textContent=body;el('resume').textContent=button;el('dialog').showModal();ui();
}
function begin(){clearInput();s=createGame();mode='play';message='Theo dấu đom đóm đến cổng đèn đầu tiên.';messageEnd=240;ui();}
function resume(){el('dialog').close();if(s.status!=='playing'){begin();return;}mode=beforeDialog;ui();}
el('start').onclick=begin;el('resume').onclick=resume;
el('dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});
el('help').onclick=()=>popup('Cách chơi','Dùng WASD hoặc phím mũi tên để di chuyển. Đến gần đom đóm để thu thập. Mang 3 con đến một cổng đèn và nhấn E. Nhấn Space để nhảy né Bóng Mực. Thắp đủ ba đèn để đưa ánh sáng về đảo.','Đã hiểu');
function pause(){if(mode==='play')popup('Tạm dừng','Mây sẽ tiếp tục hành trình từ vị trí hiện tại.','Tiếp tục');}
el('pause').onclick=pause;
function press(k){keys.add(k);if(k==='Space')jump=true;if(k==='KeyE')light=true;}
window.addEventListener('keydown',e=>{if(mode!=='play')return;if(e.code==='Escape'){e.preventDefault();pause();return;}if(controls.has(e.code)){e.preventDefault();if(!e.repeat)press(e.code);}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',pause);
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);press(k);};b.onlostpointercapture=()=>keys.delete(k);});
function frame(t){const dt=Math.min(.12,(t-last)/1000);last=t;let moving=false;
 if(mode==='play'){
  bank+=dt;const has=(a,b)=>Number(keys.has(a)||keys.has(b));const x=has('KeyD','ArrowRight')-has('KeyA','ArrowLeft'),z=has('KeyS','ArrowDown')-has('KeyW','ArrowUp');moving=!!(x||z);
  while(bank>=1/rules.hz&&mode==='play'){
   bank-=1/rules.hz;step(s,{x,z,jump,light});jump=false;light=false;
   if(s.event){message={spark:'Đã thu một đom đóm',light:'Đèn đã sáng!',hit:'Bóng Mực chạm Mây!'}[s.event];messageEnd=s.tick+90;tone({spark:880,light:1175,hit:150}[s.event]);}
   if(s.status==='won')popup('Đảo đã sáng đèn','Mây đã thắp sáng cả ba Đèn Lồng Lớn. Ánh sáng đã trở về đảo.','Chơi lại');
   if(s.status==='lost')popup('Mây lạc trong sương','Bóng Mực đã chạm Mây ba lần. Hãy thử lại hành trình từ bến đảo.','Thử lại');
  }ui();
 }
 draw?.(s,mode==='dialog'?beforeDialog:mode,t/1000,moving);requestAnimationFrame(frame);
}
ui();requestAnimationFrame(frame);