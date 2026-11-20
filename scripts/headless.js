import {readFileSync,openSync,writeFileSync,closeSync,renameSync,rmSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {simulate} from '../src/game.js';
import {validateInputs,validateScenario} from '../src/scenario.js';

function options(args){
  const values=new Map();
  const flags=new Set(['--seed','--night','--scenario','--inputs','--ticks','--out','--snapshot-every']);
  for(let i=0;i<args.length;i+=2){
    const flag=args[i],value=args[i+1];
    if(!flags.has(flag)||values.has(flag)||!value||value.startsWith('--'))throw Error('Invalid option '+flag);
    values.set(flag,value);
  }
  function integer(flag,min,defaultValue){
    const v=values.get(flag);
    if(v===undefined&&defaultValue!==undefined)return defaultValue;
    if(!/^-?\d+$/.test(v??'')||!Number.isSafeInteger(Number(v))||Number(v)<min)throw Error('Invalid or missing '+flag);
    return Number(v);
  }
  const night=integer('--night',1);if(night>3)throw Error('Invalid night');
  if(!values.has('--out'))throw Error('Missing --out');
  return {night,seed:integer('--seed',Number.MIN_SAFE_INTEGER),ticks:integer('--ticks',0),snapshotEvery:integer('--snapshot-every',1,10),
    output:values.get('--out'),inputFile:values.get('--inputs'),scenarioFile:values.get('--scenario')};
}
function jsonFile(file,fallback){
  if(!file)return fallback;
  return JSON.parse(readFileSync(file,'utf8').replace(/^\uFEFF/,''));
}
function run(){
  const args=options(process.argv.slice(2));
  let config,inputs;
  try {
    config=jsonFile(args.scenarioFile,{});inputs=jsonFile(args.inputFile,{frames:[]});
    validateScenario(config,args.night);validateInputs(inputs);
  }catch(error){process.exitCode=2;throw error;}
  const temp=args.output+'.'+randomUUID()+'.tmp';
  const fd=openSync(temp,'wx');
  let complete=false;
  try{
    try{
      let buffer='';
      simulate({...args,scenario:config,frames:inputs.frames},line=>{
        buffer+=JSON.stringify(line)+'\n';
        if(buffer.length>=65536){writeFileSync(fd,buffer);buffer='';}
      });
      if(buffer)writeFileSync(fd,buffer);
    }finally{closeSync(fd);}
    renameSync(temp,args.output);complete=true;
  }finally{if(!complete)rmSync(temp,{force:true});}
}
try{run();}catch(error){console.error(error.message);process.exitCode=process.exitCode||1;}