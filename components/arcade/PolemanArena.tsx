'use client';
import './arcade.css';
import {useEffect,useEffectEvent,useRef} from 'react';
import {arcadePoint,arcadeSize} from './presentation';
import {blades,createBattle,enterOpening,head,shoulder,smooth,stepBattle,type V} from './polemanBattle';

export default function PolemanArena({onDefeat,onVictory,onWhiteout}:{onDefeat:()=>void;onVictory:()=>void;onWhiteout?:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),healthFill=useRef<HTMLDivElement>(null),healthTrace=useRef<HTMLDivElement>(null);
 const whiteout=useEffectEvent(()=>onWhiteout?.());
 const finish=useEffectEvent((won:boolean)=>{if(won)onVictory();else onDefeat();});
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
  let dimensions=arcadeSize(el);let h=1000*dimensions.height/dimensions.width;const s=createBattle(h,Math.floor(Math.random()*4294967296));let held=false,frame=0,last=performance.now(),accumulator=0,finished=false,whiteoutSent=false;
  s.mobile=!!el.closest('[data-arcade-frame]')||window.matchMedia('(pointer: coarse)').matches;s.flyOverEntry=s.mobile;
  const resize=()=>{dimensions=arcadeSize(el);const nextH=1000*dimensions.height/dimensions.width,ratio=nextH/s.h;s.ufo.y*=ratio;s.target.y*=ratio;s.h=nextH;h=nextH;const dpr=Math.min(window.devicePixelRatio||1,2);el.width=dimensions.width*dpr;el.height=dimensions.height*dpr;};resize();const observer=new ResizeObserver(resize);observer.observe(el);
  const move=(e:PointerEvent)=>{const p=arcadePoint(el,{x:e.clientX,y:e.clientY});s.target={x:Math.max(25,Math.min(975,p.x/dimensions.width*1000)),y:Math.max(95,Math.min(h-25,p.y/dimensions.height*h))};};
  const down=(e:PointerEvent)=>{if(e.button!==0)return;if(e.pointerType==='touch'){e.preventDefault();window.getSelection()?.removeAllRanges();}move(e);s.flyOverEntry=e.pointerType==='touch'||!!el.closest('[data-arcade-frame]');
   if(!s.flyOverEntry&&enterOpening(s,s.target)){held=false;return;}held=true;el.setPointerCapture(e.pointerId);};const up=()=>{held=false;};
  el.addEventListener('pointermove',move);el.addEventListener('pointerdown',down);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);window.addEventListener('blur',up);
  const preventTouchDefault=(e:Event)=>{if(s.mobile)e.preventDefault();};
  el.addEventListener('touchstart',preventTouchDefault,{passive:false});el.addEventListener('contextmenu',preventTouchDefault);el.addEventListener('selectstart',preventTouchDefault);
  const noise=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const line=(a:V,b:V,width:number,color:string)=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();};
  const rod=(a:V,b:V,width:number)=>{line({x:a.x+4,y:a.y+4},{x:b.x+4,y:b.y+4},width,'#686b67');line(a,b,width,'#d5d6cb');line({x:a.x-2,y:a.y-2},{x:b.x-2,y:b.y-2},2,'#fffef0');};
  const skullOutline=new Path2D('M50 10 C27 10 15 30 18 52 C21 75 38 90 50 90 C62 90 79 75 82 52 C85 30 73 10 50 10 Z');
  const zap=(a:V,b:V,seed:number,width=1.4,shock=false)=>{
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,n=Math.max(5,Math.ceil(d/14)),nx=-dy/d,ny=dx/d,tick=Math.floor(s.clock*24);
   const points=Array.from({length:n+1},(_,i)=>{const t=i/n,j=i===0||i===n?0:Math.sin(i*12.9898+seed*37.1+tick*4.3)*Math.min(12,d*.13);return {x:a.x+dx*t+nx*j,y:a.y+dy*t+ny*j};});
   ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
   ctx.strokeStyle='#81cfff44';ctx.lineWidth=width*6;ctx.stroke();ctx.strokeStyle='#a9eaff';ctx.lineWidth=width*2.1;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=width;
   if(!shock)ctx.stroke();
   else for(let i=1;i<n;i++){
    const clock=s.clock*(7+i%4)+seed*.13,key=seed*61+a.x*.17+b.x*.31+i*29+Math.floor(clock)*19;
    if(noise(key)>.12||clock%1>.3)continue;
    const p=points[i],length=5+noise(key+1)*25,side=noise(key+2)>.5?1:-1;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+nx*side*length*.5+dx/d*4,p.y+ny*side*length*.5+dy/d*4);ctx.lineTo(p.x+nx*side*length-dx/d*3,p.y+ny*side*length-dy/d*3);ctx.lineWidth=.7+noise(key+3)*1.8;ctx.stroke();
   }
   if(!shock)for(let i=1;i<n;i++){if(noise(seed*17+i*11+tick*3)>.18)continue;const p=points[i],sign=noise(i+tick)>.5?1:-1;const length=7+noise(seed+i*7+tick)*26;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+nx*sign*length*.6+dx/n*.3,p.y+ny*sign*length*.6+dy/n*.3);ctx.lineTo(p.x+nx*sign*length-dx/n*.2,p.y+ny*sign*length-dy/n*.2);ctx.lineWidth=width*(.35+noise(i*5+tick)*.65);ctx.stroke();}
   ctx.restore();
  };
  // Short independently timed discharges: no orbiting, mirrored spark pattern.
  const sparks=(centre:V,radius:number,seed:number)=>{
   for(let i=0;i<5;i++){
    const clock=s.clock*(6.5+i*.73)+i*.31,slot=Math.floor(clock),key=seed+i*93+slot*17;
    if(noise(key)>.28||clock-slot> .25+noise(key+1)*.35)continue;
    const a=noise(key+2)*Math.PI*2,length=9+noise(key+3)*39,bend=(noise(key+4)-.5)*1.3;
    zap({x:centre.x+Math.cos(a)*radius,y:centre.y+Math.sin(a)*radius},
     {x:centre.x+Math.cos(a+bend)*(radius+length),y:centre.y+Math.sin(a+bend)*(radius+length)},key,.5+noise(key+5)*1.2);
   }
  };
  // Separate from the UFO discharge: sharp blue filaments and fleeting white forks.
  const lightning=(a:V,b:V,seed:number)=>{
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,n=Math.max(6,Math.ceil(d/11));
   const nx=-dy/d,ny=dx/d,tick=Math.floor(s.clock*30),key=seed*37+tick*71;
   const points=Array.from({length:n+1},(_,i)=>{
    const t=i/n,j=i===0||i===n?0:(noise(key+i*13)*2-1)*(6+noise(key+i*29)*13);
    return {x:a.x+dx*t+nx*j,y:a.y+dy*t+ny*j};
   });
   ctx.save();ctx.lineJoin='miter';ctx.miterLimit=3;ctx.lineCap='butt';ctx.shadowBlur=0;
   ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
   ctx.strokeStyle='#008cff55';ctx.lineWidth=5;ctx.stroke();
   ctx.shadowColor='#008dff';ctx.shadowBlur=7;ctx.strokeStyle='#159eff';ctx.lineWidth=1.6;ctx.stroke();
   ctx.shadowBlur=0;ctx.strokeStyle='#a9f5ff';ctx.lineWidth=.55;ctx.stroke();
   for(let i=1;i<=n;i++){
    const time=s.clock*(9+i%5)+seed*.17,slot=Math.floor(time),k=seed*83+a.x*.19+i*47+slot*101;
    if(noise(k)>.16||time-slot>.18+noise(k+1)*.25)continue;
    const origin=points[i],angle=noise(k+2)*Math.PI*2,length=15+noise(k+3)*55,count=4+Math.floor(noise(k+4)*5);
    const ux=Math.cos(angle),uy=Math.sin(angle);let last=origin;
    ctx.beginPath();ctx.moveTo(origin.x,origin.y);
    for(let j=1;j<=count;j++){
     const t=j/count,zig=(noise(k+j*23)-.5)*length*.65;
     const q={x:origin.x+ux*length*t-uy*zig,y:origin.y+uy*length*t+ux*zig};
     ctx.lineTo(q.x,q.y);
     if(j>1&&j<count&&noise(k+j*31)>.6){
      const fork=8+noise(k+j*41)*20;
      ctx.lineTo(q.x+ux*fork+uy*fork*.7,q.y+uy*fork-ux*fork*.7);
      ctx.lineTo(q.x+ux*fork*.5-uy*fork,q.y+uy*fork*.5+ux*fork);ctx.moveTo(q.x,q.y);
     }
     last=q;
    }
    ctx.strokeStyle='#fff';ctx.lineWidth=.65+noise(k+5)*1.1;ctx.shadowColor='#e4f8ff';ctx.shadowBlur=3;ctx.stroke();
    if(noise(k+6)>.75){ctx.fillStyle='#fff';ctx.fillRect(last.x-1,last.y-1,2,2);}
   }
   ctx.restore();
  };
  const draw=()=>{
   ctx.setTransform(el.width/1000,0,0,el.height/h,0,0);ctx.fillStyle='#020305';ctx.fillRect(0,0,1000,h);
   const glow=ctx.createRadialGradient(500,h*.47,10,500,h*.47,650);glow.addColorStop(0,'#152028');glow.addColorStop(1,'#020305');ctx.fillStyle=glow;ctx.fillRect(0,0,1000,h);
   const o=shoulder(s),tip=head(s),arms=blades(s);
   ctx.save();ctx.globalAlpha=s.phase==='intro'?smooth((s.time-.8)/2):1;
   if(s.phase!=='victory'){
    rod({x:500,y:h+80},o,16);arms.forEach(b=>{rod(o,b.joint,11);rod(b.joint,b.a,11);});
    ctx.beginPath();ctx.moveTo(o.x-8*tip.baseScale,o.y);ctx.lineTo(tip.x-11*tip.scale,tip.y-8*tip.scale);ctx.lineTo(tip.x+11*tip.scale,tip.y-8*tip.scale);ctx.lineTo(o.x+8*tip.baseScale,o.y);ctx.closePath();ctx.fillStyle='#d5d6cb';ctx.fill();line({x:o.x+8*tip.baseScale,y:o.y},{x:tip.x+11*tip.scale,y:tip.y},4,'#757d79');ctx.fillStyle='#d5d6cb';ctx.beginPath();ctx.ellipse(tip.x,tip.y,tip.r+4,tip.r*.7+4,Math.sign(s.headX)*-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle=s.phase==='stun'?'#6ee7b7':'#020406';ctx.beginPath();ctx.ellipse(tip.x,tip.y,tip.r,tip.r*.7,Math.sign(s.headX)*-.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle=s.phase==='stun'?'#d9faff':'#a9b9ba';ctx.lineWidth=3;ctx.stroke();
   }
   ctx.restore();
   if(s.phase!=='victory'){ctx.save();ctx.globalAlpha=s.phase==='intro'?smooth((s.time-.8)/2):1;arms.filter(b=>!b.active).forEach(b=>rod(b.a,b.b,12));ctx.restore();}
   if(s.beam){ctx.save();ctx.translate(s.ufo.x,s.ufo.y);ctx.rotate(s.lean);const beam=ctx.createLinearGradient(0,0,0,-180);beam.addColorStop(0,'#f0ffffa0');beam.addColorStop(1,'#91efff08');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(-7.5,-6);ctx.lineTo(-45,-180);ctx.lineTo(45,-180);ctx.lineTo(7.5,-6);ctx.closePath();ctx.fill();ctx.restore();}
   if(s.contact){lightning(s.ufo,tip,1);}
   if((s.phase!=='entry'||s.time<.28)&&(s.phase!=='damage'||s.time>.9)&&s.phase!=='victory'){
    ctx.save();ctx.translate(s.ufo.x,s.ufo.y);ctx.rotate(s.beam?s.lean:0);ctx.scale(.5,.5);ctx.shadowColor=s.invincible?'#ff7777':'#c5faff';ctx.shadowBlur=18;ctx.fillStyle=s.invincible?'#ff9090':'#fff';ctx.beginPath();ctx.ellipse(0,0,25,7,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(0,-5,13,10,0,Math.PI,Math.PI*2);ctx.lineWidth=3;ctx.strokeStyle=ctx.fillStyle;ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#111';[-13,0,13].forEach(x=>{ctx.beginPath();ctx.arc(x,1,2,0,7);ctx.fill();});sparks({x:0,y:-3},24,83);ctx.restore();
   }
   if(s.phase!=='victory'){ctx.save();ctx.globalAlpha=s.phase==='intro'?smooth((s.time-.8)/2):1;arms.filter(b=>b.active).forEach(b=>rod(b.a,b.b,12));ctx.restore();}
   for(const p of s.skulls){
    ctx.save();ctx.translate(p.x-12.5,p.y-12.5);ctx.scale(.25,.25);
    const face=p.black?'#fff':'#050505';ctx.fillStyle=p.black?'#050505':'#fff';ctx.fill(skullOutline);
    if(p.black){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke(skullOutline);}
    ctx.fillStyle=face;ctx.beginPath();ctx.ellipse(36,45,9,13,-14*Math.PI/180,0,Math.PI*2);ctx.ellipse(64,45,9,13,14*Math.PI/180,0,Math.PI*2);ctx.fill();
    ctx.lineCap='round';line({x:41,y:68},{x:59,y:68},4,face);for(const [x,y,z] of [[45,63,76],[50,62,78],[55,63,76]])line({x,y},{x,y:z},3,face);ctx.restore();
   }
   if(s.phase==='stun'){ctx.fillStyle='#d9e7e6';ctx.font='18px serif';for(let i=0;i<5;i++)ctx.fillText('✧',tip.x+Math.cos(s.clock+i*1.26)*45,tip.y-35+Math.sin(s.clock+i*1.26)*9);}
   if(s.phase==='damage'){for(const [i,b] of arms.entries()){lightning(o,b.joint,12+i);lightning(b.joint,b.a,18+i);lightning(b.a,b.b,21+i);}lightning(o,tip,24);lightning(o,{x:500,y:h+80},30);}
   // Health and delayed loss traces are continuous, independently eased bars.
   if(healthFill.current)healthFill.current.style.transform=`scaleX(${s.health})`;if(healthTrace.current)healthTrace.current.style.transform=`scaleX(${s.trace})`;
   const barY=s.mobile?46:65;ctx.fillStyle='#302326';ctx.fillRect(200,barY,600,5);ctx.fillStyle='#dba3a3';ctx.fillRect(200,barY,600*s.bossTrace,5);ctx.fillStyle='#b93638';ctx.fillRect(200,barY,600*s.bossHealth,5);
   ctx.fillStyle='#ddd';ctx.textAlign='center';ctx.font=s.mobile?'25px serif':'15px serif';ctx.fillText('POLEMAN',500,barY+(s.mobile?31:26));

   if(s.phase==='intro'){ctx.fillStyle=`rgba(0,0,0,${1-smooth(s.time/1.3)})`;ctx.fillRect(0,0,1000,h);}
   if(s.phase==='defeat'){ctx.fillStyle=`rgba(0,0,0,${smooth(s.time/1.2)})`;ctx.fillRect(0,0,1000,h);ctx.globalAlpha=smooth((s.time-1)/1.5)*(1-smooth((s.time-4.5)/1.5));ctx.fillStyle='#881b25';ctx.font='58px Georgia,serif';ctx.fillText('YOU TRIED',500,h/2);ctx.globalAlpha=1;}
   if(s.phase==='victory'){
    const t=s.time;
    // One shoulder-centred firework: glowing sparks with curved, falling trails.
    ctx.save();ctx.translate(o.x,o.y);ctx.globalCompositeOperation='lighter';
    const burst=ctx.createRadialGradient(0,0,0,0,0,Math.max(1,t*850));
    burst.addColorStop(0,'#fffdeccc');burst.addColorStop(.25,'#ffe4a866');burst.addColorStop(1,'#ffce7000');
    ctx.fillStyle=burst;ctx.fillRect(-1000,-h,2000,h*2);
    for(let i=0;i<144;i++){
     const a=i*2.399963,speed=280+(Math.sin(i*91.7)*.5+.5)*750;
     const point=(age:number)=>({x:Math.cos(a)*speed*(1-Math.exp(-age*1.1))/1.1,y:Math.sin(a)*speed*(1-Math.exp(-age*1.1))/1.1+85*age*age});
     const p=point(t);ctx.beginPath();for(let j=0;j<7;j++){const q=point(Math.max(0,t-.22+j*.22/6));if(j)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);}
     ctx.strokeStyle=i%3?'#ffe5a8':'#ccefff';ctx.globalAlpha=Math.max(0,1-t/2.2);ctx.lineWidth=1.5;ctx.stroke();
     ctx.fillStyle='#fffef2';ctx.beginPath();ctx.arc(p.x,p.y,2.5+(i%3),0,Math.PI*2);ctx.fill();
    }
    ctx.restore();ctx.fillStyle=`rgba(255,255,255,${smooth((t-.55)/1.15)})`;ctx.fillRect(0,0,1000,h);
    ctx.globalAlpha=smooth((t-1)/1.1);ctx.fillStyle='#ad812d';ctx.font='66px Georgia,serif';ctx.fillText('POLEMAN VANQUISHED',500,h/2);
    if(s.hp===5){ctx.fillStyle='#000';ctx.globalAlpha=smooth((t-1.7)/.9);ctx.font='29px Georgia,serif';ctx.fillText('FLAWLESS VICTORY',500,h/2+53);}
    ctx.globalAlpha=1;
   }
  };
  const tick=(now:number)=>{accumulator+=Math.min(.1,(now-last)/1000);last=now;while(accumulator>=1/120){stepBattle(s,1/120,held);accumulator-=1/120;}draw();if(s.phase==='victory'&&s.time>=1.7&&!whiteoutSent){whiteoutSent=true;whiteout();}if(!finished&&((s.phase==='defeat'&&s.time>6.2)||(s.phase==='victory'&&s.time>4))){finished=true;finish(s.phase==='victory');return;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
  return()=>{el.removeEventListener('touchstart',preventTouchDefault);el.removeEventListener('contextmenu',preventTouchDefault);el.removeEventListener('selectstart',preventTouchDefault);observer.disconnect();cancelAnimationFrame(frame);el.removeEventListener('pointermove',move);el.removeEventListener('pointerdown',down);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('lostpointercapture',up);window.removeEventListener('blur',up);};
 },[]);
 return <><div className="arcade-charge" style={{pointerEvents:'none'}}><div className="arcade-charge-meter" aria-label="UFO health" style={{position:'relative'}}><div ref={healthTrace} style={{position:'absolute',inset:2,height:'auto',background:'#c98989'}}/><div ref={healthFill} style={{position:'relative'}}/></div></div><canvas ref={canvas} aria-label="Poleman boss arena" style={{position:'absolute',inset:0,width:'100%',height:'100%',touchAction:'none',cursor:'none'}}/></>;
}
