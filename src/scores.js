import {rank,validEntry} from './ranking.js';
const disk=document.querySelector('meta[name=leaderboard-storage]')?.content==='server';
async function scores(entry){
 if(disk){const r=await fetch('/api/leaderboard',entry?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)}:{});if(!r.ok)throw Error('disk');return (await r.json()).entries;}
 const old=JSON.parse(localStorage.getItem('lantern.ranking')||'[]'),entries=rank(entry?[...old,entry]:old);
 if(entry)localStorage.setItem('lantern.ranking',JSON.stringify(entries));return entries;
}
export function enterScore(score,nights,seed){
 const form=document.querySelector('#save-score');form.hidden=false;form.reset();form.querySelector('button').disabled=false;
 const status=form.querySelector('output');status.textContent='';
 form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');if(button.disabled)return;
 const entry={name:form.elements.name.value,score,nights_won:nights,seed,achieved_at:new Date().toISOString()};
 if(!validEntry(entry))return;button.disabled=true;
 try{await scores(entry);status.textContent='Đã lưu điểm.';}catch{button.disabled=false;status.textContent='Lưu thất bại. Hãy thử lại.';}};
}
export async function showScores(){
 const list=document.querySelector('#ranking');list.hidden=false;list.replaceChildren();
 try{const entries=await scores();for(const e of entries){const li=document.createElement('li');li.textContent=e.name+' · '+e.score+' điểm · '+e.nights_won+'/3 đêm';list.append(li);}
 if(!entries.length)list.textContent='Chưa có điểm đã lưu.';
 const btn=document.createElement('button');btn.textContent='Xuất JSON';btn.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({entries},null,2)],{type:'application/json'}));a.download='leaderboard.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};list.after(btn);document.querySelector('#dialog').addEventListener('close',()=>btn.remove(),{once:true});
 }catch{list.textContent='Không đọc được bảng điểm.';}
}
