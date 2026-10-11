/** Only ink is sampled from the existing tee photo; the garment itself is a mesh. */
export function loadWearableInk(onReady:()=>void){
 const canvas=document.createElement('canvas');canvas.width=650;canvas.height=500;
 const ctx=canvas.getContext('2d')!;
 const image=new Image();let ready=false;
 image.onload=()=>{
  ctx.drawImage(image,400,275,650,500,0,0,650,500);
  const pixels=ctx.getImageData(0,0,650,500);
  for(let i=0;i<pixels.data.length;i+=4){const shade=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;pixels.data[i+3]=Math.max(0,Math.min(255,(165-shade)*3));pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=20;}
  ctx.putImageData(pixels,0,0);ready=true;onReady();
 };
 image.src='/soul-ringer-tee.png';
 return {canvas,get ready(){return ready;},dispose(){image.onload=null;}};
}
export function paintWearableInk(ctx:CanvasRenderingContext2D,image:HTMLCanvasElement,texture:{points:{x:number;y:number}[];uv:{x:number;y:number}[]}){
 const [a,b,c]=texture.points,[u,v,w]=texture.uv.map(p=>({x:p.x*image.width,y:p.y*image.height}));
 const det=(v.x-u.x)*(w.y-u.y)-(w.x-u.x)*(v.y-u.y);if(!det)return;
 const ax=((b.x-a.x)*(w.y-u.y)-(c.x-a.x)*(v.y-u.y))/det;
 const bx=((c.x-a.x)*(v.x-u.x)-(b.x-a.x)*(w.x-u.x))/det;
 const ay=((b.y-a.y)*(w.y-u.y)-(c.y-a.y)*(v.y-u.y))/det;
 const by=((c.y-a.y)*(v.x-u.x)-(b.y-a.y)*(w.x-u.x))/det;
 ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();
 ctx.transform(ax,ay,bx,by,a.x-ax*u.x-bx*u.y,a.y-ay*u.x-by*u.y);ctx.drawImage(image,0,0);ctx.restore();
}
