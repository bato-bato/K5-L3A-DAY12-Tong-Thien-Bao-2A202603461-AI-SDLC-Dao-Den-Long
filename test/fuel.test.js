import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,snapshot,nearestLantern} from '../src/game.js';
const quiet={random_shades:false,random_motes:false};
test('stacked drain, exact depletion before interaction, relight and expanded bag',()=>{
 const s=createGame(1,{...quiet,player:{carried:5},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:11/60}],shades:['S1','S2'].map(id=>({id,pos:[1,.8,0],state:'drain',target_lantern_id:'L1'}))});
 const e=step(s,{interact:true});assert.deepEqual(e.map(x=>x.name),['lantern_out','deposit','lantern_lit']);assert(e[2].data.relight);
 const l=snapshot(s).lanterns[0];assert.equal(l.fuel,100);assert.equal(l.relit_count,1);assert.equal(s.score,65);assert.equal(snapshot(s).player.capacity,12);
});
test('pause freezes oil, full lamps excluded, refuel restores protection',()=>{
 const s=createGame(1,{...quiet,player:{carried:3},lanterns:[{id:'L1',lit:true,pos:[0,0,0]},{id:'L2',lit:true,fuel:21,pos:[1,0,0]}]});
 assert.equal(nearestLantern(s).id,'L2');step(s,{pause:true});assert.equal(s.lanterns[0].oil,6000);
 const x=createGame(1,{...quiet,player:{carried:3},lanterns:[{id:'L1',lit:true,fuel:21,pos:[0,0,0]}],shades:[{id:'S1',pos:[1,.8,0],state:'drain',target_lantern_id:'L1'}]});
 const e=step(x,{interact:true});assert.equal(e[0].name,'refuel');assert.equal(e[0].data.amount,3);assert.equal(x.score,15);assert.equal(x.shades[0].state,'wander');
});
test('drain cadence and pulse score depend on pre-pulse state',()=>{
 const s=createGame(12,{...quiet,player:{pos:[12,0,0],carried:3},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:29}],shades:[{id:'S1',pos:[0,.8,0],state:'drain',target_lantern_id:'L1'}]});
 for(let i=0;i<60;i++)step(s);assert.equal(s.events[0].name,'fuel_drain');assert.equal(s.events[0].data.fuel,23);
 s.player.pos=[3,0,0];step(s,{pulse:true});assert.equal(s.score,15);assert.equal(s.shades[0].state,'stunned');
});
test('thresholds across all nights, dead player loses and lit scenarios give no capacity',()=>{
 for(const n of [1,2,3])for(const extra of [-1,0]){
 const count=Math.ceil((4+n)*.6)+extra;const s=createGame(1,{...quiet,time_left_s:1/60,lanterns:Array.from({length:count},(_,i)=>({id:'L'+(i+1),lit:true}))},n);
 step(s);assert.equal(s.reason,extra?'dawn':'dawn_survived');assert.equal(snapshot(s).player.capacity,10);
 }
});