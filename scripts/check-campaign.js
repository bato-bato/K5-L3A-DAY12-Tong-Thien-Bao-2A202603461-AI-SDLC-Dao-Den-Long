// Browser integration: use the shipped build for play, then inject small scenario fixtures
// into the source served solely to this test to reach all campaign boundaries.
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const out='docs/proof/phase2',frames='.qa/campaign-frames';
await Promise.all([mkdir(out,{recursive:true}),mkdir(frames,{recursive:true})]);
const server=await createServer({configFile:false,server:{port:0,host:'127.0.0.1',watch:null},optimizeDeps:{exclude:['three']},logLevel:'error'});
await server.listen();
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],observed=[],shots=[];let index=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
   let clock=0,queue=[];
   window.requestAnimationFrame=f=>queue.push(f);
   window.advance=ms=>{clock+=ms;const tasks=queue;queue=[];tasks.forEach(f=>f(clock));};
 });
 async function advance(n=1){await page.evaluate(n=>window.advance(n*1000/60+.00001),n);}
 async function shot(seconds,name){
  const img='s'+String(++index).padStart(4,'0')+'.jpg';const bytes=await page.screenshot({path:path.join(frames,img),quality:84});
  if(name)await writeFile(path.join(out,name+'.jpg'),bytes);
  shots.push("file '"+img+"'\nduration "+seconds);
 }
 const click=label=>page.getByRole('button',{name:label,exact:true}).click();
 await page.goto(pathToFileURL(path.resolve('docs/demo/choi-ngay.html')).href);await page.locator('#game.menu').waitFor();await advance();await shot(1.8,'menu');
 await click('Bắt đầu');await shot(1);await click('Vào đảo');await advance();
 await page.keyboard.down('d');
 for(let i=0;i<22;i++){if(i===8)await page.keyboard.press('Shift');if(i===15)await page.keyboard.press('Space');await advance(6);await shot(.10);}
 await page.keyboard.up('d');await page.keyboard.press('p');await shot(.8);await click('Cài đặt');await shot(.6);await click('Quay lại');await click('Tiếp tục');
 let losing=false;
 await page.route(/\/src\/game\.js(?:\?|$)/,async route=>{
   const response=await route.fetch();let source=await response.text();
   assert(source.includes('export function createGame('));source=source.replace('export function createGame(','function createBaseGame(');
   source+='\nexport function createGame(seed=12,config={},night=1){ const base=createBaseGame(seed,config,night), last=base.lanterns.at(-1);'+
    (losing?'return createBaseGame(seed,{player:{flames:1},random_motes:false,shades:[{pos:[0,.8,0]}]},night);':
    'return createBaseGame(seed,{random_motes:false,random_shades:false,random_drifters:false,player:{pos:last.pos,carried:1},lanterns:base.lanterns.map(l=>({id:l.id,lit:l.id!==last.id,deposited:l.id===last.id?9:10}))},night);')+'}';
   await route.fulfill({response,body:source});
 });
 await page.goto(server.resolvedUrls.local[0]);await page.locator('#game.menu').waitFor();await advance();
 await page.evaluate(()=>{const note=document.createElement('div');note.textContent='Kiểm thử chuyển Đêm · Scenario còn một đom đóm để nạp';note.style.cssText='position:fixed;bottom:8px;left:12px;background:#0e1430dd;color:#ffe9b0;padding:5px 12px;font:14px system-ui;z-index:9';document.body.append(note);});
 await click('Bắt đầu');
 for(let n=1;n<=3;n++){
  assert.match(await page.locator('dialog h2').innerText(),new RegExp('Đêm '+n));await shot(1.2);
  await click('Vào đảo');await advance();await shot(1.4,'night-'+n);
  await page.keyboard.press('e');await advance();assert.equal(await page.locator('dialog h2').innerText(),'Đảo đã sáng đèn');
  const msg=await page.locator('dialog p').innerText();observed.push(msg);await shot(1.2);
  await click(n<3?'Đêm kế tiếp':'Đón bình minh');
 }
 assert.equal(await page.locator('dialog h2').innerText(),'Bình Minh');const total=Number((await page.locator('dialog p').innerText()).match(/(\d+)\./)[1]);
 assert.equal(total,observed.reduce((acc,msg)=>acc+Number(msg.match(/· (\d+) điểm/)[1]),0));await shot(1.7,'dawn');
 await click('Về menu');losing=true;await page.reload();await page.locator('#game.menu').waitFor();
 await click('Bắt đầu');await click('Vào đảo');await advance();assert.equal(await page.locator('dialog h2').innerText(),'Mây đã tắt lửa');await click('Chơi lại Đêm này');
 assert.match(await page.locator('dialog h2').innerText(),/Đêm 1/);assert.deepEqual(errors,[]);
 const perf=JSON.parse(await readFile(out+'/browser.json')),headless=JSON.parse(await readFile(out+'/headless-win32.json'));
 await page.setContent('<body style="background:#0e1430;color:#f5f1e6;font:24px/1.6 system-ui;padding:7vw"><h1>Ba hòn đảo · Kết quả chạy thật</h1><pre style="font:24px/1.6 system-ui" id="proof"></pre></body>');
 await page.locator('#proof').evaluate((e,s)=>e.textContent=s,'Chrome 1280 × 720 · '+perf.mean_fps.toFixed(1)+' FPS trung bình\n'+headless.runs.map(r=>'Đêm '+r.night+' · '+r.ticks+' tick · '+r.elapsed_ms+' ms').join('\n')+'\nChuỗi ba Đêm, Bình Minh và chơi lại: đạt');
 await shot(3);shots.push(shots.at(-1).split('\n')[0]);await writeFile(frames+'/list.txt',shots.join('\n')+'\n');
 await writeFile(out+'/campaign.json',JSON.stringify({scenario:'Each test night initializes its final lamp at 9/10. Only keyboard and menu actions follow.',wins:observed,dawn_total:total,retry_same_night:true,errors},null,2));
 console.log('Campaign UI passed, final total '+total+', '+index+' demo frames.');
}finally{await browser.close();await server.close();}