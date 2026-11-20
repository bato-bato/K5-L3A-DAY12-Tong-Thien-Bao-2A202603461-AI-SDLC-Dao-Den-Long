import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import assert from 'node:assert/strict';
import path from 'node:path';

const out='docs/proof/phase2',work='.qa/contract-v11';
mkdirSync(out,{recursive:true});mkdirSync(work,{recursive:true});
const cases=JSON.parse(readFileSync('scenarios/phase2/cases.json'));
function cli(cmd,args){
 const result=spawnSync(process.execPath,[cmd,...args],{encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr||result.error?.message||String(result.status));
 return result.stdout;
}
function execute(name,night,ticks,scenario,frames,every=10){
 const file=path.join(work,name+'.jsonl'),base=['--seed','12','--night',String(night),'--ticks',String(ticks),'--snapshot-every',String(every),'--out',file];
 if(scenario){const src=path.join(work,name+'.scenario.json');writeFileSync(src,JSON.stringify(scenario));base.push('--scenario',src);}
 if(frames){const src=path.join(work,name+'.inputs.json');writeFileSync(src,JSON.stringify({frames}));base.push('--inputs',src);}
 const start=performance.now();cli('scripts/headless.js',base);
 const elapsed_ms=Math.round(performance.now()-start),data=readFileSync(file),rows=data.toString().trim().split('\n').map(JSON.parse);
 return {elapsed_ms,rows,sha256:createHash('sha256').update(data).digest('hex')};
}
const results={};
for(const [name,c] of Object.entries(cases)){
 const a=execute(name,c.n,c.ticks,c.scenario,c.frames),b=execute(name,c.n,c.ticks,c.scenario,c.frames);
 assert.equal(a.sha256,b.sha256);results[name]={end:a.rows.at(-1),events:a.rows.filter(r=>r.type==='event'),sha256:a.sha256};
}
writeFileSync(path.join(out,'scenarios.json'),JSON.stringify(results,null,2)+'\n');
const win=execute('restore',1,18000,null,JSON.parse(readFileSync('scenarios/restore-island.json')).frames,60);
assert.equal(win.rows.at(-1).state,'won');
writeFileSync(path.join(out,'night1.jsonl'),win.rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
const perf=[];
for(const [night,ticks] of [[1,18000],[2,19800],[3,21600]]){
 const a=execute('benchmark-'+night,night,ticks,{player:{flames:400}},null);const end=a.rows.at(-1);
 assert.equal(end.ticks,ticks);assert(a.elapsed_ms<30000);
 perf.push({night,ticks,elapsed_ms:a.elapsed_ms,snapshot_every:10,rows:a.rows.length,sha256:a.sha256});
}
const report={platform:os.platform(),release:os.release(),cpu:os.cpus()[0].model,node:process.version,
 scenario:'Default spawns and wind; 400 starting flames to keep the entire night running.',runs:perf};
writeFileSync(path.join(out,'headless-'+os.platform()+'.json'),JSON.stringify(report,null,2)+'\n');
const tests=spawnSync(process.execPath,['--test','--test-reporter=spec'],{encoding:'utf8'});if(tests.status!==0)throw Error(tests.stdout+tests.stderr);
writeFileSync(path.join(out,'tests-'+os.platform()+'.txt'),tests.stdout.replace(/\x1b\[[0-9;]*m/g,''));
console.log(JSON.stringify(report));
