import type {EmotePose} from './charlieEmotes';
/** Tiny canvas-only emote accents, drawn by Charlie's existing render loop. */
export function paintEmoteEffects(ctx:CanvasRenderingContext2D,p:EmotePose,yaw:number){
 if(p.raise<=0)return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const angle=(yaw+p.turn)*Math.PI/180,headX=90-145*Math.sin(p.lean)*Math.cos(angle);
 if(p.bulb>.01){
  ctx.save();ctx.translate(headX,-98);const scale=p.bulb*(1+.12*Math.sin(Math.min(1,p.clock/.35)*Math.PI));ctx.scale(scale,scale);
  ctx.shadowColor='#ffdc83';ctx.shadowBlur=9;ctx.fillStyle='#fff1b0';ctx.strokeStyle='#f3d288';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(-5,7);ctx.bezierCurveTo(-19,-10,-8,-20,0,-18);ctx.bezierCurveTo(14,-19,18,-6,5,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='#bcb6a2';ctx.fillRect(-5,7,10,7);ctx.strokeStyle='#e9dcb5';ctx.beginPath();ctx.moveTo(-4,17);ctx.lineTo(4,17);ctx.stroke();
  for(let i=0;i<5;i++){const a=(i/4)*Math.PI+Math.PI;ctx.beginPath();ctx.moveTo(Math.cos(a)*20,Math.sin(a)*20-2);ctx.lineTo(Math.cos(a)*25,Math.sin(a)*25-2);ctx.stroke();}ctx.restore();
 }
 if(p.question>.01){ctx.save();ctx.globalAlpha=p.question;ctx.fillStyle='#f9e4ff';ctx.shadowColor='#ead0ff';ctx.shadowBlur=3;ctx.font='bold 42px Georgia';ctx.textAlign='center';ctx.fillText('?',headX,-82);ctx.restore();}
 if(p.zzz>.01){ctx.save();ctx.globalAlpha=p.zzz;ctx.fillStyle='#e8dfff';ctx.font='16px monospace';for(let i=0;i<3;i++)ctx.fillText(i?'z':'Z',headX+12+i*12,-65-i*15-(p.clock%1)*5);ctx.restore();}
 if(p.kiss>.01){
  const start=.9;
  for(let i=0;i<4;i++){
   const t=p.clock-start-i*.12,life=1.05+i*.12;if(t<0||t>life+.12)continue;
   const x=headX+Math.cos(angle)*(45+(i-1.5)*12+t*(12+i*3)),y=35-t*(45+i*5)+Math.sin(t*5+i)*3;
   ctx.save();ctx.translate(x,y);
   if(t>=life){ctx.strokeStyle='#ffe9fb';ctx.lineWidth=1;for(let j=0;j<6;j++){const a=j*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*12,Math.sin(a)*12);ctx.stroke();}}
   else{const r=5+i%2*2;ctx.scale(r/10,r/10);ctx.beginPath();ctx.moveTo(0,10);ctx.bezierCurveTo(-25,-3,-11,-18,0,-8);ctx.bezierCurveTo(11,-18,25,-3,0,10);ctx.fillStyle='#ffb0ff36';ctx.fill();ctx.strokeStyle='#ffe0f5bb';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.moveTo(-10,-5);ctx.quadraticCurveTo(-11,-10,-6,-10);ctx.strokeStyle='#ffffffd9';ctx.stroke();}
   ctx.restore();
  }
 }
 ctx.restore();
}
