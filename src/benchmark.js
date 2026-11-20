import {createGame,rng} from './game.js';
import {moveEnemies} from './enemies.js';
export function benchScene(seed){
 const random=rng(seed);
 function point(y){const r=39*Math.sqrt(random()),a=random()*2*Math.PI;return [r*Math.cos(a),y,r*Math.sin(a)];}
 const s=createGame(seed,{random_shades:false,random_motes:false,
  shades:Array.from({length:200},()=>({pos:point(.8),state:'wander'})),
  motes:Array.from({length:100},()=>point(0)),lanterns:['L1','L2','L3'].map(id=>({id,lit:true}))});
 s.benchmark=true;return s;
}
export function runBench(draw,seed,duration){
 const scene=benchScene(seed),samples=[];let first,last,steps=0,measure;
 function frame(t){
  first??=t;const elapsed=(t-first)/1000;
  while(steps<Math.floor(elapsed*60)){moveEnemies(scene);scene.sim++;steps++;}
  draw(scene,'bench',elapsed);
  if(last===undefined)window.firstBenchFrame();
  if(measure!==undefined)samples.push(t-last);
  else if(elapsed>=3)measure=t;
  last=t;
  if(t-measure>=duration*1000){window.finishBench(samples);return;}
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
