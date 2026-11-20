import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const out=process.env.PROOF_DIR||'docs/proof/winter';await mkdir(out,{recursive:true});
const url=process.argv[2]||pathToFileURL(path.resolve('docs/demo/choi-ngay.html')).href;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.screenshot({path:out+'/nguoi-tuyet.jpg',quality:95});await page.locator('#start').click();await page.getByRole('button',{name:'Vào đảo'}).click();
 await page.keyboard.down('w');await page.waitForTimeout(550);await page.keyboard.press('Shift');await page.keyboard.up('w');await page.keyboard.press('Space');
 await page.keyboard.press('p');assert.equal(await page.locator('dialog h2').innerText(),'Tạm dừng');
 const time=await page.locator('#timer').innerText();await page.waitForTimeout(300);assert.equal(await page.locator('#timer').innerText(),time);
 await page.getByRole('button',{name:'Cài đặt'}).click();await page.locator('#sensitivity').fill('7');await page.locator('#volume').fill('35');await page.locator('#palette').check();
 await page.getByRole('button',{name:'Quay lại'}).click();await page.getByRole('button',{name:'Tiếp tục'}).click();
 await page.screenshot({path:out+'/playing.jpg',quality:84});
 // Sample native RAF timestamps on the normal game. No clock overrides or synthetic frame durations.
 const perf=await page.evaluate(async()=>{
   const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');
   const times=[];await new Promise(resolve=>{const record=t=>{times.push(t);if(times.at(-1)-times[0]>=5500)resolve();else requestAnimationFrame(record);};requestAnimationFrame(record);});
   return {width:canvas.clientWidth,height:canvas.clientHeight,buffer:[canvas.width,canvas.height],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
    samples:times.length-1,elapsed_ms:times.at(-1)-times[0],mean_fps:1000*(times.length-1)/(times.at(-1)-times[0])};
 });
 await page.keyboard.press('p');await page.getByRole('button',{name:'Về menu'}).click();await page.reload();
 await page.locator('#help').click();await page.getByRole('button',{name:'Cài đặt'}).click();assert.equal(await page.locator('#sensitivity').inputValue(),'7');assert.equal(await page.locator('#volume').inputValue(),'35');
 assert(await page.locator('#palette').isChecked());assert.deepEqual(errors,[]);await writeFile(out+'/browser.json',JSON.stringify({browser:browser.version(),...perf,pause:true,settings_persist:true,errors},null,2));
 console.log(JSON.stringify(perf));assert(perf.mean_fps>=30,'Below 30 FPS');
}finally{await browser.close();}