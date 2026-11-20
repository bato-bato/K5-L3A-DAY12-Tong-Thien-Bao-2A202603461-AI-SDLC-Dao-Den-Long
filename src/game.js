// Fixed-step simulation. X increases east; negative Z is north.
export const rules = Object.freeze({hz:60, speed:5, jump:5.6, gravity:15, pickup:1.35, reach:2.2, cost:3, lives:3, radius:18});
export const shrines = [
 {x:-9,z:5,name:'Bến Trăng'}, {x:0,z:-12,name:'Đồi Nguyệt'}, {x:11,z:4,name:'Vườn Sương'}
];
export const sparks = [[-3,7],[-6,6],[-8,4],[-7,0],[-5,-5],[-2,-9],[3,-8],[6,-4],[9,1],[6,6],[0,8],[2,2]].map(([x,z])=>({x,z}));
export function ground(x,z){return .58 + .28*Math.sin(x*.23)*Math.cos(z*.21) + .22*Math.cos(z*.29);}
export function shadowPositions(tick){
 const t=tick/rules.hz;
 return [{x:-4+2.6*Math.cos(t*.7),z:-2+3*Math.sin(t*.7)},{x:5+3*Math.cos(t*.54),z:1+3.3*Math.sin(t*.54)}];
}
export function createGame(){return {tick:0,x:0,z:9,y:0,vy:0,facing:Math.PI,lives:rules.lives,bag:0,taken:sparks.map(()=>false),lit:shrines.map(()=>false),safeUntil:0,status:'playing',event:''};}
const near=(s,p,r)=>Math.hypot(s.x-p.x,s.z-p.z)<=r;
export function step(s,input={}){
 if(s.status!=='playing')return s;
 s.tick++; s.event='';
 const dx=input.x??0,dz=input.z??0,scale=Math.max(1,Math.hypot(dx,dz));
 if(dx||dz)s.facing=Math.atan2(dx,dz);
 s.x+=dx/scale*rules.speed/rules.hz; s.z+=dz/scale*rules.speed/rules.hz;
 const radius=Math.hypot(s.x,s.z);
 if(radius>rules.radius){s.x*=rules.radius/radius;s.z*=rules.radius/radius;}
 if(input.jump&&s.y===0)s.vy=rules.jump;
 s.vy-=rules.gravity/rules.hz;
 s.y=Math.max(0,s.y+s.vy/rules.hz); if(!s.y)s.vy=0;
 sparks.forEach((p,i)=>{if(!s.taken[i]&&near(s,p,rules.pickup)){s.taken[i]=true;s.bag++;s.event='spark';}});
 if(input.light){
  const i=shrines.findIndex((p,i)=>!s.lit[i]&&near(s,p,rules.reach));
  if(i>=0&&s.bag>=rules.cost){s.bag-=rules.cost;s.lit[i]=true;s.event='light';if(s.lit.every(Boolean)){s.status='won';return s;}}
 }
 if(s.tick>=s.safeUntil&&s.y<.65&&shadowPositions(s.tick).some(p=>near(s,p,1.1))){
  s.lives--;s.safeUntil=s.tick+150;s.event='hit';
  if(!s.lives)s.status='lost';else {s.x=0;s.z=9;s.y=0;s.vy=0;}
 }
 return s;
}
export function summary(s){
 const round=n=>Math.round(n*1000)/1000;
 return {ticks:s.tick,status:s.status,position:[round(s.x),round(s.y),round(s.z)],lives:s.lives,fireflies:s.bag,collected:s.taken.filter(Boolean).length,lanterns:s.lit.map((lit,i)=>({name:shrines[i].name,lit}))};
}
export function replay(actions){
 if(!Array.isArray(actions))throw Error('actions must be an array');
 const s=createGame();let total=0;
 for(const action of actions){
  if(!action||!Number.isInteger(action.ticks)||action.ticks<1||(total+=action.ticks)>360000)throw Error('invalid tick count');
  for(const key of ['x','z'])if(key in action&&(!Number.isFinite(action[key])||Math.abs(action[key])>1))throw Error('invalid axis');
  for(const key of ['jump','light'])if(key in action&&typeof action[key]!=='boolean')throw Error('invalid button');
  for(let i=0;i<action.ticks;i++)step(s,{...action,jump:i===0&&action.jump,light:i===0&&action.light});
 }return summary(s);
}