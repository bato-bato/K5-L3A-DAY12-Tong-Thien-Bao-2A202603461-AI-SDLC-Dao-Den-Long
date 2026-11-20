import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {rank,validEntry} from '../src/ranking.js';
const {values}=parseArgs({options:{'export-leaderboard':{type:'string'},port:{type:'string',default:'5173'}}});
const file=process.env.LANTERN_LEADERBOARD||path.join(os.homedir(),'.dao-den-long','leaderboard.json');
function entries(){try{return rank(JSON.parse(fs.readFileSync(file,'utf8')).entries);}catch(e){if(e.code==='ENOENT')return [];throw e;}}
if(values['export-leaderboard']){
 fs.writeFileSync(values['export-leaderboard'],JSON.stringify({entries:entries()},null,2)+'\n');
}else{
 const html=fileURLToPath(new URL('../docs/demo/choi-ngay.html',import.meta.url));
 const server=http.createServer(async(req,res)=>{
  try{
   if(req.url==='/api/leaderboard'){
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    if(req.method==='POST'){
     if(req.headers.origin!=='http://127.0.0.1:'+server.address().port||req.headers['content-type']!=='application/json'){res.writeHead(403).end();return;}
     let body='';for await(const chunk of req){body+=chunk;if(body.length>1024){res.writeHead(413).end();return;}}
     const e=JSON.parse(body);if(!validEntry(e)){res.writeHead(400).end();return;}
     const sorted=rank([...entries(),e]);fs.mkdirSync(path.dirname(file),{recursive:true});
     fs.writeFileSync(file+'.'+process.pid+'.tmp',JSON.stringify({entries:sorted}));fs.renameSync(file+'.'+process.pid+'.tmp',file);
    }else if(req.method!=='GET'){res.writeHead(405).end();return;}
    res.end(JSON.stringify({entries:entries()}));return;
   }
   if(req.url==='/'&&req.method==='GET'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(html,'utf8').replace('<head>','<head><meta name="leaderboard-storage" content="server">'));return;}
   res.writeHead(404).end();
  }catch(e){res.writeHead(e instanceof SyntaxError?400:500).end();}
 });
 server.listen(+values.port,'127.0.0.1',()=>console.log('Đảo Đèn Lồng · http://127.0.0.1:'+server.address().port));
}
