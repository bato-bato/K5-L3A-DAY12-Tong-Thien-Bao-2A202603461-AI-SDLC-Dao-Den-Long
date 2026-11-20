import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,step,simulate} from '../src/game.js';
import {maps,terrain,planar} from '../src/islands.js';
const cases=JSON.parse(readFileSync(new URL('../scenarios/phase2/cases.json',import.meta.url)));
const close=(a,b,tolerance=.002)=>assert.ok(Math.abs(a-b)<=tolerance,a+' vs '+b);
function run(name){
 const c=cases[name],snaps=new Map(),events=[];
 simulate({night:c.n,seed:12,scenario:c.scenario,frames:c.frames,ticks:c.ticks,snapshotEvery:1},r=>{
  if(r.type==='snapshot')snaps.set(r.tick,r);if(r.type==='event')events.push(r);
 });
 return {at:i=>snaps.get(i),events,named:n=>events.filter(e=>e.name===n)};
}
test('three standard maps, spawn coordinates, lamp ids, duration and initial occupancy',()=>{
 for(const n of [1,2,3]){
 const s=createGame(7,{},n);assert.equal(s.motes.length,20);assert.equal(new Set(s.motes.map(m=>m.pos.join())).size,20);
 assert.equal(s.shades.length,0);assert.equal(s.lanterns.length,4+n);assert.equal(s.duration,270+30*n);
 assert.deepEqual(s.lanterns.map(l=>l.pos),maps[n].lamps);assert.deepEqual(s.lanterns.map(l=>l.id),Array.from({length:n+4},(_,i)=>'L'+(i+1)));
 }assert.equal(terrain(2,35,2),0);assert.equal(terrain(2,35,2.01),-Infinity);
 assert.equal(terrain(3,0,6),6);assert.equal(terrain(3,0,18),3);assert.equal(terrain(3,0,-18),0);
});
test('dash starts facing +Z, lasts twelve ticks, edge and cooldown; airborne holds height',()=>{
 const r=run('dash');close(r.at(12).player.pos[2],2.8);close(r.at(14).player.pos[2],2.8);assert.equal(r.named('dash').length,1);
 close(r.at(1).player.dash_cd_s,1.5);const air=run('airDash');close(air.at(4).player.pos[1],air.at(16).player.pos[1]);
});
test('pause advances wall ticks while all gameplay clocks and world remain frozen',()=>{
 const r=run('pause');const a=r.at(0),b=r.at(70);
 assert.equal(b.sim_tick,0);assert.equal(b.state,'paused');assert.deepEqual(a.player,b.player);assert.deepEqual(a.motes,b.motes);assert.deepEqual(a.wind,b.wind);
 assert.equal(b.time_left_s,a.time_left_s);assert.equal(r.at(71).sim_tick,1);assert.equal(r.named('resumed').length,1);
});
test('fall ignores invulnerability, costs exactly one flame and all stock, respawns after 60',()=>{
 const r=run('fall');assert.deepEqual(r.named('player_hit').map(e=>e.data),[{by:'fall',flames:2,dropped:0,lost:8}]);
 assert.ok(r.at(60).player.pos[1]<-10);assert.deepEqual(r.at(61).player.pos,[0,0,0]);assert.equal(r.at(61).player.invuln,true);assert.deepEqual(r.at(61).player.vel,[0,0,0]);
});
test('two islands joined by bridge; pad locks flight toward opposite island',()=>{
 const b=run('bridge');close(b.at(400).player.pos[0],65);assert.equal(b.at(400).player.flames,3);
 const p=run('pad');assert.ok(p.at(35).player.pos[1]>4);assert.ok(p.at(85).player.pos[0]>49);assert(p.at(90).player.grounded);
});
test('ramps climb to Y=3, bell pad lands atop Y=6, tier walls and tower block climbing',()=>{
 const r=run('ramp');close(r.at(90).player.pos[1],3);
 const p=run('bellPad');close(p.at(70).player.pos[1],6);assert.ok(p.at(70).player.pos[2]<=8);
 const s=createGame(1,{player:{pos:[0,0,25]},random_shades:false},3);
 for(let i=0;i<60;i++)step(s,{move:[0,-1]});assert.ok(s.player.pos[2]>=24);
 const top=createGame(1,{player:{pos:[0,6,4]}},3);for(let i=0;i<40;i++)step(top,{move:[0,-1]});assert.ok(top.player.pos[2]>=2-1e-8);
});
test('wind begins at 1800 and pushes 2 m/s for five seconds; warning precedes gust',()=>{
 const r=run('wind');assert.equal(r.at(1799).wind.active,false);assert.equal(r.at(1800).wind.active,true);
 assert.equal(r.at(1680).wind.dir_deg,r.at(1800).wind.dir_deg);assert.equal(r.at(2100).wind.active,false);
 close(planar(r.at(1799).player.pos,r.at(2099).player.pos),10);
});
test('drifter steals despite invulnerability; a pulse refunds stolen stock as dropped motes',()=>{
 const r=run('steal');assert.deepEqual(r.named('drifter_steal')[0].data,{drifter_id:'D1',amount:3,carried:5});
 assert.equal(r.at(1).player.flames,3);assert.equal(r.at(1).drifters[0].state,'flee');
 assert.deepEqual(r.named('drifter_drop')[0].data,{drifter_id:'D1',amount:3});
 assert.equal(r.at(2).motes.filter(m=>m.kind==='dropped').length,3);
 const f=run('flee');assert.equal(f.named('drifter_steal').length,0);assert.equal(f.at(1).drifters[0].state,'flee');assert.equal(f.at(242).drifters.length,0);
});
test('charm gives 600 ticks, faster movement, dash retrigger and 2700-tick respawn',()=>{
 const r=run('charm');assert.deepEqual(r.named('charm_picked')[0].data,{charm_id:'C1',charm_ticks:600});assert.equal(r.at(1).charms[0].respawn_s,45);
 assert.deepEqual(r.named('dash').map(e=>e.tick),[2,16]);assert.equal(r.at(601).player.charm_s,0);
 const s=createGame(12,{player:{pos:[35,0,0]},random_shades:false,random_drifters:false},2);step(s);step(s,{move:[1,0]});close(s.player.pos[0],35.12);
 for(let i=0;i<2699;i++)step(s,{move:i<20?[1,0]:[0,0]});assert.equal(s.charms[0].available,true);
});
test('scheduled entities appear at exact sim ticks and capacities are enforced',()=>{
 const r=run('spawns');assert.deepEqual(r.named('shade_spawned').slice(0,3).map(e=>e.tick),[300,300,720]);
 assert.equal(r.at(300).shades[0].state,'spawning');assert.equal(r.at(1199).drifters.length,0);
 assert.equal(r.at(1200).drifters.length,1);assert.equal(r.at(2400).drifters.length,2);
 const s=createGame(2,{random_shades:false});for(let i=0;i<5000;i++)step(s);
 assert.equal(s.motes.length,24);assert.equal(new Set(s.motes.map(m=>m.pos.join())).size,24);
});
test('score from deposits, last-tick win and no-flames precedence',()=>{
 const r=run('priority');assert.equal(r.at(1).state,'won');assert.equal(r.at(1).score,350);
 const cfg=structuredClone(cases.priority.scenario);cfg.player.flames=0;const s=createGame(1,cfg);step(s,{interact:true});assert.equal(s.reason,'no_flames');
});
test('drop TTL, ID ordering, one hit per tick, 3D pulse and height gates',()=>{
 const s=createGame(1,{random_motes:false,random_shades:false,player:{carried:7},shades:[{id:'S9',pos:[0,.8,0]},{id:'S2',pos:[0,.8,0]}]});
 assert.equal(step(s).filter(e=>e.name==='player_hit').length,1);assert.equal(s.shades[0].id,'S2');assert.equal(s.shades[0].state,'recoil');
 assert.equal(s.motes.length,3);for(const m of s.motes)assert.ok(planar(m.pos,s.player.pos)>=1.5&&planar(m.pos,s.player.pos)<=2.5);
 s.shades=[];for(let i=0;i<480;i++)step(s);assert.equal(s.motes.length,0);
 const high=createGame(1,{random_motes:false,player:{carried:3},motes:[[0,2,0]],shades:[{pos:[0,6,0]}]});
 step(high,{pulse:true});assert.equal(high.player.flames,3);assert.equal(high.motes.length,1);assert.deepEqual(high.events[0].data.stunned_ids,[]);
});
