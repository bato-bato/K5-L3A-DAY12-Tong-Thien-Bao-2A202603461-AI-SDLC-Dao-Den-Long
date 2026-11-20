import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const url=process.argv[2]||'http://127.0.0.1:5173';
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
 await page.keyboard.down('a');await page.keyboard.down('w');
 for(let i=0;i<17;i++){await advance(4);await capture(.07);}
 await page.keyboard.up('w');
 for(let i=0;i<15;i++){await advance(4);await capture(.07);}
 await page.keyboard.up('a');await advance(1);
 assert(Number(await page.locator('#bag').innerText())>=3);
 await capture(.8);await page.keyboard.press('e');await advance(1);
 assert.equal(await page.locator('#count').innerText(),'1 / 3');await capture(2,'first-lantern');
 await page.keyboard.press('Escape');assert(await page.locator('dialog').isVisible());
 await page.getByRole('button',{name:'Tiếp tục'}).click();assert(!(await page.locator('dialog').isVisible()));
 assert.deepEqual(errors,[]);
 const tests=execFileSync(process.execPath,['--test','--test-reporter=spec'],{encoding:'utf8'}).replace(/\x1b\[[0-9;]*m/g,'');
 const raw=execFileSync(process.execPath,['scripts/headless.js','scenarios/first-lantern.json'],{encoding:'utf8'});
 await writeFile(out+'/tests.txt',tests);await writeFile(out+'/first-lantern.json',raw);
 await page.setContent('<html lang="vi"><meta charset="utf-8"><body style="background:#152a36;color:#ffe7bd;padding:24px;font:16px system-ui"><h1>Kết quả kiểm chứng</h1><pre id="proof" style="font:15px/1.55 monospace;white-space:pre-wrap"></pre></body></html>');
 await page.locator('#proof').evaluate((el,t)=>el.textContent=t,tests+'\nnode scripts/headless.js scenarios/first-lantern.json\n'+raw);
 await capture(4);
 shots.push(shots.at(-1).split('\n')[0]);
 await writeFile(frames+'/list.txt',shots.join('\n')+'\n');
 console.log('Browser controls, first lantern, pause and resume passed. Captured '+counter+' frames.');
}finally{await browser.close();}