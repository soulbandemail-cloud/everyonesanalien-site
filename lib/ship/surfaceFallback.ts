import {project,type DomeConfig,type Viewport} from './domeGeometry';
import type {WorldMesh} from './worldSurface';
// Unsupported/lost WebGL must not leave the interior permanently hidden.
// Reuse output buffers and decoded source pixels; never encode a camera frame.
const outputs=new WeakMap<HTMLCanvasElement,{pixels:ImageData;depth:Float32Array}>();
const sources=new WeakMap<HTMLImageElement,ImageData>();
export function fallbackSurface(canvas:HTMLCanvasElement,mesh:WorldMesh,c:DomeConfig,v:Viewport,b:{x:number;y:number;width:number;height:number},image?:HTMLImageElement,material?:{color:readonly number[];bias:readonly number[]}){
 const w=Math.ceil(b.width),h=Math.ceil(b.height),ctx=canvas.getContext('2d')!;
 if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;canvas.style.width='100%';canvas.style.height='100%';
 let output=outputs.get(canvas);
 if(!output||output.pixels.width!==w||output.pixels.height!==h){output={pixels:ctx.createImageData(w,h),depth:new Float32Array(w*h)};outputs.set(canvas,output);}
 output.pixels.data.fill(0);output.depth.fill(Infinity);
 let source=image?sources.get(image):undefined;
 if(image&&!source){const temporary=document.createElement('canvas');temporary.width=image.naturalWidth;temporary.height=image.naturalHeight;const context=temporary.getContext('2d')!;context.drawImage(image,0,0);source=context.getImageData(0,0,temporary.width,temporary.height);sources.set(image,source);}
 const color=material?.color??[76/255,86/255,55/255],bias=material?.bias??[0,0,0],data=mesh.vertices;
 for(let i=0;i<data.length;i+=18){
  const points=[0,6,12].map(k=>{const p=project({x:data[i+k],y:data[i+k+1],z:data[i+k+2]},c,v);return {...p,x:p.x-b.x,y:p.y-b.y,shade:data[i+k+3],u:data[i+k+4],v:data[i+k+5]};});
  if(points.some(p=>!p.visible))continue;
  const [a,d,e]=points,det=(d.y-e.y)*(a.x-e.x)+(e.x-d.x)*(a.y-e.y);if(Math.abs(det)<1e-8)continue;
  const left=Math.max(0,Math.floor(Math.min(a.x,d.x,e.x))),right=Math.min(w-1,Math.ceil(Math.max(a.x,d.x,e.x))),top=Math.max(0,Math.floor(Math.min(a.y,d.y,e.y))),bottom=Math.min(h-1,Math.ceil(Math.max(a.y,d.y,e.y)));
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
   const u=((d.y-e.y)*(x+.5-e.x)+(e.x-d.x)*(y+.5-e.y))/det,t=((e.y-a.y)*(x+.5-e.x)+(a.x-e.x)*(y+.5-e.y))/det,r=1-u-t;
   if(u<0||t<0||r<0)continue;
   const inverse=u/a.depth+t/d.depth+r/e.depth,z=1/inverse,index=y*w+x;
   if(z>=output.depth[index])continue;output.depth[index]=z;
   const weights=[u/a.depth*z,t/d.depth*z,r/e.depth*z];
   if(source){const sx=Math.max(0,Math.min(source.width-1,Math.floor(points.reduce((s,p,j)=>s+p.u*weights[j],0)*source.width))),sy=Math.max(0,Math.min(source.height-1,Math.floor(points.reduce((s,p,j)=>s+p.v*weights[j],0)*source.height))),at=(sy*source.width+sx)*4;for(let k=0;k<4;k++)output.pixels.data[index*4+k]=source.data[at+k];}
   else {const shade=points.reduce((s,p,j)=>s+p.shade*weights[j],0);for(let k=0;k<3;k++)output.pixels.data[index*4+k]=255*(color[k]*shade+bias[k]);output.pixels.data[index*4+3]=255;}
  }
 }
 ctx.putImageData(output.pixels,0,0);
}
