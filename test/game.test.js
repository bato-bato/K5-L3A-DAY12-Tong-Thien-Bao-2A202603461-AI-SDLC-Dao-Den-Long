import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,step,replay,shrines,shadowPositions,sparks,rules} from '../src/game.js';
const scenario=JSON.parse(readFileSync(new URL('../scenarios/first-lantern.json',import.meta.url)));
test('walking through fireflies and lighting the first lantern is reproducible',()=>{
 const a=replay(scenario.actions);assert.deepEqual(a,replay(scenario.actions));assert.equal(a.lanterns[0].lit,true);assert.equal(a.fireflies,a.collected-3);assert.equal(a.lives,3);
});
test('diagonal movement is normalized and stays ashore',()=>{const s=createGame();step(s,{x:1,z:1});assert.ok(Math.abs(Math.hypot(s.x,s.z-9)-rules.speed/60)<1e-8);for(let i=0;i<900;i++)step(s,{z:1});assert.equal(Math.round(Math.hypot(s.x,s.z)),rules.radius);});
test('jump returns to ground',()=>{const s=createGame();step(s,{jump:true});assert.ok(s.y>0);for(let i=0;i<60;i++)step(s);assert.equal(s.y,0);});
test('one pickup per firefly; lamp requires stock and proximity',()=>{const s=createGame();Object.assign(s,sparks[0]);step(s);step(s);assert.equal(s.bag,1);Object.assign(s,shrines[0]);step(s,{light:true});assert.equal(s.lit[0],false);s.bag=3;s.x=0;s.z=0;step(s,{light:true});assert.equal(s.bag,3);});
test('three lamps win, terminal state is frozen',()=>{const s=createGame();s.bag=9;for(const p of shrines){Object.assign(s,p);step(s,{light:true});}assert.equal(s.status,'won');assert.equal(s.bag,0);const copy=structuredClone(s);step(s,{x:1});assert.deepEqual(s,copy);});
test('shadows damage, grant grace period and can end the game',()=>{const s=createGame();for(let i=0;i<3;i++){s.tick=s.safeUntil;Object.assign(s,shadowPositions(s.tick+1)[0]);step(s);if(i===0){Object.assign(s,shadowPositions(s.tick+1)[0]);step(s);assert.equal(s.lives,2);}}assert.equal(s.status,'lost');});
test('malformed replays rejected',()=>{for(const a of [[{ticks:-1}],[{x:3,ticks:1}],[{ticks:1,jump:'no'}],null])assert.throws(()=>replay(a));});
test('full island can be restored using only motion and interaction inputs',()=>{
 const full=JSON.parse(readFileSync(new URL('../scenarios/restore-island.json',import.meta.url)));
 const result=replay(full.actions);assert.equal(result.status,'won');assert.equal(result.lanterns.filter(l=>l.lit).length,3);
 assert.ok(result.lives>0);assert.equal(result.fireflies,result.collected-9);
});
