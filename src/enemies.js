import {planar,terrain} from './islands.js';
import {dropMotes} from './motion.js';
const eps=1e-8;
function direction(from,to){
 const d=planar(from,to);
 return d>eps?[(to[0]-from[0])/d,(to[2]-from[2])/d]:[1,0];
}
function translate(s,actor,dx,dz){
 const p=actor.pos,nx=p[0]+dx,nz=p[2]+dz;
 const floor=terrain(s.night,nx,nz),old=terrain(s.night,p[0],p[2]);
 if(!Number.isFinite(floor)||!Number.isFinite(old)||floor>old+.18||(s.night===3&&Math.hypot(nx,nz)<2))return;
 p[0]=nx;p[2]=nz;p[1]+=floor-old;
}
function protectedLamp(s,pos){
 return s.lanterns.find(l=>l.oil>=1800&&planar(l.pos,pos)<6-eps);
}
export function pulse(s){
 const p=s.player;
 if(p.carried<3||p.pulseCD||p.respawn)return;
 p.carried-=3;p.pulseCD=180;s.lastPulse=s.sim;
 const hit=actor=>Math.hypot(actor.pos[0]-p.pos[0],actor.pos[1]-p.pos[1]-.8,actor.pos[2]-p.pos[2])<=5+eps;
 const stunned_ids=[];
 for(const sh of s.shades){
  if(!hit(sh))continue;
  if(sh.state==='drain')s.score+=10;
  sh.state='stunned';sh.left=120;sh.push=15;sh.dir=direction(p.pos,sh.pos);
  stunned_ids.push(sh.id);
 }
 for(const d of s.drifters){
  if(!hit(d))continue;
  if(d.state==='chase'){d.state='flee';d.left=240;}
  else if(d.state==='flee'&&d.stolen){
   dropMotes(s,d.stolen,d.pos,false);s.emit('drifter_drop',{drifter_id:d.id,amount:d.stolen});d.stolen=0;d.left=120;
  }
 }
 s.score+=stunned_ids.length*5;s.emit('pulse',{stunned_ids});
}
export function scheduleSafety(s,lit){
 for(const sh of s.shades){
  if(lit&&planar(sh.pos,lit.pos)<6){sh.eject={lamp:lit,left:30};}
 }
}
function shadeMove(s,sh){
 const p=s.player,old=[...sh.pos];
 if(sh.state==='spawning'&&!sh.left)sh.state='wander';
 if(sh.state==='stunned'&&!sh.left)sh.state='wander';
 let released=false;
 if(sh.state==='drain'){
  const l=s.lanterns.find(l=>l.id===sh.target);
  if(!l?.lit||l.oil>=1800||planar(l.pos,sh.pos)>2){sh.state='wander';released=true;}
  else if(!p.respawn&&planar(p.pos,sh.pos)<=6)sh.state='chase';
 }
 if(sh.state==='drain')return;
 if(sh.state==='stunned'){
  if(sh.push>0){translate(s,sh,sh.dir[0]*4/15,sh.dir[1]*4/15);sh.push--;}
 }else if(sh.state==='recoil'){
  translate(s,sh,sh.dir[0]*2/60,sh.dir[1]*2/60);if(!sh.left)sh.state='wander';
 }else if(sh.state!=='spawning'){
  const d=planar(sh.pos,p.pos);
  if(sh.state==='wander'&&!released&&d<=12&&!p.respawn)sh.state='chase';
  if(sh.state==='chase'&&(d>18||p.respawn))sh.state='wander';
  const speed=s.night===3?4.5:4;
  if(sh.state==='chase'){
   const [x,z]=direction(sh.pos,p.pos),step=Math.min(d,speed/60);translate(s,sh,x*step,z*step);
  }else{
   const weak=s.lanterns.filter(l=>l.lit&&l.oil<1800);
   const target=(weak.length?weak:s.lanterns.filter(l=>!l.lit)).sort((a,b)=>planar(a.pos,sh.pos)-planar(b.pos,sh.pos))[0];
   if(target&&!released){const [x,z]=direction(sh.pos,target.pos),d=planar(sh.pos,target.pos);
    if(d>2||!target.lit)translate(s,sh,x*Math.min(d,speed/60),z*Math.min(d,speed/60));
    if(target.lit&&planar(sh.pos,target.pos)<=2){sh.state='drain';sh.target=target.id;sh.drainTicks=0;}
   }
  }
 }
 if(sh.eject?.lamp.oil<1800)sh.eject=null;
 if(sh.eject){
  const {lamp,left}=sh.eject,d=planar(lamp.pos,sh.pos),[x,z]=direction(lamp.pos,sh.pos);
  if(d<6){const step=(6.00001-d)/left;sh.pos[0]+=x*step;sh.pos[2]+=z*step;}
  if(--sh.eject.left<=0||d>=6)sh.eject=null;
 }
 for(const l of s.lanterns){
  if(l.oil<1800||sh.eject?.lamp===l)continue;
  const d=planar(l.pos,sh.pos);
  if(d<6){const [x,z]=direction(l.pos,sh.pos);sh.pos[0]=l.pos[0]+6*x;sh.pos[2]=l.pos[2]+6*z;}
 }
}
export function moveEnemies(s){
 for(const sh of s.shades)shadeMove(s,sh);
 for(const d of s.drifters){
  if(d.state==='removed')continue;
  const p=s.player,range=planar(d.pos,p.pos),eligible=p.carried>=5&&range<=15&&!p.respawn;
  if(d.state==='idle'&&eligible)d.state='chase';
  else if(d.state==='chase'&&!eligible)d.state='idle';
  if(d.state==='flee'&&!d.left){d.state='removed';continue;}
  let [dx,dz]=direction(d.pos,p.pos),speed=7;
  if(d.state==='idle'){dx=Math.cos(d.heading);dz=Math.sin(d.heading);speed=2;}
  if(d.state==='flee'){dx=-dx;dz=-dz;}
  if(d.state==='chase')speed=Math.min(speed,range*60);
  d.pos[0]+=dx*speed/60;d.pos[2]+=dz*speed/60;
 }
 s.drifters=s.drifters.filter(d=>d.state!=='removed');
}
export function collisions(s){
 const p=s.player;if(p.respawn)return;
 for(const d of s.drifters){
  if(d.state!=='chase'||planar(d.pos,p.pos)>1.2+eps)continue;
  d.stolen=Math.min(3,p.carried);p.carried-=d.stolen;d.state='flee';d.left=240;
  s.emit('drifter_steal',{drifter_id:d.id,amount:d.stolen,carried:p.carried});
 }
 if(p.inv||protectedLamp(s,p.pos))return;
 for(const sh of s.shades){
  if(sh.eject||!['wander','chase'].includes(sh.state)||planar(sh.pos,p.pos)>1+eps||Math.abs(sh.pos[1]-p.pos[1])>1.5+eps)continue;
  const dropped=Math.floor(p.carried/2);p.carried-=dropped;p.flames=Math.max(0,p.flames-1);p.inv=90;
  dropMotes(s,dropped,p.pos,true);
  sh.state='recoil';sh.left=60;sh.dir=direction(p.pos,sh.pos);
  s.emit('player_hit',{by:'shade',flames:p.flames,dropped});break;
 }
}