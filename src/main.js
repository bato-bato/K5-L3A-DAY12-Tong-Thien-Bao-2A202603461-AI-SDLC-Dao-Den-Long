import {createGame,step,nearestLantern,tuning,timeLeft,HZ} from './game.js';
import {makeWorld} from './world.js';
const el=id=>document.getElementById(id);
let draw;
try{draw=makeWorld(el('world'));}catch(error){el('intro').textContent='Trình duyệt chưa mở được đồ họa 3D. Hãy bật tăng tốc đồ họa và tải lại trang.';el('start').disabled=true;console.error(error);}
let s=createGame(),mode='menu',beforeDialog,muted=true,audio,last=0,bank=0,message='',messageEnd=0;
const keys=new Set(),taps=new Set(),controls=new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE','KeyF']);
function tone(hz,duration=.18){
 if(muted||!audio)return;
 const osc=audio.createOscillator(),amp=audio.createGain(),t=audio.currentTime;osc.frequency.value=hz;amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(.08,t+.02);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
 osc.connect(amp).connect(audio.destination);osc.start();osc.stop(t+duration);
}
el('sound').onclick=async()=>{try{audio??=new AudioContext();await audio.resume();muted=!muted;el('sound').textContent=muted?'♪':'♫';el('sound').setAttribute('aria-label',muted?'Bật âm thanh':'Tắt âm thanh');el('sound').title=el('sound').getAttribute('aria-label');tone(660);}catch{el('sound').title='Âm thanh chưa khả dụng';}};
function ui(){
 el('game').classList.toggle('menu',mode==='menu');el('menu').hidden=mode!=='menu';el('hud').hidden=mode==='menu';el('pause').hidden=mode!=='play';el('touch').hidden=mode!=='play';
 el('count').textContent=s.lanterns.filter(l=>l.lit).length+' / '+tuning.lantern_count_night1;
 el('bag').textContent=s.player.carried+' / '+tuning.carry_capacity;
 el('life').textContent=s.player.flames+' / '+tuning.flames;
 const seconds=Math.ceil(timeLeft(s));
 el('timer').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');el('score').textContent=s.score;
 const lamp=nearestLantern(s);
 const hint=lamp?(s.player.carried?'E · Nạp đèn ':'Gom thêm đom đóm · ')+lamp.id+' ('+lamp.deposited+'/'+tuning.lantern_cost+')':(s.tick<messageEnd?message:'');
 el('prompt').textContent=hint;el('prompt').hidden=mode!=='play'||!hint;
}
function clearInput(){keys.clear();taps.clear();bank=0;}
function popup(title,body,button){
 clearInput();beforeDialog=mode;mode='dialog';el('dialog').querySelector('h2').textContent=title;el('dialog').querySelector('p').textContent=body;el('resume').textContent=button;el('dialog').showModal();ui();
}
function begin(){clearInput();s=createGame();mode='play';message='Đi thẳng theo đom đóm đến Đèn Lồng Lớn đầu tiên.';messageEnd=240;ui();}
function resume(){el('dialog').close();if(s.status!=='playing'){begin();return;}mode=beforeDialog;ui();}
el('start').onclick=begin;el('resume').onclick=resume;
el('dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});
el('help').onclick=()=>popup('Cách chơi','Dùng WASD hoặc phím mũi tên để di chuyển, Space để nhảy. E nạp đom đóm vào đèn, mỗi đèn cần 3 con. F dùng 1 đom đóm để đẩy lùi và làm choáng Bóng Mực. Vùng sáng quanh đèn đã thắp bảo vệ Mây. Thắp đủ 5 đèn trước bình minh.','Đã hiểu');
function pause(){if(mode==='play')popup('Tạm dừng','Mây sẽ tiếp tục hành trình từ vị trí hiện tại.','Tiếp tục');}
el('pause').onclick=pause;
function press(k){keys.add(k);taps.add(k);}
window.addEventListener('keydown',e=>{if(mode!=='play')return;if(e.code==='Escape'){e.preventDefault();pause();return;}if(controls.has(e.code)){e.preventDefault();if(!e.repeat)press(e.code);}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',pause);
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);press(k);};b.onlostpointercapture=()=>keys.delete(k);});
function frame(t){const dt=Math.min(.12,(t-last)/1000);last=t;let moving=false;
 if(mode==='play'){
  bank+=dt;const has=(a,b)=>Number(keys.has(a)||keys.has(b));const x=has('KeyD','ArrowRight')-has('KeyA','ArrowLeft'),z=has('KeyS','ArrowDown')-has('KeyW','ArrowUp');moving=!!(x||z);
  while(bank>=1/HZ&&mode==='play'){
   bank-=1/HZ;const down=k=>keys.has(k)||taps.has(k);
   const events=step(s,{move:[x,z],jump:down('Space'),interact:down('KeyE'),pulse:down('KeyF')});
   taps.clear();
   for(const e of events){
    const feedback={mote_picked:['Đã thu một đom đóm',880],lantern_lit:['Đèn đã sáng!',1175],pulse:['Mây tỏa sáng',740],player_hit:['Bóng Mực chạm Mây!',150]}[e.name];
    if(feedback){message=feedback[0];messageEnd=s.tick+90;tone(feedback[1]);}
   }
   if(s.status==='won')popup('Đảo đã sáng đèn','Mây đã thắp sáng năm ngọn đèn trên Đảo Bến. Điểm của bạn: '+s.score+'.','Chơi lại');
   if(s.status==='lost')popup(s.reason==='dawn'?'Trời đã sáng':'Mây lạc trong sương',(s.reason==='dawn'?'Đêm đã hết trước khi tất cả đèn được thắp.':'Mây đã mất hết lửa sống.')+' Điểm của bạn: '+s.score+'.','Thử lại');
  }ui();
 }
 draw?.(s,mode==='dialog'?beforeDialog:mode,t/1000,moving);requestAnimationFrame(frame);
}
ui();requestAnimationFrame(frame);
