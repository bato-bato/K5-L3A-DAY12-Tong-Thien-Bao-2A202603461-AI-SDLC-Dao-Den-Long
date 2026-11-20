import {createGame,rng,step} from '../src/game.js';
import {parseArgs} from 'node:util';
import {writeFile} from 'node:fs/promises';
const {values:{seed,nights,out}}=parseArgs({options:{seed:{type:'string',default:'7'},nights:{type:'string',default:'10'},out:{type:'string',default:'soak.json'}}});
if(!Number.isInteger(+seed)||!Number.isSafeInteger(+nights)||+nights<1)throw Error('Invalid seed or nights');
const start=performance.now(),rss=()=>process.memoryUsage.rss()/1048576;
const report={nights:+nights,crashes:0,results:[]};
let game=createGame(+seed);report.mem_start_mb=rss();
for(let i=0;i<+nights;i++){
 const random=rng((+seed+i)^0x9e3779b9);let move;
 try{
  while(game.status==='playing'&&game.sim<game.duration*60){
   if(game.sim%30===0){const a=random()*2*Math.PI;move=[Math.cos(a),Math.sin(a)];}
   step(game,{move,jump:random()<.05,dash:random()<.03,pulse:random()<.02,interact:random()<.10});
  }
  report.results.push(game.status);
 }catch(error){report.crashes++;console.error(error);report.results.push('crash');}
 game=createGame(+seed+i+1,{},(i+1)%3+1);
}
report.mem_end_mb=rss();report.duration_s=(performance.now()-start)/1000;
await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(report);if(report.crashes)process.exitCode=1;
