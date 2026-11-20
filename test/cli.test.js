import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import contract from '../game.contract.json' with {type:'json'};

test('declared CLI writes deterministic JSONL and handles invalid files atomically',()=>{
  mkdirSync('.qa',{recursive:true});const dir=mkdtempSync('.qa/contract-test-');
  const output=path.join(dir,'out.jsonl'),input=path.join(dir,'inputs.json'),scenario=path.join(dir,'scenario.json');
  const [node,script]=contract.headless_cmd.split(' ');assert.equal(node,'node');
  const call=(...extra)=>spawnSync(process.execPath,[script,'--night','1','--seed','9','--ticks','12','--out',output,...extra],{encoding:'utf8'});
  try{
    writeFileSync(scenario,JSON.stringify({random_motes:false,random_shades:false,player:{pos:[0,0,0]},motes:[[0,0,0]]}));
    writeFileSync(input,JSON.stringify({frames:[{tick:0,move:[0,1]},{tick:2,move:[0,0]}]}));
    const args=['--scenario',scenario,'--inputs',input];
    assert.equal(call(...args).status,0);
    const bytes=readFileSync(output,'utf8'),rows=bytes.trimEnd().split('\n').map(JSON.parse);
    assert.deepEqual(rows.map(r=>r.type),['snapshot','event','event','snapshot','end']);assert.deepEqual(rows[3].player.pos,[0,0,.2]);
    assert.equal(call(...args).status,0);assert.equal(readFileSync(output,'utf8'),bytes);
    for(const bad of ['{', '{"frames":[{"tick":2},{"tick":2}]}','{"frames":[{"tick":0,"move":[2,0]}]}','{"frames":[{"tick":0,"pulse":1}]}']){
      writeFileSync(input,bad);const result=call(...args);assert.equal(result.status,2);assert.ok(result.stderr);assert.equal(readFileSync(output,'utf8'),bytes);
    }
    for(const bad of ['null','{"lanterns":[{"id":"L9"}]}','{"shades":[{"pos":[1,2]}]}','{"random_motes":2}']){
      writeFileSync(scenario,bad);assert.equal(call('--scenario',scenario).status,2);
    }
    assert.notEqual(call('--snapshot-every','0').status,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});