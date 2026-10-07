/** Upholstered chair surfaces in the existing pilot drawing space. */
type Point={x:number;y:number;z:number};
type Panel={points:Point[];fill:string};
const panels:Panel[]=[];
// A gently cupped, tapered shell. Its side wings turn forward around the sitter.
const back=(u:number,v:number,front:boolean):Point=>({
 x:u*(25+12*v),y:108+112*v+3*u*u,
 z:26-6*v-11*u*u-(front?7:0),
});
// Omit the uppermost rib; retain all lower sections and the seat position.
for(let row=1;row<7;row++)for(let col=0;col<12;col++){
 const u=-1+col/6,w=u+1/6,v=row/7,t=(row+1)/7;
 for(const front of [false,true]){
  const inset=(p:Point)=>({...p,z:p.z+(front?-1:1)*Math.sin((col+.5)*Math.PI/12)*1.5});
  panels.push({points:[back(u,v,front),back(w,v,front),back(w,t,front),back(u,t,front)].map(inset),fill:col===0||col===11?'#66452e':row%2?'#393a29':'#41422e'});
 }
}
for(const side of [-1,1])for(let row=2;row<14;row++){
 const v=row/14,t=(row+1)/14;
 panels.push({points:[back(side,v,false),back(side,t,false),back(side,t,true),back(side,v,true)],fill:side<0?'#805b3a':'#523822'});
}
// Rolled leather edges and padded seat are rounded solids, not flat outlines.
function cushion(cx:number,cy:number,cz:number,rx:number,ry:number,rz:number,colour:string){
 const point=(a:number,b:number)=>({x:cx+rx*Math.sin(a)*Math.cos(b),y:cy+ry*Math.cos(a),z:cz+rz*Math.sin(a)*Math.sin(b)});
 for(let i=0;i<8;i++)for(let j=0;j<20;j++)panels.push({fill:colour,points:[point(i*Math.PI/8,j*Math.PI/10),point((i+1)*Math.PI/8,j*Math.PI/10),point((i+1)*Math.PI/8,(j+1)*Math.PI/10),point(i*Math.PI/8,(j+1)*Math.PI/10)]});
}
cushion(0,216,-5,37,7,30,'#484631');
for(const side of [-1,1]){
 cushion(side*34,207,-4,5,10,27,'#65462e');
 for(let i=4;i<28;i++){const p=back(side,i/28,false);cushion(p.x,p.y,p.z-3,2,3,4,'#795739');}
}
// Fine horizontal seams on both upholstery faces; subtle warm worn edging.
for(let row=2;row<7;row++)for(let col=0;col<12;col++)for(const front of [false,true]){
 const v=row/7,u=-.87+col*.145,w=u+.145;
 const edge=(x:number,y:number)=>{const p=back(x,y,front);return {...p,z:p.z+(front?-2:2)};};
 panels.push({points:[edge(u,v),edge(w,v),edge(w,v+.006),edge(u,v+.006)],fill:'#25271f'});
}
export function pilotChairVolume(yaw:number){
 const a=yaw*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 return panels.map(panel=>{
  const points=panel.points.map(p=>({x:90+p.x*c+p.z*s,y:p.y,z:p.z*c-p.x*s}));
  return {d:`M${points.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('L')}Z`,fill:panel.fill,depth:+(points.reduce((n,p)=>n+p.z,0)/points.length).toFixed(5)};
 });
}
