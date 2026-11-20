import {tuning,validateScenario} from './scenario.js';
import {maps,planar,spawnPoint,terrain} from './islands.js';
import {movement} from './motion.js';
import {collisions,moveEnemies,pulse,scheduleSafety} from './enemies.js';
export {tuning,maps};export const HZ=60;
const duration=[0,300,330,360];
const rounded=n=>Math.round(n*1000)/1000;
const coords=p=>p.map(rounded);
const compareId=(a,b)=>a.id.localeCompare(b.id,'en',{numeric:true});
function rng(seed){
 let state=seed>>>0;
 return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function pick(s,choices){return choices[Math.floor(s.random()*choices.length)];}
function id(s,key,prefix){
 let label;do{label=prefix+(++s.serial[key]);}while(s.used.has(label));s.used.add(label);return label;
}
function makeShade(s,spec,spawn=false){
 return {id:spec.id??id(s,'shade','S'),pos:[...spec.pos],state:spec.state??(spawn?'spawning':'chase'),
 left:spec.state_ticks_left??(spawn?60:0),heading:s.random()*2*Math.PI,push:0,dir:[1,0],eject:null};
}
function makeDrifter(s,spec){
 return {id:spec.id??id(s,'drifter','D'),pos:[...spec.pos],state:spec.state??'idle',stolen:spec.stolen??0,left:spec.state_ticks_left??(spec.state==='flee'?240:0),heading:s.random()*2*Math.PI};
}
function spawnMote(s){
 if(s.motes.length>=30)return;
 const open=s.map.motes.filter(p=>!s.motes.some(m=>m.kind==='random'&&planar(m.pos,p)<.001));
 if(open.length)s.addMote(pick(s,open),'random',0);
}
export function createGame(seed=12,config={},night=1){
 validateScenario(config,night);
 const map=maps[night],pc=config.player??{},pos=[...(pc.pos??spawnPoint(night))];
 const s={night,map,random:rng(seed),tick:0,sim:0,status:'playing',reason:null,score:0,duration:config.time_left_s??duration[night],
  rngMotes:config.random_motes??true,rngShades:config.random_shades??true,rngDrifters:config.random_drifters??true,windEnabled:config.wind_enabled??true,
  serial:{shade:0,mote:0,drifter:0},used:new Set(),events:[],motes:[],shades:[],drifters:[],facing:0,lastPulse:-Infinity,jumped:false,
  wind:{active:false,dir_deg:0},controls:{move:[0,0],cam_yaw_deg:0,jump:false,dash:false,pulse:false,interact:false,pause:false},
  lanterns:map.lamps.map((pos,i)=>({id:'L'+(i+1),pos:[...pos],lit:false,deposited:0})),
  player:{pos,vel:[0,0,0],carried:pc.carried??0,flames:pc.flames??3,inv:pc.invuln_ticks??0,dashCD:pc.dash_cd_ticks??0,
   pulseCD:pc.pulse_cd_ticks??0,charm:pc.charm_ticks??0,dash:0,dashDir:[0,1],respawn:0,launch:null,grounded:false}
 };
 s.emit=(name,data)=>s.events.push({type:'event',tick:s.tick,name,data});
 s.addMote=(p,kind='random',ttl=0)=>s.motes.push({id:id(s,'mote','M'),pos:[...p],kind,ttl});
 s.player.grounded=Math.abs(pos[1]-terrain(night,pos[0],pos[2]))<1e-6;
 for(const l of config.lanterns??[]){const dst=s.lanterns.find(v=>v.id===l.id);Object.assign(dst,l);dst.pos=[...dst.pos];}
 if(config.motes){for(const p of config.motes)s.addMote(p);}else if(s.rngMotes){for(let i=0;i<20;i++)spawnMote(s);}
 for(const actor of [...config.shades??[],...config.drifters??[]])if(actor.id)s.used.add(actor.id);
 s.shades=(config.shades??[]).map(spec=>makeShade(s,spec)).sort(compareId);
 s.drifters=(config.drifters??[]).map(spec=>makeDrifter(s,spec));
 const charms=config.charms??map.charms.map((pos,i)=>({id:'C'+(i+1),pos}));
 s.charms=charms.map((c,i)=>({id:c.id??'C'+(i+1),pos:[...(c.pos??map.charms[i]??[0,0,0])],available:c.available??true,left:c.respawn_ticks??Math.round((c.respawn_s??(c.available===false?45:0))*60)}));
 return s;
}
export const timeLeft=s=>Math.max(0,s.duration-s.sim/60);
export function nearestLantern(s,range=2){
 let best=null,bestDistance=range+1e-8;
 for(const l of s.lanterns){const d=planar(l.pos,s.player.pos);if(!l.lit&&d<bestDistance-1e-10){best=l;bestDistance=d;}}
 return best;
}
function tickTimers(s){
 const p=s.player;
 for(const k of ['inv','dashCD','pulseCD','charm'])if(p[k]>0)p[k]--;
 for(const c of s.charms)if(!c.available){if(c.left>0)c.left--;if(!c.left)c.available=true;}
 for(const a of [...s.shades,...s.drifters])if(a.left>0)a.left--;
 s.motes=s.motes.filter(m=>m.kind!=='dropped'||--m.ttl>0);
 if(s.night===3&&s.windEnabled){
  const phase=s.sim%1800;
  if(phase===1680)s.wind.dir_deg=s.random()*360;
  s.wind.active=s.sim>=1800&&phase<300;
 }
}
function collect(s){
 const p=s.player;
 s.motes=s.motes.filter(m=>{
  if(p.carried>=10||planar(m.pos,p.pos)>1+1e-8||Math.abs(m.pos[1]-p.pos[1])>1.5+1e-8)return true;
  p.carried++;s.emit('mote_picked',{carried:p.carried});return false;
 });
 for(const c of s.charms){
  if(!c.available||planar(c.pos,p.pos)>1+1e-8||Math.abs(c.pos[1]-p.pos[1])>1.5)continue;
  c.available=false;c.left=2700;p.charm=600;p.dashCD=0;s.emit('charm_picked',{charm_id:c.id,charm_ticks:600});
 }
}
function deposit(s){
 const l=nearestLantern(s);if(!l)return;
 const amount=Math.min(s.player.carried,10-l.deposited);if(!amount)return;
 l.deposited+=amount;s.player.carried-=amount;s.score+=10*amount;
 s.emit('deposit',{lantern_id:l.id,amount,deposited:l.deposited});
 if(l.deposited===10){l.lit=true;s.score+=100;s.emit('lantern_lit',{lantern_id:l.id});scheduleSafety(s,l);}
}
function spawn(s){
 if(s.rngMotes&&s.sim%240===0)spawnMote(s);
 const first=s.sim===300,later=s.sim>300&&(s.sim-300)%s.map.interval===0;
 if(s.rngShades&&(first||later)){
  for(let i=0;i<(first?2:1)&&s.shades.length<s.map.cap;i++){
   const valid=s.map.spawns.filter(p=>planar(p,s.player.pos)>=15&&!s.shades.some(sh=>planar(p,sh.pos)<1)&&!s.lanterns.some(l=>l.lit&&planar(l.pos,p)<6));
   if(!valid.length)break;
   const point=pick(s,valid),sh=makeShade(s,{pos:[point[0],point[1]+.8,point[2]]},true);
   s.shades.push(sh);s.shades.sort(compareId);s.emit('shade_spawned',{id:sh.id});
  }
 }
 if(s.night>=2&&s.rngDrifters&&s.sim%1200===0&&s.drifters.length<2){
  const p=pick(s,s.map.spawns);s.drifters.push(makeDrifter(s,{pos:[p[0],p[1]+.8,p[2]]}));
 }
}
function finish(s,reason){
 s.reason=reason;s.status=reason==='all_lit'?'won':'lost';
 if(s.status==='won')s.score+=Math.floor(timeLeft(s))*2+50*s.player.flames;
 s.emit('game_over',{result:s.status,reason});
}
export function step(s,frame={}){
 if(s.status==='won'||s.status==='lost')return [];
 const edge={};for(const k of ['jump','dash','pulse','interact','pause'])edge[k]=frame[k]===true&&!s.controls[k];
 Object.assign(s.controls,frame);s.tick++;s.events=[];s.jumped=false;
 if(edge.pause){s.status=s.status==='paused'?'playing':'paused';s.emit(s.status==='paused'?'paused':'resumed',{});}
 if(s.status==='paused')return s.events;
 s.sim++;tickTimers(s);movement(s,edge);
 if(!s.player.respawn){collect(s);if(edge.interact)deposit(s);if(edge.pulse)pulse(s);}
 moveEnemies(s);collisions(s);spawn(s);
 if(s.player.flames<=0)finish(s,'no_flames');else if(s.lanterns.every(l=>l.lit))finish(s,'all_lit');else if(timeLeft(s)<=0)finish(s,'dawn');
 return s.events;
}
export function snapshot(s){
 const p=s.player;
 return {type:'snapshot',night:s.night,tick:s.tick,sim_tick:s.sim,state:s.status,time_left_s:timeLeft(s),score:s.score,wind:{...s.wind},
 player:{pos:coords(p.pos),vel:coords(p.vel),grounded:p.grounded,invuln:p.inv>0,dash_cd_s:p.dashCD/60,pulse_cd_s:p.pulseCD/60,charm_s:p.charm/60,flames:p.flames,carried:p.carried},
 lanterns:s.lanterns.map(l=>({...l,pos:coords(l.pos)})),shades:s.shades.map(sh=>({id:sh.id,pos:coords(sh.pos),state:sh.state})),
 motes_active:s.motes.length,motes:s.motes.map(m=>({id:m.id,pos:coords(m.pos),kind:m.kind,ttl_s:m.ttl/60})),
 drifters:s.drifters.map(d=>({id:d.id,pos:coords(d.pos),state:d.state,stolen:d.stolen})),
 charms:s.charms.map(c=>({id:c.id,pos:coords(c.pos),available:c.available,respawn_s:c.left/60}))};
}
export function simulate({seed,night=1,scenario,frames,ticks,snapshotEvery},emit){
 const s=createGame(seed,scenario,night);let i=0;
 emit(snapshot(s));emit({type:'event',tick:0,name:'night_start',data:{night}});
 while(s.tick<ticks&&s.status!=='won'&&s.status!=='lost'){
  const frame=frames[i]?.tick===s.tick?frames[i++]:undefined;
  for(const e of step(s,frame))emit(e);
  if(s.tick%snapshotEvery===0)emit(snapshot(s));
 }
 emit({type:'end',ticks:s.tick,state:s.status,score:s.score});
}