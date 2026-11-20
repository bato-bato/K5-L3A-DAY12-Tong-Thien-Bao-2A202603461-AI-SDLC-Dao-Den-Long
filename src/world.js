import * as T from 'three';
import {maps,terrain} from './islands.js';
import {nearestLantern} from './game.js';

const C={sky:0x0e1430,fog:0x1b2350,grass:0x2f5d50,sand:0xc9b48a,wood:0x6b4a2f,sea:0x12384a,
 lit:0xffb347,core:0xffe9b0,dark:0x5b5f6e,fly:0xfff6c2,halo:0xffe58a,ink:0x120a1a,violet:0x7a3cff,stun:0x3a3450,
 coat:0xe8e2d0,scarf:0xc8102e,gold:0xf2c14e,green:0x8fa3b8};
const geo={box:new T.BoxGeometry(),ball:new T.IcosahedronGeometry(1,1),rock:new T.IcosahedronGeometry(1,0),
 pole:new T.CylinderGeometry(1,1,1,20),land:new T.CylinderGeometry(1,1,1,72),cone:new T.ConeGeometry(1,1,10),
 ring:new T.TorusGeometry(1,.029,5,48),disc:new T.CylinderGeometry(1,1,.018,48)};
const dummy=new T.Object3D(),color=new T.Color();
function pose(x,y,z,sx,sy,sz,ry=0,rx=0,rz=0){
 dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();return dummy.matrix;
}
// Batch repeated scenery and characters by geometry. Both UI and session profiling use this renderer.
function layer(parent,materials,dynamic=false){
 const batches=new Map();
 function add(g,c,x,y,z,sx,sy,sz,ry=0,rx=0,rz=0,glow=false){
  const key=g+Number(glow);let batch=batches.get(key);
  if(!batch){
   const mesh=new T.InstancedMesh(geo[g],glow?materials.glow:materials.solid,dynamic?320:2400);
   mesh.frustumCulled=false;mesh.count=0;parent.add(mesh);batch={mesh};batches.set(key,batch);
  }
  const m=batch.mesh,i=m.count++;m.setMatrixAt(i,pose(x,y,z,sx,sy,sz,ry,rx,rz));m.setColorAt(i,color.setHex(c));
 }
 function flush(){for(const {mesh} of batches.values()){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
 return {add,flush,reset(){for(const {mesh} of batches.values())mesh.count=0;},dispose(){for(const {mesh} of batches.values()){parent.remove(mesh);mesh.dispose();}}};
}
function sceneMap(scene,night,mats){
 const b=layer(scene,mats),put=b.add,extra=[];
 for(const [cx,r] of maps[night].islands){
  put('land',C.wood,cx,-2,0,r,3.8,r);put('land',C.sand,cx,-.16,0,r,.29,r);
  put('land',C.grass,cx,-.05,0,r-.4,.10,r-.4);
  for(let i=0;i<560;i++){
   const a=i*2.39996,r1=Math.sqrt((i+.5)/560)*r*.98,x=cx+Math.cos(a)*r1,z=Math.sin(a)*r1,base=terrain(night,x,z);
   const tint=i%5?0x487764:0x79977e;
   put('cone',tint,x,base+.18,z,.09,.40,.09,a,.14);
   if(i%4===0){put('cone',tint,x+.13,base+.09,z,.085,.24,.08,-a,0,-.4);put('rock',0xa9a9a0,x+.1,base+.35,z,.065,.075,.065);}
  }
  for(let i=0;i<48;i++){
   const a=i*2.4,x=cx+Math.cos(a)*(r-.6),z=Math.sin(a)*(r-.6);
   put('rock',i%2?0x58716b:0x7c7870,x,0,z,1+i%3*.4,.38+i%4*.2,.9,a);
  }
  for(let i=0;i<28;i++){
   const a=i*2.399,r1=r*(.78+.15*(Math.sin(i*32)+1)/2),x=cx+Math.cos(a)*r1,z=Math.sin(a)*r1;
   if(maps[night].lamps.some(p=>Math.hypot(x-p[0],z-p[2])<3))continue;
   const h=terrain(night,x,z);put('pole',C.wood,x,h+.8,z,.13,1.6,.13);
   for(let j=0;j<3;j++)put('cone',j%2?0x3e7564:C.grass,x,h+1.7+j*.53,z,1.05-j*.2,1.7-j*.2,1.05-j*.2);
  }
  for(let i=0;i<42;i++){const a=i*2.399,r1=r+4+i%7;
   put('ball',0x686c97,cx+Math.cos(a)*r1,-2.7-i%3*.35,Math.sin(a)*r1,4.6+i%4,1.05,3.1+i%3);}
 }
 if(night===1){
  for(let i=0;i<26;i++)put('box',C.wood,0,.08,36+i*.40,3,.18,.37);
  for(const side of [-1,1])for(const z of [37,42,46])put('pole',C.wood,side*1.45,.25,z,.13,1.3,.13);
 }
 for(const [x,y,z] of maps[night].lamps){
  for(let j=1;j<=5;j++){
   const a=j*1.21;put('rock',C.sand,x+Math.cos(a)*1.42,y+.035,z+Math.sin(a)*1.42,.42,.055,.37,a);
  }
 }
 if(night===2){
  for(let i=0;i<40;i++)put('box',C.wood,26+i*.46,-.1,0,.42,.2,4);
 }
 if(night===3){
  const vertices=[],tri=(...points)=>vertices.push(...points.flat());
  const point=(r,y,a)=>[r*Math.cos(a),y,r*Math.sin(a)];
  for(let i=0;i<64;i++){
   const a=i*Math.PI/64,c=(i+1)*Math.PI/64;
   const A=point(12,3,a),B=point(24,3,a),D=point(12,3,c),E=point(24,3,c);
   tri(A,D,B);tri(B,D,E);
   for(const r of [12,24]){const bot=point(r,0,a),bot2=point(r,0,c),top=point(r,3,a),top2=point(r,3,c);tri(bot,top,bot2);tri(bot2,top,top2);}
  }
  for(const ang of [Math.PI/6,5*Math.PI/6]){
   const edge=(r,y,side)=>[r*Math.cos(ang)-side*Math.sin(ang),y,r*Math.sin(ang)+side*Math.cos(ang)];
   const l=edge(24,3,-1.5),r=edge(24,3,1.5),ll=edge(30,.04,-1.5),rr=edge(30,.04,1.5);tri(l,r,ll);tri(r,rr,ll);
  }
  const shape=new T.BufferGeometry();shape.setAttribute('position',new T.Float32BufferAttribute(vertices,3));shape.computeVertexNormals();
  const material=new T.MeshLambertMaterial({color:C.grass,side:T.DoubleSide});const terraces=new T.Mesh(shape,material);scene.add(terraces);extra.push(terraces);
  put('land',C.grass,0,3,0,8,6,8);put('pole',C.wood,0,10,0,2,8,2);put('cone',C.gold,0,14.5,0,2.6,1.1,2.6);
 }
 for(const [x,y,z] of maps[night].pads){
  put('disc',C.gold,x,y+.05,z,1,1,1,0,0,0,true);put('ring',C.core,x,y+.08,z,.8,.8,.8,0,Math.PI/2,0,true);
 }
 for(const [x,y,z] of maps[night].lamps){
  put('pole',C.sand,x,y+.12,z,1.04,.24,1.04);
  for(const dx of [-.9,.9])put('box',C.wood,x+dx,y+1.65,z,.19,3.25,.24);
  put('box',C.wood,x,y+3.32,z,2.5,.23,.34);put('box',C.dark,x,y+3.5,z,2.8,.15,.59);
 }
 for(let i=0;i<32;i++){
  const a=i*.41,r=85+i%4*12;put('cone',i%2?0x353954:0x494761,Math.cos(a)*r,-2,Math.sin(a)*r,8+i%8,10+i%13,9);
 }
 for(let i=0;i<24;i++){const a=i*2.399,r=55+i%3*6;put('ball',C.lit,Math.cos(a)*r,6+i%11,Math.sin(a)*r,.22,.31,.22,0,0,0,true);}
 b.flush();return ()=>{b.dispose();for(const o of extra){scene.remove(o);o.geometry.dispose();o.material.dispose();}};
}
export function makeWorld(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1));const scene=new T.Scene(),camera=new T.PerspectiveCamera(51,1,.1,210);
 scene.background=new T.Color(C.sky);scene.fog=new T.FogExp2(C.fog,.012);
 const ambient=new T.AmbientLight(0xffffff,.15);scene.add(ambient);
 const key=new T.DirectionalLight(0xffead0,1.38);key.position.set(-14,26,-9);scene.add(key);
 // Faint halos use additive blending. Their projected size follows the same perspective as each firefly.
 const haloTexture=document.createElement('canvas');haloTexture.width=haloTexture.height=64;
 const ctx=haloTexture.getContext('2d'),grad=ctx.createRadialGradient(32,32,0,32,32,32);
 grad.addColorStop(0,'rgba(255,255,255,.92)');grad.addColorStop(.18,'rgba(255,255,255,.65)');grad.addColorStop(.52,'rgba(255,255,255,.18)');grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
 const haloMat=new T.SpriteMaterial({map:new T.CanvasTexture(haloTexture),color:C.halo,blending:T.AdditiveBlending,depthWrite:false,transparent:true});
 const sprites=[];let used=0;
 function halo(x,y,z,size){if(!sprites[used]){sprites[used]=new T.Sprite(haloMat);scene.add(sprites[used]);}const g=sprites[used++];g.visible=true;g.position.set(x,y,z);g.scale.setScalar(size);}
 const mats={solid:new T.MeshLambertMaterial(),glow:new T.MeshBasicMaterial()};
 const backdrop=layer(scene,mats);
 backdrop.add('disc',C.sea,30,-4,0,175,1,175);
 backdrop.add('ball',C.core,-34,30,-92,6,6,6,0,0,0,true);
 for(let i=0;i<260;i++){const a=i*2.399,h=.05+((i*173)%223)/245,r=140*Math.sqrt(1-h*h);backdrop.add('ball',C.fly,Math.cos(a)*r,h*140,Math.sin(a)*r,.11,.11,.11,0,0,0,true);}
 backdrop.flush();
 const actors=layer(scene,mats,true),put=actors.add,look=new T.Vector3(),target=new T.Vector3(),projected=new T.Vector3();
 let previousNight=0,disposeMap=()=>{},lastMode;
 function body(s,t){
  const p=s.player,[x,y,z]=p.pos;
  if(p.respawn||p.inv&&Math.floor(s.sim/6)%2)return;
  const yaw=s.facing,local=(dx,h,dz)=>[x+dx*Math.cos(yaw)+dz*Math.sin(yaw),y+h,z-dx*Math.sin(yaw)+dz*Math.cos(yaw)];
  put('cone',C.coat,x,y+.78,z,.45,.9,.45,yaw);
  put('ball',0xd4a17f,...local(0,1.35,0),.25,.3,.25,yaw);
  put('cone',0xe4c386,...local(0,1.62,0),.57,.37,.57,yaw);
  put('box',C.scarf,...local(0,1.1,-.16),.33,.12,.45,yaw);
  put('ball',C.lit,...local(.43,1.32,0),.12,.17,.12,0,0,0,true);
  for(const d of [-1,1])put('box',C.wood,...local(d*.15,.25,Math.sin(t*12)*d*Math.min(.14,Math.hypot(p.vel[0],p.vel[2])*.03)),.16,.47,.17,yaw);
 }
 return function draw(s,mode,t,yaw=0){
  if(previousNight!==s.night){disposeMap();disposeMap=sceneMap(scene,s.night,mats);previousNight=s.night;lastMode=null;}
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(canvas.width!==w||canvas.height!==h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const [x,y,z]=s.player.pos,menu=mode==='menu',eye=yaw*Math.PI/180;
  if(menu){target.set(20,8,31);look.set(-1,3,-8);}
  else{target.set(x+Math.sin(eye)*8.4,Math.max(-2,y)+5.5,z+Math.cos(eye)*8.4);look.set(x-Math.sin(eye)*2,Math.max(-2,y)+1,z-Math.cos(eye)*2);}
  camera.position.lerp(target,mode===lastMode?.22:1);camera.lookAt(look);lastMode=mode;
  actors.reset();used=0;body(s,t);let lit=0;
  for(const l of s.lanterns){const [x,y,z]=l.pos;lit+=Number(l.lit);
   put('ball',l.lit?C.lit:C.dark,x,y+2.45,z,.64,.83,.64,0,0,0,l.lit);
   for(const dy of [-.55,.52])put('pole',l.lit?C.core:C.wood,x,y+2.45+dy,z,.46,.05,.46,0,0,0,l.lit);
   if(l.lit)halo(x,y+2.45,z,5);
   if(l.lit)put('ring',C.lit,x,y+.055,z,6,6,6,0,Math.PI/2,0,true);
  }
  ambient.intensity=.15+.55*lit/s.lanterns.length;
  for(const m of s.motes){const [x,y,z]=m.pos,cy=y+.7+.14*Math.sin(t*2+x);
   halo(x,cy,z,1.55);put('ball',C.halo,x,cy,z,.19,.17,.19,0,0,0,true);put('ball',C.fly,x,cy+.09,z,.12,.13,.12,0,0,0,true);}
  for(const sh of s.shades){const [x,y,z]=sh.pos,muted=sh.state==='stunned';
   put('ball',muted?C.stun:C.ink,x,y,z,.68,.7,.62);put('ring',C.violet,x,y,z,.68,.73,.68,t*.4,0,0,true);
   for(const dx of [-.22,.22])put('ball',C.violet,x+dx,y+.1,z+.48,.07,.09,.07,0,0,0,true);}
  for(const d of s.drifters)put('box',C.green,...d.pos,.23,.28,1.6,t,0,Math.sin(t*4)*.26,true);
  for(const c of s.charms)if(c.available)put('box',C.scarf,c.pos[0],c.pos[1]+.95+.1*Math.sin(t*3),c.pos[2],.38,.8,.12,t,0,.18,true);
  const age=(s.sim-s.lastPulse)/30;if(age>=0&&age<1)put('ring',C.lit,x,y+.12,z,Math.max(.1,age*5),Math.max(.1,age*5),1,0,Math.PI/2,0,true);
  if(s.night===3&&(s.wind.active||s.sim%1800>=1680)){
   const a=s.wind.dir_deg*Math.PI/180;
   for(let i=0;i<18;i++){const drift=(t*3+i*2.3)%10-5;put('rock',C.gold,x+Math.cos(a)*drift+Math.sin(i*3)*3,y+.8+(i%6)*.3,z+Math.sin(a)*drift+Math.cos(i)*3,.12,.035,.07,t);}
  }
  for(let j=used;j<sprites.length;j++)sprites[j].visible=false;
  actors.flush();renderer.render(scene,camera);
  const l=nearestLantern(s,Infinity);if(!l)return null;
  projected.set(l.pos[0],l.pos[1]+2,l.pos[2]).project(camera);
  return {visible:Math.abs(projected.x)<.95&&Math.abs(projected.y)<.92&&projected.z<1&&projected.z>0,
   angle:Math.atan2(l.pos[0]-x,l.pos[2]-z)-eye,id:l.id};
 };
}