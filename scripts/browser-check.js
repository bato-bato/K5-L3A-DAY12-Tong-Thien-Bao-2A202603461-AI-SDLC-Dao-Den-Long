import {chromium} from 'playwright-core';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const url=process.argv[2]||pathToFileURL(path.resolve('docs/demo/choi-ngay.html')).href;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',args:['--enable-unsafe-swiftshader']});
const out='docs/proof',frames='.qa/frames';
try {
 await Promise.all([mkdir(out,{recursive:true}),mkdir(frames,{recursive:true})]);
 const page=await browser.newPage({viewport:{width:960,height:600},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 // Advance only the animation clock; all game actions still use browser controls.
 await page.addInitScript(()=>{
  const queue=[];let time=0;
  window.requestAnimationFrame=cb=>{queue.push(cb);return queue.length;};
  window.advanceFrame=ms=>{time+=ms;queue.splice(0).forEach(cb=>cb(time));};
 });
 await page.goto(url);await page.waitForFunction(()=>document.querySelector('#game.menu'));
 let counter=0;
 const shots=[];
 async function capture(seconds,proof){
  const file=frames+'/frame-'+String(++counter).padStart(4,'0')+'.jpg';
  const data=await page.screenshot({type:'jpeg',quality:84,path:file});
  shots.push("file '"+file.split('/').pop()+"'\nduration "+seconds);
  if(proof)await writeFile(out+'/'+proof+'.jpg',data);
 }
 async function advance(ticks){await page.evaluate(n=>window.advanceFrame(n*1000/60+.00001),ticks);}
 await advance(1);await capture(2.4,'menu');
 await page.getByRole('button',{name:'Cách chơi'}).click();assert(await page.locator('dialog').isVisible());await page.getByText('Đã hiểu').click();
 await page.locator('#start').click();await advance(1);await capture(.85);
 async function walk(key,ticks,record=false){
  await page.keyboard.down(key);
  for(let elapsed=0;elapsed<ticks;elapsed+=6){
    await advance(Math.min(6,ticks-elapsed));if(record)await capture(.10);
  }
  await page.keyboard.up(key);
 }
 async function light(expected){
  await page.keyboard.press('e');await advance(1);
  assert.equal(await page.locator('#count').innerText(),expected+' / 5');
 }
 await walk('w',90,true);assert(Number.parseInt(await page.locator('#bag').innerText())>=3);
 await light(1);await capture(1.2,'first-lantern');
 const before=Number.parseInt(await page.locator('#bag').innerText());
 await page.keyboard.press('f');await advance(1);
 assert.equal(Number.parseInt(await page.locator('#bag').innerText()),before-1);
 await advance(6);await capture(.5,'pulse');
 await page.keyboard.press('Escape');assert(await page.locator('dialog').isVisible());
 await page.getByRole('button',{name:'Tiếp tục'}).click();assert(!(await page.locator('dialog').isVisible()));
 await page.keyboard.press('Space');
 await walk('a',120,true);await light(2);await capture(.7);
 await walk('s',150,true);await light(3);await capture(.7);
 await walk('d',150,true);await light(4);await capture(.7);
 await walk('d',90,true);await walk('w',120,true);await light(5);
 assert.equal(await page.locator('dialog h2').innerText(),'Đảo đã sáng đèn');await capture(2.1,'won');
 await page.getByRole('button',{name:'Chơi lại'}).click();
 assert.equal(await page.locator('#count').innerText(),'0 / 5');
 for(let i=0;i<60&&!(await page.locator('dialog').isVisible());i++){
   await page.evaluate(()=>{for(let j=0;j<5;j++)window.advanceFrame(100);});
 }
 assert.equal(await page.locator('dialog h2').innerText(),'Mây lạc trong sương');
 await capture(1.4,'lost');await page.getByRole('button',{name:'Thử lại'}).click();
 assert.equal(await page.locator('#life').innerText(),'3 / 3');assert.deepEqual(errors,[]);
 const tests=execFileSync(process.execPath,['--test','--test-reporter=spec'],{encoding:'utf8'}).replace(/\x1b\[[0-9;]*m/g,'');
 const log=out+'/night1.jsonl';
 execFileSync(process.execPath,['scripts/headless.js','--night','1','--seed','12','--ticks','18000','--inputs','scenarios/restore-island.json','--snapshot-every','60','--out',log]);
 const rows=(await readFile(log,'utf8')).trim().split('\n').map(JSON.parse);
 const terminal=rows.at(-1);assert.equal(terminal.state,'won');
 await writeFile(out+'/tests.txt',tests);
 await page.setContent('<html lang="vi"><meta charset="utf-8"><body style="background:#152a36;color:#ffe7bd;padding:24px;font:16px system-ui"><h1>Đảo Bến · Kết quả kiểm chứng</h1><pre id="proof" style="font:17px/1.7 monospace;white-space:pre-wrap"></pre></body></html>');
 const summary=rows.filter(row=>row.name==='lantern_lit').map(row=>'Tick '+row.tick+'   '+row.data.lantern_id+' sáng').join('\n');
 const totals=tests.split('\n').filter(line=>/ (tests|pass|fail) \d+/.test(line)).join('\n');
 await page.locator('#proof').evaluate((el,t)=>el.textContent=t,summary+'\n'+JSON.stringify(terminal)+'\n\n'+totals);
 await capture(4);
 shots.push(shots.at(-1).split('\n')[0]);
 await writeFile(frames+'/list.txt',shots.join('\n')+'\n');
 console.log('Browser: all five lanterns, pulse, win, loss, restart and pause/resume passed. Captured '+counter+' frames.');
}finally{await browser.close();}
