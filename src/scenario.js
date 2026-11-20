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
export function validateScenario(config,night=1) {
  object(config,'scenario');
  for(const key of ['random_motes','random_shades','random_drifters','wind_enabled'])if(key in config)bool(config[key],key);
  if('time_left_s' in config)number(config.time_left_s,'time_left_s',0);
  if('player' in config) {
    const p=config.player;object(p,'player');
    if('pos' in p)vector(p.pos,3,'player.pos');
    if('carried' in p)count(p.carried,'player.carried',Math.min(20,10+2*(p.successful_lights??0)));
    for(const k of ['successful_lights','invuln_ticks','dash_cd_ticks','pulse_cd_ticks','charm_ticks'])if(k in p)count(p[k],k);
    if('flames' in p)count(p.flames,'player.flames');
  }
  const lampIds=new Set(),shadeIds=new Set();
  const drifterIds=new Set(),charmIds=new Set();
  function checkId(entity,ids){if('id' in entity){if(typeof entity.id!=='string'||!entity.id||ids.has(entity.id))throw Error('invalid or duplicate id');ids.add(entity.id);}}
  list(config,'drifters',d=>{
    object(d,'drifter');checkId(d,drifterIds);vector(d.pos,3,'drifter.pos');
    if('state' in d&&!['idle','chase','flee','removed'].includes(d.state))throw Error('invalid drifter state');
    if('stolen' in d)count(d.stolen,'stolen');
    if('state_ticks_left' in d)count(d.state_ticks_left,'state_ticks_left');
  });
  list(config,'charms',c=>{
    object(c,'charm');checkId(c,charmIds);if('pos' in c)vector(c.pos,3,'charm.pos');
    if('available' in c)bool(c.available,'available');
    if('respawn_s' in c)number(c.respawn_s,'respawn_s',0);
    if('respawn_ticks' in c)count(c.respawn_ticks,'respawn_ticks');
  });
  list(config,'motes',pos=>vector(pos,3,'mote position'));
  list(config,'shades',s=>{
    if('state' in s&&!['drain','spawning','wander','chase','recoil','stunned'].includes(s.state))throw Error('invalid shade state');
    if('state_ticks_left' in s)count(s.state_ticks_left,'state_ticks_left');
    object(s,'shade');vector(s.pos,3,'shade.pos');
    if('id' in s){
      if(typeof s.id!=='string'||!s.id.length||shadeIds.has(s.id))throw Error('invalid shade id');
      shadeIds.add(s.id);
    }
  });
  list(config,'lanterns',l=>{
    object(l,'lantern');
    if(!/^L[1-7]$/.test(l.id)||Number(l.id.slice(1))>4+night||lampIds.has(l.id))throw Error('invalid lantern id');
    lampIds.add(l.id);
    if('pos' in l)vector(l.pos,3,'lantern.pos');
    if('deposited' in l)count(l.deposited,'deposited',tuning.lantern_cost);
    if('fuel' in l)number(l.fuel,'fuel',0,100);if('ever_lit' in l)bool(l.ever_lit,'ever_lit');
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
    for(const key of ['interact','pulse','jump','dash','pause'])if(key in f)bool(f[key],key);
  }
}