import * as T from 'three';
import { ground,shrines,sparks,shadowPositions } from './game.js';

export function makeWorld(canvas) {
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1,.1,230);
 scene.fog=new T.FogExp2(0x9295a3,.012);
 const sky=new T.Mesh(new T.SphereGeometry(170,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
 uniforms:{top:{value:new T.Color(0x465374)},middle:{value:new T.Color(0xe8aa9e)},low:{value:new T.Color(0xfac99c)}},
 vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 v;uniform vec3 top,middle,low;void main(){float h=normalize(v).y; vec3 c=mix(low,middle,smoothstep(-0.05,0.16,h));gl_FragColor=vec4(mix(c,top,smoothstep(0.10,0.76,h)),1.);\n#include <colorspace_fragment>\n}'}));
 scene.add(sky);
 scene.add(new T.HemisphereLight(0xffe2d1,0x658a83,1.85));
 const sun=new T.DirectionalLight(0xffd4aa,2.15);sun.position.set(-12,20,5);scene.add(sun);
 const matCache=new Map();
 function mat(color,glow=false){const key=color+':'+glow;if(!matCache.has(key))matCache.set(key,glow?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color,flatShading:true,roughness:1}));return matCache.get(key);}
 const geo={box:new T.BoxGeometry(),ball:new T.IcosahedronGeometry(1,1),rock:new T.IcosahedronGeometry(1,0),pole:new T.CylinderGeometry(1,1,1,9),hat:new T.ConeGeometry(1,1,10)};
 function mesh(parent,g,color,x,y,z,sx,sy,sz,glow=false){const m=new T.Mesh(g,mat(color,glow));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 let seed=93429;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 function rod(parent,a,b,r,color){const start=new T.Vector3(...a),end=new T.Vector3(...b),dir=end.clone().sub(start);
 const p=mesh(parent,geo.pole,color,0,0,0,r,dir.length(),r);p.position.copy(start).lerp(end,.5);p.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return p;}
 const ocean=mesh(scene,new T.PlaneGeometry(320,320),0x517f87,0,-1.7,0,1,1,1);ocean.rotation.x=-Math.PI/2;
 mesh(scene,geo.ball,0xffdbaf,-29,17,-108,7,7,7,true).material.fog=false;
 for(let i=0;i<34;i++){const a=i*.185,d=62+rand()*36;mesh(scene,geo.hat,i%2?0x797a90:0x627783,Math.cos(a)*d,-3,Math.sin(a)*d,8+rand()*12,12+rand()*21,11+rand()*8);}
 for(let i=0;i<24;i++){const a=i*.27,d=53+rand()*22;mesh(scene,geo.rock,i%2?0x787b90:0x737e91,Math.cos(a)*d,-3,Math.sin(a)*d,9+rand()*7,7+rand()*11,8+rand()*6);}
 // Radial island mesh with a continuous walkable top and two cliff bands.
 const n=80, rings=12,verts=[],colors=[],indices=[],coast=Array.from({length:n},(_,i)=>19.7+.5*Math.sin(i*.6)+rand()*.55);
 for(let j=0;j<=rings+2;j++)for(let i=0;i<n;i++){
  const angle=i*Math.PI*2/n,r=coast[i]*Math.min(1,j/rings)*(j===rings+2?.94:1),x=r*Math.cos(angle),z=r*Math.sin(angle);
  verts.push(x,j<=rings?ground(x,z):j===rings+1?-.3:-2.2,z);
  const c=new T.Color(j<rings?0x789389:j===rings?0x9ba38e:j===rings+1?0x737b78:0x47596a);c.offsetHSL(.01*(rand()-.5),0,.045*(rand()-.5));colors.push(c.r,c.g,c.b);
  if(j){const a=(j-1)*n+i,b=(j-1)*n+(i+1)%n,c1=j*n+i,d=j*n+(i+1)%n;indices.push(a,b,c1,b,d,c1);}
 }
 const land=new T.BufferGeometry();land.setAttribute('position',new T.Float32BufferAttribute(verts,3));land.setAttribute('color',new T.Float32BufferAttribute(colors,3));land.setIndex(indices);land.computeVertexNormals();
 scene.add(new T.Mesh(land,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,flatShading:true})));
 const patches=[];function detail(g,color,x,y,z,sx,sy,sz,angle=0){patches.push({g,color,x,y,z,sx,sy,sz,angle});}
 for(let i=0;i<580;i++){const x=rand()*110-55,z=rand()*110-55;if(Math.hypot(x,z)>21)detail(geo.box,0x9cb3ae,x,-1.64,z,.22+rand()*1.6,.015,.035+rand()*.05);}
 const path=[[0,10],[-9,5],[-6,-5],[0,-12],[7,-6],[11,4],[5,7],[0,10]];
 for(let i=1;i<path.length;i++){const [a,b]=path[i-1],[c,d]=path[i],len=Math.hypot(c-a,d-b);
 for(let j=0;j<len;j+=.78){const k=j/len,x=a+(c-a)*k,z=b+(d-b)*k;detail(geo.rock,0xc0ad8c,x,ground(x,z)+.035,z,1.25,.09,.72,Math.atan2(c-a,d-b));}}
 for(let i=0;i<150;i++){const a=rand()*Math.PI*2,r=rand()*19,x=r*Math.cos(a),z=r*Math.sin(a);detail(geo.hat,0x52796f,x,ground(x,z)+.22,z,.11,.55,.12,rand()*6);}
 function tree(x,z,scale,pink=false){
  const group=new T.Group();scene.add(group);group.position.set(x,ground(x,z),z);group.scale.setScalar(scale);
  rod(group,[0,0,0],[.08,2.8,.1],.18,0x635155);
  if(pink){for(let j=0;j<7;j++){const a=j*2.4,r=j?1.25:0,xx=Math.cos(a)*r,zz=Math.sin(a)*r,y=2.85+rand()*.9;
  rod(group,[.07,1.5,.05],[xx,y,zz],.1,0x645059);mesh(group,geo.rock,j%2?0xc4838d:0xd79b9d,xx,y,zz,1.15,.78,1.1);}}
  else for(let j=0;j<3;j++)mesh(group,geo.hat,[0x365851,0x456961,0x567871][j],0,1.8+j*.85,0,1.22-j*.24,2.1-j*.2,1.22-j*.24);
 }
 for(let i=0;i<34;i++){const a=i*.63,r=15.5+rand()*3;tree(Math.cos(a)*r,Math.sin(a)*r,.7+rand()*.64,i%6===0);}
 for(let i=0;i<45;i++){const a=rand()*6.28,r=18+rand()*2;detail(geo.rock,0x7a8481,r*Math.cos(a),-.2,r*Math.sin(a),.45+rand(),.55+rand(),.65+rand(),a);}
 const batches=new Map();for(const p of patches){const key=p.g.uuid+p.color;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(p);}
 for(const ps of batches.values()){const m=new T.InstancedMesh(ps[0].g,mat(ps[0].color),ps.length),o=new T.Object3D();ps.forEach((p,i)=>{o.position.set(p.x,p.y,p.z);o.scale.set(p.sx,p.sy,p.sz);o.rotation.y=p.angle;o.updateMatrix();m.setMatrixAt(i,o.matrix);});scene.add(m);}
 function lantern(parent,x,y,z,size,color){
  const g=new T.Group();parent.add(g);g.position.set(x,y,z);g.scale.setScalar(size);
  const bulb=mesh(g,geo.ball,color,0,0,0,.58,.72,.58,true);
  for(const h of [-.58,-.34,0,.34,.58]){const r=.59*Math.sqrt(1-(h/.75)**2);mesh(g,geo.pole,0x875333,0,h,0,r,.045,r);}
  mesh(g,geo.pole,0x694a3a,0,.65,0,.25,.14,.25);mesh(g,geo.pole,0xdda355,0,-.77,0,.055,.26,.055);return bulb;
 }
 for(let i=0;i<15;i++){
  const x=rand()*86-43,z=-33-rand()*42,y=4+rand()*14;
  lantern(scene,x,y,z,.33+rand()*.44,0xffbe80);
 }
 const lamps=shrines.map((p,i)=>{const g=new T.Group();g.position.set(p.x,ground(p.x,p.z),p.z);scene.add(g);
 mesh(g,geo.pole,0x8c8271,0,.15,0,1.1,.3,1.1);for(const x of [-.83,.83])mesh(g,geo.box,0x994e39,x,1.7,0,.21,3.2,.22);
 mesh(g,geo.box,0x96533a,0,3.28,0,2.45,.25,.36);mesh(g,geo.box,0x43555b,0,3.48,0,2.8,.18,.56);
 const lamp=lantern(g,0,2.24,0,1,i===1?0xb39477:0xe19265);return lamp;});
 // Small paper lanterns strung across the pier at the southern shore.
 for(const x of [-4,4]){mesh(scene,geo.pole,0x634e49,x,3,15,.17,6,.17);}
 for(let i=0;i<8;i++){const x=-4+i,y=5.85-.72*Math.sin(Math.PI*i/8),y2=5.85-.72*Math.sin(Math.PI*(i+1)/8);
 rod(scene,[x,y,15],[x+1,y2,15],.033,0x5a4946);if(i%2)lantern(scene,x,y-.42,15,.48,0xffb96e);}
 for(let i=0;i<16;i++){const z=16+i*.49;mesh(scene,geo.box,i%2?0x9c795c:0x8d715b,0,.68,z,2.4,.18,.45);}
 const post=new T.Group();scene.add(post);post.position.set(6.5,ground(6.5,13.7),13.7);
 mesh(post,geo.box,0x564640,0,2.6,0,.25,5.2,.27);rod(post,[-1.5,5,0],[.35,5.24,0],.12,0x684b3c);
 rod(post,[-1.18,4.2,0],[-1.18,5.04,0],.03,0x665040);lantern(post,-1.18,3.65,0,.85,0xffad64);
 const flyGeo=geo.ball,flies=sparks.map(p=>mesh(scene,flyGeo,0xffdf65,p.x,ground(p.x,p.z)+.85,p.z,.19,.2,.19,true));
 const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=64;const ctx=spriteCanvas.getContext('2d');const grad=ctx.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,246,164,1)');grad.addColorStop(.2,'rgba(255,217,103,.65)');grad.addColorStop(1,'rgba(255,200,57,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
 const glowMaterial=new T.SpriteMaterial({map:new T.CanvasTexture(spriteCanvas),transparent:true,depthWrite:false,blending:T.AdditiveBlending});flies.forEach(f=>{const g=new T.Sprite(glowMaterial);g.scale.set(7,7,1);f.add(g);});
 const hero=new T.Group();scene.add(hero);mesh(hero,geo.hat,0xd75d43,0,.76,0,.42,.84,.42);mesh(hero,geo.ball,0xe4ab81,0,1.36,.04,.255,.29,.255);mesh(hero,geo.hat,0xf1bb7d,0,1.62,0,.55,.39,.55);
 const feet=[-.16,.16].map(x=>mesh(hero,geo.box,0x314758,x,.22,0,.16,.42,.19));rod(hero,[.27,.99,.04],[.54,.76,.1],.09,0xdc9270);lantern(hero,.55,.48,.12,.32,0xffcc71);
 const shades=[0,1].map(()=>{const g=new T.Group();scene.add(g);mesh(g,geo.ball,0x29273f,0,.74,0,.61,.62,.55);
 for(const x of [-.24,.24]){mesh(g,geo.hat,0x352b45,x,1.3,0,.19,.52,.2);mesh(g,geo.ball,0xff947a,x*.7,.83,.5,.065,.055,.05,true);}return g;});
 const look=new T.Vector3(),pos=new T.Vector3();let priorMenu;
 return function draw(s,mode,time,moving){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const menu=mode==='menu';
  if(menu){const a=.22+.048*Math.sin(time*.12);pos.set(23*Math.sin(a),9.8,25*Math.cos(a));look.set(-1.2,2,0);}
  else{pos.set(s.x,ground(s.x,s.z)+7.2,s.z+8.7);look.set(s.x,ground(s.x,s.z)+.8,s.z-1.35);}
  camera.position.lerp(pos,priorMenu!==menu?1:.115);camera.lookAt(look);priorMenu=menu;
  hero.position.set(s.x,ground(s.x,s.z)+s.y,s.z);hero.rotation.y=s.facing;hero.visible=s.tick>=s.safeUntil||Math.floor(s.tick/7)%2===0;
  feet.forEach((f,i)=>f.rotation.x=moving?Math.sin(s.tick*.22+i*Math.PI)*.5:0);
  flies.forEach((f,i)=>{f.visible=!s.taken[i];f.position.y=ground(sparks[i].x,sparks[i].z)+1+.19*Math.sin(time*2+i);});
  lamps.forEach((lamp,i)=>lamp.material=mat(s.lit[i]?0xffe887:0xc58363,true));
  shadowPositions(s.tick).forEach((p,i)=>{shades[i].position.set(p.x,ground(p.x,p.z)+.16*Math.sin(time*3+i),p.z);shades[i].rotation.y=time*.5+i;});
  renderer.render(scene,camera);
 };
}