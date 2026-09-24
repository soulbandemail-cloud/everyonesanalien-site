import type { Ink, Point2 } from '@/lib/ship/wordmarkGeometry';

const cache=new Map<string,Point2[]>();
function hull(points:Point2[]) {
 const sorted=points.sort((a,b)=>a.x-b.x || a.y-b.y);
 const cross=(a:Point2,b:Point2,c:Point2)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const half=(list:Point2[])=>{const out:Point2[]=[];for(const p of list){while(out.length>1 && cross(out[out.length-2],out[out.length-1],p)<=0)out.pop();out.push(p);}return out;};
 return [...half(sorted).slice(0,-1),...half([...sorted].reverse()).slice(0,-1)];
}
/** Measure ink only. Canvas is never displayed; the original live text remains the renderer. */
export function measureWordmarkInk(element:HTMLElement):Ink {
 const style=getComputedStyle(element),rect=element.getBoundingClientRect();
 const baseline=element.querySelector<HTMLElement>('[data-ink-baseline]')!.getBoundingClientRect().top-rect.top;
 const text=element.dataset.soulLetter!;
 const font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
 const key=font+text;
 let points=cache.get(key);
 if(!points) {
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true})!;
  ctx.font=font;
  const metric=ctx.measureText(text),resolution=4,pad=2;
  const x=metric.actualBoundingBoxLeft+pad,y=metric.actualBoundingBoxAscent+pad;
  canvas.width=Math.ceil((metric.actualBoundingBoxLeft+metric.actualBoundingBoxRight+pad*2)*resolution);
  canvas.height=Math.ceil((metric.actualBoundingBoxAscent+metric.actualBoundingBoxDescent+pad*2)*resolution);
  ctx.scale(resolution,resolution);ctx.font=font;ctx.fillStyle='white';ctx.fillText(text,x,y);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,outline:Point2[]=[];
  for(let row=0;row<canvas.height;row++) {
   let left=-1,right=-1;
   for(let col=0;col<canvas.width;col++)if(pixels[(row*canvas.width+col)*4+3]>16){if(left<0)left=col;right=col;}
   if(left>=0)for(const px of [left,right+1])for(const py of [row,row+1])outline.push({x:px/resolution-x,y:py/resolution-y});
  }
  points=hull(outline);cache.set(key,points);
 }
 return {width:rect.width,height:rect.height,points:points.map(p=>({x:p.x,y:p.y+baseline}))};
}
export function clearWordmarkInkCache() {cache.clear();}
