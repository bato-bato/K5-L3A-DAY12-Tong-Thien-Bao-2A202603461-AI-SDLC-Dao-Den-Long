import test from 'node:test';
import assert from 'node:assert/strict';
import {rank,validEntry} from '../src/ranking.js';
import {benchScene} from '../src/benchmark.js';
import {moveEnemies} from '../src/enemies.js';
test('benchmark stays in the standard night with fixed populations, oil and idle player',()=>{
 const g=benchScene(42);assert.deepEqual(g.shades,benchScene(42).shades);
 assert.equal(g.shades.length,200);assert.equal(g.motes.length,100);const before=g.shades.map(s=>[...s.pos]);
 for(let i=0;i<200;i++)moveEnemies(g);
 assert(g.shades.every(s=>s.state==='wander'));assert.notDeepEqual(g.shades.map(s=>s.pos),before);
 assert.deepEqual(g.player.pos,[0,0,0]);assert.deepEqual(g.lanterns.map(l=>l.oil),[6000,6000,6000,0,0]);
});
test('ranking orders ties by instant across time zones, caps ten and validates name and score',()=>{
 const record={name:'May_01',score:10,nights_won:2,seed:12,achieved_at:'2026-11-20T08:00:00+07:00'};
 assert(validEntry(record));assert(!validEntry({...record,name:'x!'}));assert(!validEntry({...record,score:-1}));
 const later={...record,name:'Later',achieved_at:'2026-11-20T02:00:00Z'};
 const list=rank([later,...Array(12).fill({...record,score:1}),record]);assert.equal(list.length,10);assert.deepEqual(list.slice(0,2),[record,later]);
});
