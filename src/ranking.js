export function rank(entries){
 return [...entries].sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at)).slice(0,10);
}
export function validEntry(e){
 return e&&typeof e.name==='string'&&/^[A-Za-z0-9_]{3,12}$/.test(e.name)&&Number.isSafeInteger(e.score)&&e.score>=0&&Number.isInteger(e.nights_won)&&e.nights_won>=0&&e.nights_won<=3&&Number.isSafeInteger(e.seed)&&Number.isFinite(Date.parse(e.achieved_at))&&/(Z|[+-]\d\d:\d\d)$/.test(e.achieved_at);
}
