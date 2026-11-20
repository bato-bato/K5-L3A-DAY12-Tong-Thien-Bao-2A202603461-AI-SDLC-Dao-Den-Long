import {chromium} from 'playwright-core';
import {parseArgs} from 'node:util';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import os from 'node:os';
const {values:{seed,duration,out}}=parseArgs({options:{seed:{type:'string',default:'42'},duration:{type:'string',default:'30'},out:{type:'string',default:'bench.json'}}});
if(!Number.isInteger(+seed)||!Number.isFinite(+duration)||+duration<=0)throw Error('Invalid seed or duration');
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:false,args:['--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-gpu-vsync','--disable-frame-rate-limit','--window-size=1296,808']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 let loadMs;
 await page.exposeFunction('firstBenchFrame',()=>{loadMs=Math.round(process.uptime()*1000);console.log('First frame at '+loadMs+' ms');});
 let complete,fail;const done=new Promise((r,j)=>{complete=r;fail=j;});
 await page.exposeFunction('finishBench',complete);page.on('pageerror',fail);
 const url=pathToFileURL(resolve('docs/demo/choi-ngay.html'));url.search=new URLSearchParams({bench:seed,duration});
 await page.goto(url.href);await page.bringToFront();const timer=setTimeout(()=>fail(Error('No benchmark frames')),60000+Number(duration)*1000);
 let dt;try{dt=await done;}finally{clearTimeout(timer);}
 const gl=await page.evaluate(()=>{const g=document.querySelector('canvas').getContext('webgl2'),ext=g.getExtension('WEBGL_debug_renderer_info');return ext?g.getParameter(ext.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);});
 const sorted=dt.sort((a,b)=>a-b),n=dt.length,k=Math.max(1,Math.ceil(.01*n)),fps=a=>1000*a.length/a.reduce((s,x)=>s+x,0);
 const report={contract_version:'1.3',avg_fps:fps(dt),p1_low_fps:fps(sorted.slice(-k)),frame_ms_p95:sorted[Math.ceil(.95*n)-1],frames:n,load_ms:loadMs,peak_mem_mb:null,vsync_off:true,renderer:'Three.js r180 / Chromium '+browser.version()+' / '+gl,os:os.type()+' '+os.release()+' '+os.arch()};
 await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
