const defaults={KeyW:['KeyW','ArrowUp'],KeyS:['KeyS','ArrowDown'],KeyA:['KeyA','ArrowLeft'],KeyD:['KeyD','ArrowRight'],Space:['Space'],ShiftLeft:['ShiftLeft','ShiftRight'],KeyE:['KeyE'],KeyF:['KeyF'],KeyP:['KeyP','Escape']};
const labels={KeyW:'Tiến',KeyS:'Lùi',KeyA:'Trái',KeyD:'Phải',Space:'Nhảy',ShiftLeft:'Lướt',KeyE:'Tương tác',KeyF:'Tỏa sáng',KeyP:'Tạm dừng'};
export function preference(key,value){try{if(value!==undefined)localStorage.setItem('lantern.'+key,value);return localStorage.getItem('lantern.'+key);}catch{return null;}}
let keys=structuredClone(defaults);
try{Object.assign(keys,JSON.parse(preference('bindings')));}catch{}
export function mapped(code){return Object.keys(keys).find(id=>keys[id].includes(code));}
export const keyName=code=>code.replace(/^Key|^Digit/,'').replace(/^ShiftLeft$/,'Shift').replace(/^Space$/,'Space');
export const binding=id=>keyName(keys[id][0]);
export function initPreferences(){
 const area=document.querySelector('#keymap'),msg=document.querySelector('#key-feedback');let capture=null;
 function render(){area.replaceChildren();for(const [id,label] of Object.entries(labels)){
  const b=document.createElement('button');b.type='button';b.textContent=label+' · '+keys[id].map(keyName).join(' / ');
  b.onclick=()=>{capture=id;msg.textContent='Nhấn phím mới cho '+label;};area.append(b);
 }document.querySelectorAll('#legend kbd').forEach((k,i)=>k.textContent=i===0?['KeyW','KeyA','KeyS','KeyD'].map(binding).join(' '):binding(['','Space','ShiftLeft','KeyE','KeyF'][i]));}
 window.addEventListener('keydown',e=>{
  if(!capture||document.querySelector('#sliders').hidden)return;
  e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
  const owner=mapped(e.code);if(owner&&owner!==capture){msg.textContent='Phím đã dùng cho '+labels[owner]+'. Chọn phím khác.';return;}
  keys[capture]=[e.code];capture=null;preference('bindings',JSON.stringify(keys));msg.textContent='Đã lưu phím.';render();
 },true);
 document.querySelector('#dialog').addEventListener('close',()=>{capture=null;msg.textContent='';});
 document.querySelector('#defaults').onclick=()=>{keys=structuredClone(defaults);capture=null;preference('bindings',JSON.stringify(keys));msg.textContent='Đã khôi phục phím mặc định.';render();};render();
 for(const id of ['reduced','large']){
  const input=document.getElementById(id);input.checked=preference(id)==='1';const apply=()=>document.body.classList.toggle(id,input.checked);
  input.onchange=()=>{preference(id,input.checked?'1':'0');apply();};apply();
 }
}
