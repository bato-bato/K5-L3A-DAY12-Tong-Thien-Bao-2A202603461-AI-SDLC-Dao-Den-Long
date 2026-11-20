import {tuning, validateScenario} from './scenario.js';
export {tuning};
export const HZ=60;
export const shrines=[
  {name:'Bến Trăng',x:0,z:-9}, {name:'Đồi Nguyệt',x:-12,z:-9},
  {name:'Vườn Sương',x:-12,z:6}, {name:'Bến Mây',x:3,z:6}, {name:'Đồi Sao',x:12,z:-6}
];
const trail=[[0,-2],[0,-5],[0,-7],[-3,-9],[-6,-9],[-9,-9],[-12,-5],[-12,-1],[-12,3],[-9,6],[-5,6],[-1,6],[6,6],[10,6],[12,2],[12,-2]];
// The walkable surface is at Y=0; only the firefly artwork hovers above it.
export const ground=()=>0;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const within=(a,b,r)=>distance(a,b)<=r+1e-10;
const secondsToTicks=seconds=>Math.round(seconds*HZ);
const copyPos=pos=>[...pos];
function randomGenerator(seed) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function randomPos(s,inner,outer) {
  const angle=s.random()*Math.PI*2, radius=inner+(outer-inner)*s.random();
  return [radius*Math.cos(angle),0,radius*Math.sin(angle)];
}
function mote(s,pos){return {id:'M'+(++s.nextMote),pos:copyPos(pos)};}
function shade(id,pos){return {id,pos:copyPos(pos),state:'chase',stunUntil:0};}
function nextShadeId(s){
  let id;
  do{id='S'+(++s.nextShade);}while(s.shadeIds.has(id));
  s.shadeIds.add(id);return id;
}
export function createGame(seed=12,config={}) {
  validateScenario(config);
  const p=config.player??{}, lanterns=shrines.map((l,i)=>({id:'L'+(i+1),pos:[l.x,0,l.z],deposited:0,lit:false}));
  for(const override of config.lanterns??[]){
    const l=lanterns.find(l=>l.id===override.id);
    Object.assign(l,override);l.pos=copyPos(l.pos);
  }
  const s={
    tick:0,status:'playing',reason:null,score:0,duration:config.time_left_s??tuning.night1_duration_s,
    player:{pos:copyPos(p.pos??[0,0,0]),flames:p.flames??tuning.flames,carried:p.carried??0},
    lanterns,motes:[],shades:[],events:[],nextMote:0,nextShade:0,shadeIds:new Set(),
    random:randomGenerator(seed),randomMotes:config.random_motes??true,randomShades:config.random_shades??true,
    controls:{move:[0,0],cam_yaw_deg:0,interact:false,pulse:false,jump:false,dash:false},
    vy:0,facing:Math.PI,invulnUntil:0,nextPulse:0,lastPulse:-Infinity
  };
  const defaultMotes=()=>trail.map(([x,z])=>[x,0,z]).concat(Array.from({length:8},()=>randomPos(s,4,17)));
  const positions=config.motes??(s.randomMotes?defaultMotes():[]);
  s.motes=positions.map(p=>mote(s,p));
  const shades=config.shades??(s.randomShades?[{pos:randomPos(s,22,24)},{pos:randomPos(s,24,27)}]:[]);
  for(const entry of shades)if(entry.id)s.shadeIds.add(entry.id);
  s.shades=shades.map(entry=>shade(entry.id??nextShadeId(s),entry.pos));
  return s;
}
export const timeLeft=s=>Math.max(0,s.duration-s.tick/HZ);
function event(s,name,data){s.events.push({type:'event',tick:s.tick,name,data});}
function finish(s,state,reason){
  s.status=state;s.reason=reason;
  if(state==='won')s.score+=Math.floor(timeLeft(s))*tuning.score.per_second_left+s.player.flames*tuning.score.per_flame_left;
  event(s,'game_over',{result:state,reason});
}
function movePlayer(s,jump){
  const p=s.player.pos, [x,z]=s.controls.move, yaw=s.controls.cam_yaw_deg*Math.PI/180;
  const scale=Math.max(1,Math.hypot(x,z));
  const dx=(x*Math.cos(yaw)+z*Math.sin(yaw))/scale,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))/scale;
  if(dx||dz){
    s.facing=Math.atan2(dx,dz);
    // A test scenario may place the player beyond the default island edge.
    const maxRadius=Math.max(39,Math.hypot(p[0],p[2]),...s.lanterns.map(l=>Math.hypot(l.pos[0],l.pos[2])));
    p[0]+=dx*tuning.player_speed/HZ;p[2]+=dz*tuning.player_speed/HZ;
    const r=Math.hypot(p[0],p[2]);if(r>maxRadius){p[0]*=maxRadius/r;p[2]*=maxRadius/r;}
  }
  if(jump&&p[1]===0)s.vy=5.6;
  s.vy-=15/HZ;p[1]=Math.max(0,p[1]+s.vy/HZ);if(!p[1])s.vy=0;
}
function collect(s){
  s.motes=s.motes.filter(m=>{
    if(s.player.carried===tuning.carry_capacity||!within(s.player.pos,m.pos,tuning.pickup_radius))return true;
    s.player.carried++;s.score+=tuning.score.per_mote;event(s,'mote_picked',{carried:s.player.carried});return false;
  });
}
export function nearestLantern(s){
  let nearest=null,best=Infinity;
  for(const l of s.lanterns){
    const d=distance(l.pos,s.player.pos);
    if(!l.lit&&d<=tuning.interact_radius+1e-10&&d<best){nearest=l;best=d;}
  }
  return nearest;
}
function deposit(s){
  const l=nearestLantern(s);if(!l)return;
  const amount=Math.min(s.player.carried,tuning.lantern_cost-l.deposited);
  if(amount<=0)return;
  s.player.carried-=amount;l.deposited+=amount;
  event(s,'deposit',{lantern_id:l.id,amount,deposited:l.deposited});
  if(l.deposited===tuning.lantern_cost){l.lit=true;s.score+=tuning.score.per_lantern;event(s,'lantern_lit',{lantern_id:l.id});}
}
function pulse(s){
  if(s.player.carried<tuning.pulse_cost||s.tick<s.nextPulse)return;
  s.player.carried-=tuning.pulse_cost;s.nextPulse=s.tick+secondsToTicks(tuning.pulse_cooldown_s);s.lastPulse=s.tick;
  const stunned_ids=[];
  for(const sh of s.shades){
    if(!within(sh.pos,s.player.pos,tuning.pulse_radius))continue;
    const d=distance(sh.pos,s.player.pos),dx=d?(sh.pos[0]-s.player.pos[0])/d:1,dz=d?(sh.pos[2]-s.player.pos[2])/d:0;
    sh.pos[0]+=dx*tuning.pulse_push_m;sh.pos[2]+=dz*tuning.pulse_push_m;
    sh.state='stunned';sh.stunUntil=s.tick+secondsToTicks(tuning.pulse_stun_s);stunned_ids.push(sh.id);
  }
  s.score+=stunned_ids.length*tuning.score.per_stun;event(s,'pulse',{stunned_ids});
}
function protectLanterns(s,sh) {
  for(const l of s.lanterns){
    if(!l.lit)continue;
    const d=distance(sh.pos,l.pos);
    if(d>tuning.safe_radius)continue;
    const r=tuning.safe_radius+0.001;
    const dx=d?(sh.pos[0]-l.pos[0])/d:1,dz=d?(sh.pos[2]-l.pos[2])/d:0;
    sh.pos[0]=l.pos[0]+dx*r;sh.pos[2]=l.pos[2]+dz*r;
  }
}
function updateShades(s){
  const p=s.player;
  for(const sh of s.shades){
    if(s.tick<sh.stunUntil){protectLanterns(s,sh);continue;}
    sh.state='chase';
    const d=distance(sh.pos,p.pos);
    if(d>0){
      const travel=Math.min(d,tuning.shade_speed/HZ)/d;
      sh.pos[0]+=(p.pos[0]-sh.pos[0])*travel;sh.pos[2]+=(p.pos[2]-sh.pos[2])*travel;
    }
    protectLanterns(s,sh);
    if(s.tick<s.invulnUntil||!within(p.pos,sh.pos,tuning.shade_hit_radius))continue;
    if(s.lanterns.some(l=>l.lit&&within(p.pos,l.pos,tuning.safe_radius)))continue;
    p.flames=Math.max(0,p.flames-1);s.invulnUntil=s.tick+secondsToTicks(tuning.invuln_s);
    event(s,'player_hit',{by:'shade',flames:p.flames,dropped:0});if(!p.flames)break;
  }
}
export function step(s,frame={}){
  if(s.status!=='playing')return [];
  const pressed={};
  for(const key of ['interact','pulse','jump'])pressed[key]=frame[key]===true&&!s.controls[key];
  Object.assign(s.controls,frame);s.tick++;s.events=[];
  movePlayer(s,pressed.jump);collect(s);
  if(pressed.interact)deposit(s);
  if(pressed.pulse)pulse(s);
  if(s.lanterns.every(l=>l.lit))finish(s,'won','all_lit');
  else {
    updateShades(s);
    if(!s.player.flames)finish(s,'lost','no_flames');
    else if(timeLeft(s)<=0)finish(s,'lost','dawn');
    else {
      if(s.randomMotes&&s.tick%(4*HZ)===0&&s.motes.length<28)s.motes.push(mote(s,randomPos(s,2,18)));
      if(s.randomShades&&s.tick%(18*HZ)===0&&s.shades.length<6){
        const sh=shade(nextShadeId(s),randomPos(s,21,27));s.shades.push(sh);event(s,'shade_spawned',{id:sh.id});
      }
    }
  }
  return s.events;
}
function coordinates(pos){return pos.map(n=>Math.round(n*1000)/1000);}
export function snapshot(s){
  const p=s.player;
  return {type:'snapshot',tick:s.tick,sim_tick:s.tick,state:s.status,time_left_s:timeLeft(s),score:s.score,
    player:{pos:coordinates(p.pos),flames:p.flames,carried:p.carried},
    lanterns:s.lanterns.map(l=>({...l,pos:coordinates(l.pos)})),
    shades:s.shades.map(sh=>({id:sh.id,pos:coordinates(sh.pos),state:sh.state})),
    motes_active:s.motes.length,motes:s.motes.map(m=>({id:m.id,pos:coordinates(m.pos)}))};
}
export function simulate({seed,scenario,frames,ticks,snapshotEvery},emit) {
  const s=createGame(seed,scenario);
  emit(snapshot(s));let index=0;
  while(s.tick<ticks&&s.status==='playing'){
    const frame=frames[index]?.tick===s.tick?frames[index++]:undefined;
    for(const e of step(s,frame))emit(e);
    if(s.tick%snapshotEvery===0)emit(snapshot(s));
  }
  emit({type:'end',ticks:s.tick,state:s.status,score:s.score});
}
