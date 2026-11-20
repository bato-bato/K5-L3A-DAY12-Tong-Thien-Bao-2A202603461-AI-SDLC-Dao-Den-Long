import {terrain,planar,spawnPoint} from './islands.js';
import {tuning as T} from './scenario.js';
const dt=1/60;
export function dropMotes(s,count,center,scatter){
 for(let i=0;i<count;i++){
  const a=scatter?s.random()*2*Math.PI:0,r=scatter?1.5+s.random():0;
  const x=center[0]+r*Math.cos(a),z=center[2]+r*Math.sin(a);
  const floor=terrain(s.night,x,z);
  s.addMote([x,Number.isFinite(floor)?floor:center[1],z],'dropped',480);
 }
}
export function movement(s,edge){
 const p=s.player,v=p.vel,pos=p.pos;
 if(p.respawn){
  if(--p.respawn===0){p.pos=spawnPoint(s.night);p.vel=[0,0,0];p.inv=90;p.grounded=true;p.launch=null;p.dash=0;}
  return;
 }
 let [x,z]=s.controls.move;const scale=Math.max(1,Math.hypot(x,z)),a=s.controls.cam_yaw_deg*Math.PI/180;
 const dx=(x*Math.cos(a)+z*Math.sin(a))/scale,dz=(-x*Math.sin(a)+z*Math.cos(a))/scale;
 if(dx||dz)s.facing=Math.atan2(dx,dz);
 if(edge.jump&&p.grounded){v[1]=7;p.grounded=false;s.jumped=true;}
 if(edge.dash&&!p.dash&&(!p.dashCD||p.charm)){
  p.dash=12;p.dashCD=p.charm?0:90;p.dashDir=[Math.sin(s.facing),Math.cos(s.facing)];s.emit('dash',{});
 }
 if(p.grounded){
  const pad=s.map.pads.find(point=>planar(point,pos)<=1+1e-9&&Math.abs(point[1]-pos[1])<.15);
  if(pad){
   const targetX=pad[0]<35?70:0,d=s.night===2?Math.hypot(targetX-pad[0],pad[2]):1;
   p.launch=s.night===2?[24*(targetX-pad[0])/d,-24*pad[2]/d]:[0,-8];
   v[1]=s.night===2?14:12;p.grounded=false;
  }
 }
 const speed=p.charm?7.2:T.player_speed;
 if(p.dash){v[0]=14*p.dashDir[0];v[2]=14*p.dashDir[1];}
 else if(p.launch){[v[0],v[2]]=p.launch;}
 else{v[0]=dx*speed;v[2]=dz*speed;}
 const wind=s.wind.active?2:0,angle=s.wind.dir_deg*Math.PI/180;
 let nx=pos[0]+(v[0]+wind*Math.cos(angle))*dt,nz=pos[2]+(v[2]+wind*Math.sin(angle))*dt;
 let floor=terrain(s.night,nx,nz);
 if((floor>pos[1]+.15)||(s.night===3&&Math.hypot(nx,nz)<2&&pos[1]<14)){
   nx=pos[0];nz=pos[2];floor=terrain(s.night,nx,nz);v[0]=v[2]=0;
 }
 pos[0]=nx;pos[2]=nz;
 if(!p.dash){
  v[1]-=20*dt;pos[1]+=v[1]*dt;
  if(pos[1]<=floor+1e-9&&v[1]<=0){pos[1]=floor;v[1]=0;p.grounded=true;p.launch=null;}
  else p.grounded=false;
 }else{p.dash--;if(pos[1]>floor+.02)p.grounded=false;}
 if(pos[1]<-10){
   const lost=p.carried;p.carried=0;p.flames=Math.max(0,p.flames-1);p.respawn=60;p.vel=[0,0,0];p.dash=0;p.launch=null;p.grounded=false;
   s.emit('player_hit',{by:'fall',flames:p.flames,dropped:0,lost});
 }
}