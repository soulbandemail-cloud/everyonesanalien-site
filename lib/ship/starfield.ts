/** One seeded, stationary sky shared by both camera positions. */
export const SKY_WIDTH=1800,SKY_HEIGHT=1100;
const hash=(x:number,y:number)=>{
 let n=Math.imul(x,374761393)+Math.imul(y,668265263)+19381;
 n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
};
export function skyNoise(x:number,y:number){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;
}
export function galacticLight(x:number,y:number){
 const warp=(skyNoise(x*7+20,y*7)-.5)*.11+(skyNoise(x*19,y*19)-.5)*.035;
 const centre=1.03-1.18*x+.065*Math.sin(x*5);
 const distance=y-centre+warp;
 const width=.055+.065*skyNoise(x*9,6);
 const envelope=Math.exp(-.5*(distance/width)**2);
 const coarse=skyNoise(x*13,y*13),fine=skyNoise(x*63+9,y*63);
 const detail=.52*coarse+.3*skyNoise(x*29,y*29)+.18*fine;
 const dust=skyNoise(x*31+8,y*22+40);
 const lane=Math.exp(-(((distance+.014*Math.sin(x*28))/.023)**2));
 const gaps=Math.max(.08,Math.min(1,(dust-.24)*2.6))*(1-.78*lane);
 // Preserve quiet navy behind the central branding.
 const quiet=1-.65*Math.exp(-(((x-.5)/.19)**2)-((y-.25)/.22)**2);
 return envelope*Math.max(0,detail-.29)*gaps*quiet;
}
export type SkyStar={x:number;y:number;radius:number;alpha:number;tone:number;spike:boolean};
export function skyStars():SkyStar[]{
 let seed=871923;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const stars:SkyStar[]=[];
 for(let i=0;i<20000;i++){
  const x=random(),y=random(),cluster=skyNoise(x*8+13,y*8);
  const band=galacticLight(x,y);
  if(random()>.105+cluster*cluster*.22+band*2.2)continue;
  const population=random(),spike=population>.998;
  stars.push({x:x*SKY_WIDTH,y:y*SKY_HEIGHT,radius:spike?1.05+random()*.5:population>.93?.65+random()*.45:.28+random()*.36,
   alpha:spike?.7+random()*.2:population>.93?.5+random()*.35:.24+random()*.38,tone:random(),spike});
 }
 return stars;
}
export function paintSky(canvas:HTMLCanvasElement){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 canvas.width=SKY_WIDTH;canvas.height=SKY_HEIGHT;
 // Low-resolution diffuse light, sampled once; individual stars remain sharp.
 const cloud=document.createElement('canvas');cloud.width=720;cloud.height=440;
 const c=cloud.getContext('2d')!;const pixels=c.createImageData(cloud.width,cloud.height);
 for(let y=0;y<cloud.height;y++)for(let x=0;x<cloud.width;x++){
  const light=galacticLight(x/cloud.width,y/cloud.height),i=(y*cloud.width+x)*4;
  const violet=skyNoise(x/41+80,y/41)>.66;
  pixels.data[i]=violet?95:65;pixels.data[i+1]=violet?92:115;pixels.data[i+2]=161;
  pixels.data[i+3]=Math.round(Math.min(.25,light*.8)*255);
 }
 c.putImageData(pixels,0,0);ctx.drawImage(cloud,0,0,SKY_WIDTH,SKY_HEIGHT);
 for(const star of skyStars()){
  const colour=star.tone<.08?'#b8cce9':star.tone>.94?'#e0c6a8':'#e1e4ec';
  ctx.globalAlpha=star.alpha;ctx.fillStyle=colour;ctx.beginPath();ctx.arc(star.x,star.y,star.radius,0,Math.PI*2);ctx.fill();
  if(star.spike){
   const glow=ctx.createRadialGradient(star.x,star.y,0,star.x,star.y,8);
   glow.addColorStop(0,colour);glow.addColorStop(1,'transparent');
   ctx.globalAlpha=.13;ctx.fillStyle=glow;ctx.fillRect(star.x-8,star.y-8,16,16);
   ctx.globalAlpha=star.alpha*.65;ctx.fillStyle=colour;const r=star.radius*4.2;
   ctx.beginPath();ctx.moveTo(star.x,star.y-r);ctx.lineTo(star.x+.65,star.y-.65);ctx.lineTo(star.x+r,star.y);ctx.lineTo(star.x+.65,star.y+.65);ctx.lineTo(star.x,star.y+r);ctx.lineTo(star.x-.65,star.y+.65);ctx.lineTo(star.x-r,star.y);ctx.lineTo(star.x-.65,star.y-.65);ctx.closePath();ctx.fill();
  }
 }
 ctx.globalAlpha=1;
}
