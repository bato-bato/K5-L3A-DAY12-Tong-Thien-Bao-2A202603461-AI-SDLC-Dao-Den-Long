import {grassTuft,foliageMaterial,nightLandscape} from './landscape.js';
import * as T from 'three';
import {maps,terrain} from './islands.js';
import {nearestLantern} from './game.js';

const C={sky:0x0e1430,fog:0x1b2350,grass:0x2f5d50,sand:0xc9b48a,wood:0x6b4a2f,sea:0x12384a,
 lit:0xffb347,core:0xffe9b0,dark:0x5b5f6e,fly:0xfff6c2,halo:0xffe58a,ink:0x120a1a,violet:0x7a3cff,stun:0x3a3450,
 coat:0xe8e2d0,scarf:0xc8102e,gold:0xf2c14e,green:0x8fa3b8};
const geo={box:new T.BoxGeometry(),ball:new T.IcosahedronGeometry(1,1),rock:new T.IcosahedronGeometry(1,0),
 pole:new T.CylinderGeometry(1,1,1,20),land:new T.CylinderGeometry(1,1,1,72),cone:new T.ConeGeometry(1,1,10),
 ring:new T.TorusGeometry(1,.029,5,48),disc:new T.CylinderGeometry(1,1,.018,48)};
geo.snowball=new T.SphereGeometry(1,32,22);
geo.hat=new T.ConeGeometry(1,1,48);
// A single spruce bough carries staggered sprays along a drooping midrib.
function spruceBough(){
 const vertices=[];
 for(let i=0;i<13;i++){
  const u=i/13,length=.36*(1-u)+.09,base=-.19*Math.sin(u*Math.PI*.83);
  for(const side of [-1,1]){
   const z=u,tip=z+length*.74;
   vertices.push(0,base+.048,z-.10,side*length,base-.06,tip,side*.075,base+.015,z+.18);
   vertices.push(0,base+.06,z-.12,side*length*.6,base+.105,tip-.04,0,base+.04,z+.16);
  }
 }
 const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geom.computeVertexNormals();return geom;
}
// Uneven ridges give the distant islands a silhouette of overlapping rock faces.
const ridge=new T.ConeGeometry(1,1,11,4).toNonIndexed();
const peaks=ridge.attributes.position;
for(let i=0;i<peaks.count;i++){
 const x=peaks.getX(i),y=peaks.getY(i),z=peaks.getZ(i),u=y+.5;
 const fold=.91+.18*Math.sin(5*x+3*z)+.12*Math.cos(7*z-2*x);
 peaks.setXYZ(i,x*fold+.28*u,y+.10*(1-u)*Math.sin(5*x+6*z),z*fold-.18*u);
}
ridge.computeVertexNormals();geo.ridge=ridge;
geo.bough=spruceBough();geo.grass=grassTuft();
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
   const mesh=new T.InstancedMesh(geo[g],glow?materials.glow:(materials[g]??materials.solid),dynamic?1024:(g==='bough'?4200:2400));
   mesh.frustumCulled=false;mesh.count=0;parent.add(mesh);batch={mesh};batches.set(key,batch);
  }
  const m=batch.mesh,i=m.count++;m.setMatrixAt(i,pose(x,y,z,sx,sy,sz,ry,rx,rz));m.setColorAt(i,color.setHex(c));
 }
 function flush(){for(const {mesh} of batches.values()){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
 return {add,flush,reset(){for(const {mesh} of batches.values())mesh.count=0;},dispose(){for(const {mesh} of batches.values()){parent.remove(mesh);mesh.dispose();}}};
}
function sceneMap(scene,night,mats,benchmark){
 const b=layer(scene,mats),put=b.add,extra=[];
 for(const [cx,r] of maps[night].islands){
  put('land',C.wood,cx,-2,0,r,3.8,r);put('land',C.sand,cx,-.16,0,r,.29,r);
  put('land',C.grass,cx,-.05,0,r-.4,.10,r-.4);
  for(let i=0;i<560;i++){
   const a=i*2.39996,r1=Math.sqrt((i+.5)/560)*r*.98,x=cx+Math.cos(a)*r1,z=Math.sin(a)*r1,base=terrain(night,x,z);
   const tint=i%5?0x487764:0x79977e;
   put(benchmark?'cone':'grass',tint,x,base+.18,z,benchmark?.09:.24,.40,benchmark?.09:.24,a,.14);
   if(i%4===0){put(benchmark?'cone':'grass',tint,x+.13,base+.09,z,benchmark?.085:.18,.24,benchmark?.08:.18,-a,0,-.4);put('rock',0xa9a9a0,x+.1,base+.35,z,.065,.075,.065);}
  }
  for(let i=0;i<80;i++){
   const a=i*2.399,r1=r*Math.sqrt((i+.5)/80),x=cx+Math.cos(a)*r1,z=Math.sin(a)*r1;
   put('ball',0xb6cbd0,x,terrain(night,x,z)+.006,z,1.1+.75*(i%4),.045,.6+.34*(i%3),a);
  }
  for(let i=0;i<48;i++){
   const a=i*2.4,x=cx+Math.cos(a)*(r-.6),z=Math.sin(a)*(r-.6);
   put('rock',i%2?0x58716b:0x7c7870,x,0,z,1+i%3*.4,.38+i%4*.2,.9,a);
  }
  for(let i=0;i<28;i++){
   const a=i*2.399,r1=r*(i%6===0?.42:.78+.15*(Math.sin(i*32)+1)/2),x=cx+Math.cos(a)*r1,z=Math.sin(a)*r1;
   if(maps[night].lamps.some(p=>Math.hypot(x-p[0],z-p[2])<3))continue;
   const h=terrain(night,x,z),height=3.3+(1+Math.sin(i*13.7))*1.25;
   put('cone',0x70533f,x,h+height*.48,z,.22,height,.22,a);
   for(let tier=0;tier<7;tier++){
    const u=tier/7,cy=h+height*(.24+.73*u);
    for(let j=0;j<6;j++){
     const ang=a+j*Math.PI/3+tier*2.4,span=height*(.35-.28*u)*(.89+.11*Math.sin(j+i));
     put('bough',j%2?0x29574b:0x386858,x,cy,z,span,span,span,ang);
     if((tier+j+i)%3!==0)put('bough',0xc3d6d7,x,cy+.055,z,span*.68,span*.66,span*.84,ang);
    }
   }
   put('snowball',0xbfced4,x,h+.035,z,1.25,.09,.96,a);

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
  const a=i*.41,r=85+i%4*12;put(benchmark?'cone':'ridge',i%2?0x353954:0x494761,Math.cos(a)*r,-2,Math.sin(a)*r,8+i%8,10+i%13,9);
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
 const portraitLight=new T.DirectionalLight(0xffedda,2.1);portraitLight.position.set(3,4,5);scene.add(portraitLight);
 const mats={solid:new T.MeshLambertMaterial({side:T.DoubleSide}),glow:new T.MeshBasicMaterial()};
 const clock={value:0},strength={value:0};
 mats.grass=foliageMaterial(mats.solid,clock,strength,false);mats.bough=foliageMaterial(mats.solid,clock,strength,true);
 const landscape=nightLandscape(scene,clock),standard=new T.Group();scene.add(standard);
 const basic=layer(standard,mats),backdrop=layer(scene,mats);
 basic.add('disc',C.sea,30,-4,0,175,1,175);
 basic.add('ball',C.core,-34,30,-92,6,6,6,0,0,0,true);
 for(let i=0;i<260;i++){const a=i*2.399,h=.05+((i*173)%223)/245,r=140*Math.sqrt(1-h*h);backdrop.add('ball',C.fly,Math.cos(a)*r,h*140,Math.sin(a)*r,.11,.11,.11,0,0,0,true);}
 basic.flush();backdrop.flush();
 const actors=layer(scene,mats,true),put=actors.add,look=new T.Vector3(),target=new T.Vector3(),projected=new T.Vector3();
 function bolt(start,end,tick){
  let prev=new T.Vector3(...start);const up=new T.Vector3(0,1,0);
  for(let i=1;i<=6;i++){
   const u=i/6,next=new T.Vector3(...start).lerp(new T.Vector3(...end),u);
   if(i<6){next.x+=.14*Math.sin(i*5+tick*.7);next.y+=.1*Math.cos(i*8+tick);}
   const delta=next.clone().sub(prev),mid=prev.clone().lerp(next,.5);
   const rot=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(up,delta.clone().normalize()));
   put('box',C.core,mid.x,mid.y,mid.z,.055,delta.length(),.055,rot.y,rot.x,rot.z,true);prev=next;
  }
 }
 const seeds=new Float32Array(1150*3);
 for(let i=0;i<seeds.length;i++){const value=Math.sin(i*12.9898+.7)*43758.5453;seeds[i]=value-Math.floor(value);}
 const flakes=new T.BufferGeometry();flakes.setAttribute('position',new T.BufferAttribute(seeds,3));
 const snowMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},center:{value:new T.Vector3()}},
 vertexShader:`uniform float time;uniform vec3 center;varying float opacity;
 void main(){vec3 seed=position;vec3 shift=vec3(sin(time*.42+seed.y*15.)*.55+time*.19,-time*(.72+seed.x*.62),cos(time*.38+seed.x*22.)*.34);
 vec3 p=mod(seed*vec3(32.,15.,32.)+shift-center,vec3(32.,15.,32.))+center-vec3(16.,6.,16.);
 vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((24.+seed.z*14.)/max(1.,-mv.z),1.4,5.);
 opacity=smoothstep(1.,3.,-mv.z)*(.45+.45*seed.z);}`,
 fragmentShader:`varying float opacity;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.88,.94,1.,opacity*(1.-smoothstep(.18,.5,d)));}`});
 const snowfall=new T.Points(flakes,snowMaterial);snowfall.frustumCulled=false;scene.add(snowfall);
 let previousNight=0,disposeMap=()=>{},lastMode;
 function body(s,t){
  const p=s.player,[x,y,z]=p.pos;
  if(p.respawn||p.inv&&Math.floor(s.sim/6)%2)return;
  const yaw=s.facing,local=(dx,h,dz)=>[x+dx*Math.cos(yaw)+dz*Math.sin(yaw),y+h,z-dx*Math.sin(yaw)+dz*Math.cos(yaw)];
  const snow=0xeaf6ff,coal=0x272832,red=0xaf2434;
  const part=(shape,c,dx,h,dz,sx,sy,sz,tilt=0)=>put(shape,c,...local(dx,h,dz),sx,sy,sz,yaw,0,tilt);
  part('snowball',snow,0,.49,0,.55,.51,.52);
  part('snowball',snow,0,1.08,0,.425,.43,.395);
  part('snowball',snow,0,1.67,0,.39,.37,.38);
  for(const d of [-1,1]){
   part('snowball',coal,d*.145,1.72,.343,.048,.055,.034);
   part('snowball',0xffffff,d*.145-.012,1.739,.374,.012,.012,.009);
   part('snowball',0xefb4a7,d*.238,1.625,.289,.078,.044,.024);
   part('pole',0x68513d,d*.51,1.16,.012,.034,.45,.034,-d*.89);
   part('pole',0x68513d,d*.69,1.35,.012,.025,.19,.025,-d*.36);
   part('pole',0x68513d,d*.74,1.31,.012,.021,.16,.021,-d*1.1);
  }
  put('cone',0xf58a34,...local(0,1.63,.435),.073,.25,.073,yaw,Math.PI*.48);
  for(let i=-2;i<=2;i++)part('snowball',coal,i*.057,1.525+i*i*.012,.341,.019,.019,.016);
  for(const [h,dz] of [[1.18,.368],[.94,.37],[.59,.51]])part('snowball',coal,0,h,dz,.044,.044,.022);
  part('snowball',red,0,1.38,.01,.36,.11,.35);
  part('box',red,.19,1.15,.31,.13,.41,.068,.21);part('box',0xe7b77b,.217,1.02,.348,.125,.034,.019,.21);
  part('hat',0xd9ae70,0,2.095,0,.56,.36,.56);
  for(let i=0;i<4;i++){const radius=.54-i*.106;put('ring',0x936c43,...local(0,1.923+i*.068,0),radius,radius,.18,yaw,Math.PI/2,0);}
  part('pole',0x845b35,.45,1.84,.14,.012,.18,.012);part('ball',C.lit,.45,1.69,.14,.08,.105,.08);halo(...local(.45,1.69,.14),.35);
  if(p.carried){const hand=local(.54,.84,.41);halo(...hand,.7+p.carried*.035);put('rock',C.gold,...hand,.13,.21,.13,t,0,-.4,true);}

 }
 return function draw(s,mode,t,yaw=0){
  if(previousNight!==s.night){disposeMap();disposeMap=sceneMap(scene,s.night,mode==='bench'?{solid:mats.solid,glow:mats.glow}:mats,mode==='bench');previousNight=s.night;lastMode=null;}
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(canvas.width!==w||canvas.height!==h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const [x,y,z]=s.player.pos,menu=mode==='menu',eye=yaw*Math.PI/180;
  portraitLight.visible=menu;
  if(mode==="bench"){const a=t*2*Math.PI/15;target.set(30*Math.cos(a),15,-30*Math.sin(a));look.set(0,0,0);}
  else if(menu){target.set(x+.2,y+1.85,z+4.3);look.set(x-1.48,y+1.32,z);}
  else{target.set(x+Math.sin(eye)*8.4,Math.max(-2,y)+4.8,z+Math.cos(eye)*8.4);look.set(x-Math.sin(eye)*2,Math.max(-2,y)+1.65,z-Math.cos(eye)*2);}
  camera.position.lerp(target,mode===lastMode&&mode!=="bench"?.22:1);camera.lookAt(look);lastMode=mode;
  standard.visible=mode==='bench';landscape.group.visible=!standard.visible;
  landscape.sky.position.copy(camera.position);
  clock.value=s.reduced?0:t;strength.value=s.reduced?0:(s.wind.active?1.7:1);
  snowMaterial.uniforms.time.value=t;snowMaterial.uniforms.center.value.copy(camera.position);
  snowfall.visible=mode!=="bench"&&!s.reduced;
  actors.reset();used=0;if(mode==="bench"){put("ball",C.coat,x,y+.85,z,.42,.82,.42);put("hat",C.wood,x,y+1.85,z,.55,.34,.55);}else body(s,t);let lit=0;
  for(const l of s.lanterns){const [x,y,z]=l.pos;lit+=Number(l.lit);
   const blink=l.lit&&l.oil<1800&&s.sim%60>=30;
   put('ball',l.lit&&!blink?C.lit:C.dark,x,y+2.45,z,.64,l.lit?.83:.664,.64,0,0,0,l.lit&&!blink);
   if(l.lit){put('box',C.ink,x,y+3.92,z,1.6,.15,.1);const width=1.6*l.oil/6000;
    put('box',blink?C.dark:C.core,x-.8+width/2,y+3.92,z+.06,width,.10,.035,0,0,0,true);}
   else for(const sign of [-1,1])put('box',C.ink,x+.03,y+2.46,z+sign*.62,.07,.36,.03,0,0,.48);
   if(s.arc?.id===l.id&&s.sim-s.arc.tick<23){
    const hand=[s.player.pos[0]+.45,s.player.pos[1]+.84,s.player.pos[2]+.2],end=[x,y+2.45,z];
    bolt(hand,end,s.sim);
   }
   for(const dy of [-.55,.52])put('pole',l.lit?C.core:C.wood,x,y+2.45+dy,z,.46,.05,.46,0,0,0,l.lit);
   if(l.lit&&!blink)halo(x,y+2.45,z,5);
   if(l.oil>=1800)put('ring',C.lit,x,y+.055,z,6,6,6,0,Math.PI/2,0,true);
  }
  ambient.intensity=.15+.55*lit/s.lanterns.length;
  for(const m of s.motes){const [x,y,z]=m.pos,cy=y+.7+.14*Math.sin(t*2+x);
   halo(x,cy,z,1.55);put('box',C.gold,x+.08,cy+.16,z,.075,.30,.07,0,0,-.48,true);put('box',C.gold,x-.06,cy-.12,z,.075,.26,.07,0,0,-.48,true);put('ball',C.halo,x,cy,z,.19,.17,.19,0,0,0,true);put('ball',C.fly,x,cy+.09,z,.12,.13,.12,0,0,0,true);}
  for(const sh of s.shades){const [x,y,z]=sh.pos,muted=sh.state==='stunned';
   put('ball',muted?C.stun:C.ink,x,y,z,.68,.7,.62);put('ring',s.accessible?0x00b3ff:C.violet,x,y,z,.68,.73,.68,t*.4,0,0,true);
   for(const dx of [-.22,.22])put('ball',s.accessible?0x00b3ff:C.violet,x+dx,y+.1,z+.48,.07,.09,.07,0,0,0,true);}
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