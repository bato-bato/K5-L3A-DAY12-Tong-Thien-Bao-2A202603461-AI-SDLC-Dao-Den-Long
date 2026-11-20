import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,step,snapshot,simulate,tuning,timeLeft,HZ} from '../src/game.js';

const quiet={random_motes:false,random_shades:false};
const create=(config={})=>createGame(12,{...quiet,...config});
const initialLamps=[1,2,3,4].map(i=>({id:'L'+i,lit:true}));
const advance=(s,n)=>{for(let i=0;i<n;i++)step(s);};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' vs '+b);
const run=(options={})=>{
  const lines=[];simulate({seed:12,scenario:quiet,frames:[],ticks:0,snapshotEvery:10,...options},x=>lines.push(x));
  return lines;
};

test('scenario setup is silent and tick zero precedes any input',()=>{
  const scenario={...quiet,lanterns:[{id:'L1',lit:true}],motes:[[0,0,0]],shades:[{pos:[6,0,0]}]};
  const [start,begin,end]=run({scenario});assert.equal(begin.name,'night_start');assert.deepEqual(start.player.pos,[0,0,0]);assert.equal(start.player.carried,0);assert.equal(start.player.flames,tuning.flames);
  assert.equal(start.tick,0);assert.equal(start.sim_tick,0);assert.equal(start.score,0);assert.equal(start.lanterns.length,5);
  assert.equal(start.lanterns[0].lit,true);assert.equal(start.motes_active,1);assert.equal(start.shades[0].state,'chase');
  assert.deepEqual(end,{type:'end',ticks:0,state:'playing',score:0});
});
test('sparse frames persist, yaw uses contract axes and diagonals are normalized',()=>{
  const s=create();step(s,{move:[0,1],cam_yaw_deg:90});advance(s,59);
  near(s.player.pos[0],tuning.player_speed);near(s.player.pos[2],0);
  step(s,{move:[1,0]});advance(s,59);near(s.player.pos[2],-tuning.player_speed);
  const d=create();step(d,{move:[1,1]});advance(d,59);near(Math.hypot(d.player.pos[0],d.player.pos[2]),tuning.player_speed);
});
test('jump is edge triggered, gravity returns the feet to Y=0',()=>{
  const s=create();step(s,{jump:true});assert.ok(s.player.pos[1]>0);
  advance(s,120);assert.equal(s.player.pos[1],0);
  step(s,{jump:false});step(s,{jump:true});assert.ok(s.player.pos[1]>0);
});
test('pickup uses inclusive horizontal radius, respects capacity and leaves the excess',()=>{
  const s=create({player:{carried:tuning.carry_capacity-1},motes:[[tuning.pickup_radius,1.5,0],[0,0,0],[tuning.pickup_radius+.01,0,0]]});
  const events=step(s);assert.equal(s.player.carried,tuning.carry_capacity);assert.equal(s.motes.length,2);
  assert.deepEqual(events,[{type:'event',tick:1,name:'mote_picked',data:{carried:tuning.carry_capacity}}]);assert.equal(s.score,0);
});
test('interact deposits partial stock, requires a fresh press and lights once',()=>{
  const s=create({lanterns:[{id:'L1',pos:[tuning.interact_radius,0,0]}],player:{carried:1}});
  assert.deepEqual(step(s,{interact:true})[0].data,{lantern_id:'L1',amount:1,deposited:1});
  s.player.carried=10;step(s);assert.equal(s.lanterns[0].deposited,1);
  step(s,{interact:false});const events=step(s,{interact:true});
  assert.deepEqual(events.map(e=>e.name),['deposit','lantern_lit']);assert.equal(s.player.carried,1);
  assert.equal(s.score,tuning.score.per_lantern+10*tuning.score.per_mote);assert(s.lanterns[0].lit);
});
test('pulse spends stock, pushes on XZ, scores stuns and respects range and cooldown',()=>{
  const s=create({player:{carried:9},shades:[{id:'in',pos:[tuning.pulse_radius,.8,0]},{id:'out',pos:[0,0,tuning.pulse_radius+.2]}]});
  const events=step(s,{pulse:true});assert.deepEqual(events[0].data,{stunned_ids:['in']});
  assert.equal(s.player.carried,6);assert.equal(s.shades[0].state,'stunned');
  step(s,{pulse:false});assert.deepEqual(step(s,{pulse:true}),[]);advance(s,12);
  near(s.shades[0].pos[0],tuning.pulse_radius+tuning.pulse_push_m);assert.equal(s.score,tuning.score.per_stun);
  const free=create({player:{carried:9}});step(free,{pulse:true});advance(free,180);assert.equal(free.player.carried,6);
  step(free,{pulse:false});step(free,{pulse:true});assert.equal(free.player.carried,3);
  const empty=create();assert.deepEqual(step(empty,{pulse:true}),[]);
});
test('shade pursues at declared speed, hits once per invulnerability interval',()=>{
  const s=create({player:{flames:2,carried:2},shades:[{pos:[1.02,0,0]}]});
  const [hit]=step(s);near(s.shades[0].pos[0],1.02-tuning.shade_speed/HZ);
  assert.deepEqual(hit.data,{by:'shade',flames:1,dropped:1});assert.equal(s.player.carried,1);
  advance(s,HZ*tuning.invuln_s-1);assert.equal(s.status,'playing');s.shades[0].pos=[...s.player.pos];
  assert.equal(step(s).at(-1).data.reason,'no_flames');assert.equal(s.status,'lost');
});
test('lit lantern keeps shades outside the safe radius and protects the player',()=>{
  const s=create({lanterns:[{id:'L1',pos:[0,0,0],lit:true}],shades:[{pos:[0,0,0]}]});
  advance(s,240);assert.ok(Math.hypot(s.shades[0].pos[0],s.shades[0].pos[2])>=tuning.safe_radius-1e-8);
  assert.equal(s.player.flames,tuning.flames);
});
test('fifth lamp stays lit until dawn; fuel determines the final bonus',()=>{
  const scenario={...quiet,player:{carried:1},time_left_s:10,lanterns:[...initialLamps,{id:'L5',pos:[0,0,0],deposited:9}]};
  const rows=run({scenario,frames:[{tick:0,interact:true}],ticks:999,snapshotEvery:1});
  assert.equal(rows.find(r=>r.tick===1&&r.type==='snapshot').state,'playing');assert.equal(rows.find(r=>r.name==='game_over').data.reason,'dawn_survived');
  assert.deepEqual(rows.at(-1),{type:'end',ticks:600,state:'won',score:105+5*(50+90)+150});
});
test('dawn stops the run early and end follows the scheduled final snapshot',()=>{
  const rows=run({scenario:{...quiet,time_left_s:1},ticks:100});
  assert.deepEqual(rows.filter(r=>r.type==='snapshot').map(r=>r.tick),[0,10,20,30,40,50,60]);
  assert.equal(rows.at(-3).data.reason,'dawn');assert.equal(rows.at(-2).time_left_s,0);assert.equal(rows.at(-1).ticks,60);
  const s=create();step(s);near(timeLeft(s),tuning.night1_duration_s-1/60);
});
test('seeded spawns have stable unique ids, disabled generators stay empty',()=>{
  const scenario={random_motes:true,random_shades:true,motes:[],shades:[{id:'S1',pos:[30,0,30]},{pos:[30,0,30]}]};
  const rows=run({scenario,ticks:1080,snapshotEvery:1080});
  assert.equal(rows.find(r=>r.name==='shade_spawned').data.id,'S3');assert.equal(rows.at(-2).motes_active,4);
  assert.deepEqual(rows,run({scenario,ticks:1080,snapshotEvery:1080}));assert.notDeepEqual(rows,run({seed:19,scenario,ticks:1080,snapshotEvery:1080}));
  const s=create();advance(s,1080);assert.deepEqual([s.motes.length,s.shades.length],[0,0]);
});
test('old route is evaluated until death or dawn under the replacement rule',()=>{
 const {frames}=JSON.parse(readFileSync(new URL('../scenarios/restore-island.json',import.meta.url)));
 const rows=run({scenario:{},frames,ticks:14400,snapshotEvery:60});
 assert.ok(rows.some(r=>r.name==='lantern_lit'));assert.ok(rows.at(-1).ticks>rows.find(r=>r.name==='lantern_lit').tick);
 assert.ok(['dawn','no_flames','dawn_survived'].includes(rows.find(r=>r.name==='game_over').data.reason));
});
test('snapshot coordinates round to three decimals without quantizing simulation',()=>{
  const s=create({player:{pos:[1.12349,0,-2.56789]}});assert.deepEqual(snapshot(s).player.pos,[1.123,0,-2.568]);
  near(s.player.pos[0],1.12349);
});