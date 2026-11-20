import contract from '../game.contract.json' with { type:'json' };
export const tuning = Object.freeze(contract.tuning);

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(label+' must be an object');
}
function number(value, label, min=-Infinity, max=Infinity) {
  if (!Number.isFinite(value) || value<min || value>max) throw Error('invalid '+label);
}
function count(value, label, max=Number.MAX_SAFE_INTEGER) {
  number(value,label,0,max);
  if (!Number.isSafeInteger(value)) throw Error('invalid '+label);
}
function bool(value,label) { if(typeof value!=='boolean') throw Error('invalid '+label); }
function vector(value,n,label) {
  if(!Array.isArray(value)||value.length!==n)throw Error('invalid '+label);
  value.forEach(v=>number(v,label));
}
function list(obj,key,check) {
  if(!(key in obj))return;
  if(!Array.isArray(obj[key]))throw Error('invalid '+key);
  obj[key].forEach(check);
}
export function validateScenario(config) {
  object(config,'scenario');
  for(const key of ['random_motes','random_shades'])if(key in config)bool(config[key],key);
  if('time_left_s' in config)number(config.time_left_s,'time_left_s',0);
  if('player' in config) {
    const p=config.player;object(p,'player');
    if('pos' in p)vector(p.pos,3,'player.pos');
    if('carried' in p)count(p.carried,'player.carried',tuning.carry_capacity);
    if('flames' in p)count(p.flames,'player.flames');
  }
  const lampIds=new Set(),shadeIds=new Set();
  list(config,'motes',pos=>vector(pos,3,'mote position'));
  list(config,'shades',s=>{
    object(s,'shade');vector(s.pos,3,'shade.pos');
    if('id' in s){
      if(typeof s.id!=='string'||!s.id.length||shadeIds.has(s.id))throw Error('invalid shade id');
      shadeIds.add(s.id);
    }
  });
  list(config,'lanterns',l=>{
    object(l,'lantern');
    if(!/^L[1-5]$/.test(l.id)||lampIds.has(l.id))throw Error('invalid lantern id');
    lampIds.add(l.id);
    if('pos' in l)vector(l.pos,3,'lantern.pos');
    if('deposited' in l)count(l.deposited,'deposited',tuning.lantern_cost);
    if('lit' in l)bool(l.lit,'lit');
  });
}
export function validateInputs(inputs) {
  object(inputs,'inputs');if(!Array.isArray(inputs.frames))throw Error('inputs.frames must be an array');
  let previous=-1;
  for(const f of inputs.frames){
    object(f,'frame');count(f.tick,'frame.tick');
    if(f.tick<=previous)throw Error('frame ticks must strictly increase');previous=f.tick;
    if('move' in f){vector(f.move,2,'move');f.move.forEach(v=>number(v,'move',-1,1));}
    if('cam_yaw_deg' in f)number(f.cam_yaw_deg,'cam_yaw_deg');
    for(const key of ['interact','pulse','jump','dash'])if(key in f)bool(f[key],key);
  }
}
