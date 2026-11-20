export const planar=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function ring(count,radius,start=0,y=0,cx=0){
  return Array.from({length:count},(_,i)=>{
    const a=(start+i*360/count)*Math.PI/180;
    return [cx+radius*Math.cos(a),y,radius*Math.sin(a)];
  });
}
const gardens=cx=>[...ring(4,10,0,0,cx),...ring(8,22,22.5,0,cx)];
export const maps=[null,{
 name:'Đảo Bến', islands:[[0,40]], lamps:[[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]],
 motes:[...ring(8,12),...ring(16,33)],spawns:ring(12,37,15),pads:[],charms:[],interval:480,cap:6
},{
 name:'Đảo Cau',islands:[[0,28],[70,28]],lamps:[[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]],
 motes:[...gardens(0),...gardens(70)],spawns:[...ring(8,26),...ring(8,26,0,0,70)],
 pads:[[20,0,18],[50,0,-18]],charms:[[35,0,0]],interval:420,cap:8
},{
 name:'Đảo Chuông',islands:[[0,45]],lamps:[[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]],
 motes:[...ring(18,34),...Array.from({length:8},(_,i)=>{const a=(20+20*i)*Math.PI/180;return [18*Math.cos(a),3,18*Math.sin(a)];}),...ring(4,5,45,6)],
 spawns:ring(16,43),pads:[[0,3,13]],charms:[[30,0,25],[-30,0,25]],interval:360,cap:10
}];
export function terrain(night,x,z){
 const map=maps[night];
 if(night===2&&x>=26&&x<=44&&Math.abs(z)<=2)return 0;
 if(!map.islands.some(([cx,r])=>Math.hypot(x-cx,z)<=r+1e-8))return -Infinity;
 if(night!==3)return 0;
 const r=Math.hypot(x,z);
 if(r<=8)return 6;
 if(z>0&&r>=12&&r<=24)return 3;
 for(const angle of [Math.PI/6,5*Math.PI/6]){
   const along=x*Math.cos(angle)+z*Math.sin(angle),across=-x*Math.sin(angle)+z*Math.cos(angle);
   if(along>=23.9&&along<=30&&Math.abs(across)<=1.5)return Math.min(3,(30-along)/2);
 }
 return 0;
}
export function spawnPoint(night){
 // The tower occupies the centre of Night 3. Start at its southern approach.
 return night===3?[0,0,30]:[0,0,0];
}