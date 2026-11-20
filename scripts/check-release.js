import {chromium} from 'playwright-core';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
const dir=await fs.mkdtemp(path.join(tmpdir(),'dao-release-')), env={...process.env,LANTERN_LEADERBOARD:path.join(dir,'scores.json')};
const evidence='docs/proof/phase4',frames='.qa/release-frames';await fs.mkdir(evidence,{recursive:true});await fs.mkdir(frames,{recursive:true});
const receipts=JSON.parse(await fs.readFile('bench.json')),soak=JSON.parse(await fs.readFile('soak.json'));
const tests=execFileSync(process.execPath,['--test'],{encoding:'utf8'});await fs.writeFile(evidence+'/tests.txt',tests);
execFileSync(process.execPath,['scripts/headless.js','--seed','12','--night','1','--ticks','120','--scenario','scenarios/dawn.json','--out',evidence+'/dawn.jsonl']);
const end=JSON.parse((await fs.readFile(evidence+'/dawn.jsonl','utf8')).trim().split('\n').at(-1));
let server,browser,page,framesList=[],errors=[];
async function open(){
 server=spawn(process.execPath,['scripts/run.js','--port','0'],{env,stdio:['ignore','pipe','inherit']});
 const [message]=await once(server.stdout,'data'),url=String(message).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome'});
 page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
}
async function close(){await browser?.close();browser=null;if(server&&server.exitCode===null){const stop=once(server,'exit');server.kill();await stop;}server=null;}
async function shot(seconds){const file='f'+String(framesList.length).padStart(4,'0')+'.jpg';await page.screenshot({path:path.join(frames,file),quality:80});framesList.push("file '"+file+"'\nduration "+seconds);}
const click=s=>page.getByRole('button',{name:s,exact:true}).click();
try{
 await open();await shot(1);await page.locator('#options').click();await click('Tương tác · E');await page.keyboard.press('w');assert.match(await page.locator('#key-feedback').innerText(),/đã dùng/);
 await page.keyboard.press('q');await page.locator('#large').check();await page.locator('#reduced').check();await shot(1);
 await click('Quay lại');await page.reload();await page.locator('#options').click();assert(await page.locator('#large').isChecked());assert(await page.locator('#reduced').isChecked());await click('Tương tác · Q');await click('Khôi phục mặc định');
 await page.locator('#large').uncheck();await page.locator('#reduced').uncheck();await click('Quay lại');
 await page.locator('#start').click();await click('Vào đảo');await page.keyboard.down('d');
 for(let i=0;i<62;i++){const t=performance.now();if(i===8)await page.keyboard.press('Space');if(i===22)await page.keyboard.press('Shift');await shot(.1);await new Promise(r=>setTimeout(r,Math.max(0,100-performance.now()+t)));}
 await page.locator('#save-score').waitFor({timeout:90000});await page.keyboard.up('d');await page.locator('[name=name]').fill('May_01');await click('Lưu điểm');await page.getByText('Đã lưu điểm.').waitFor();await shot(1);
 await close();await open();await page.locator('#scores').click();assert.match(await page.locator('#ranking').innerText(),/May_01 · 0 điểm · 0\/3 đêm/);await shot(1.5);
 const file=path.join(dir,'export.json');execFileSync(process.execPath,['scripts/run.js','--export-leaderboard',file],{env});
 const {entries}=JSON.parse(await fs.readFile(file));assert.equal(entries.length,1);assert.equal(entries[0].name,'May_01');assert.equal(entries[0].score,0);assert.deepEqual(errors,[]);
 await fs.writeFile(evidence+'/release-ui.json',JSON.stringify({duplicate_key_detected:true,binding_and_accessibility_persist:true,loss_saved_after_restart:entries[0],cli_export:true,errors},null,2));
 await page.setContent('<body style="background:#111a31;color:#fff3d5;font:28px/1.55 system-ui;padding:55px"><h1>Kiểm chứng bản 1.0.0</h1><div style="white-space:pre-line" id="proof"></div></body>');
 await page.locator('#proof').evaluate((el,t)=>el.textContent=t,[tests.split('\n').filter(x=>/pass \d|fail \d|# pass|# fail/.test(x)).join(' · '),'Headless · '+end.state+' · '+end.ticks+' tick · '+end.score+' điểm','Benchmark 200 Bóng Mực · 100 đom đóm',receipts.avg_fps.toFixed(1)+' FPS trung bình · 1% low '+receipts.p1_low_fps.toFixed(1)+' · tải '+receipts.load_ms+' ms',soak.nights+' Đêm · '+soak.crashes+' crash · RSS '+soak.mem_start_mb.toFixed(1)+' → '+soak.mem_end_mb.toFixed(1)+' MB'].join('\n'));
 await shot(5);await fs.writeFile(frames+'/list.txt',framesList.join('\n')+'\n'+framesList.at(-1).split('\n')[0]+'\n');console.log('Release UI, restart and export passed.');
}finally{await close();}
