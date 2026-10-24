import {useEffect,useRef} from 'react';

/** One modest-rate clock updates existing SVG elements, never React state. */
export function useConsoleActivity(){
 const root=useRef<SVGGElement>(null);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const needles=[...node.querySelectorAll<SVGElement>('[data-needle]')].map((el,i)=>({el,pivot:el.dataset.needle!,from:0,to:0,start:0,next:i*.7,duration:1}));
  const lights=[...node.querySelectorAll<SVGElement>('[data-indicator]')].map((el,i)=>({el,next:1+i*.43,on:true}));
  const waves=[...node.querySelectorAll<SVGPathElement>('[data-scope]')];
  const originals=[...node.querySelectorAll<SVGElement>('[data-original]')];
  const signals=[...node.querySelectorAll<SVGGElement>('[data-signal]')].map((el,i)=>{
   const path=el.querySelector<SVGPathElement>('path')!,dot=el.querySelector<SVGCircleElement>('[data-pulse]')!;
   return {el,path,dot,nodes:[...el.querySelectorAll<SVGCircleElement>('[data-node]')],length:path.getTotalLength(),offset:i*3.71};
  });
  let frame=0,last=0,clock=0,previous=0,eventAt=45+Math.random()*45,eventStart=-100,eventGroup=0;
  const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
  function draw(now:number){
   frame=requestAnimationFrame(draw);
   const dt=previous?(now-previous)/1000:0;previous=now;
   if(document.hidden||reduced.matches)return;
   clock+=Math.min(dt,.1);if(now-last<50)return;last=now;
   if(clock>eventAt){eventStart=clock;eventGroup=Math.floor(Math.random()*4);eventAt=clock+45+Math.random()*45;}
   const event=clock-eventStart,system=event<4.5;
   needles.forEach((n,i)=>{
    const blend=smooth((clock-n.start)/n.duration),value=n.from+(n.to-n.from)*blend;
    if(clock>=n.next){n.from=value;n.to=(Math.random()-.5)*(i%3===0?52:i%3===1?24:9);n.start=clock;n.duration=.7+Math.random()*1.8;n.next=clock+n.duration+1+Math.random()*5;}
    const response=system&&i%4===eventGroup?Math.sin(Math.min(1,event/4.5)*Math.PI)*15:0;
    n.el.setAttribute('transform',`rotate(${value+response} ${n.pivot})`);
   });
   lights.forEach((light,i)=>{
    const {el}=light;if(clock>light.next){light.on=!light.on;light.next=clock+(light.on?2+Math.random()*9:.35+Math.random()*1.2);}
    const t=clock+i*3.13;
    let brightness=i%4===0?1:i%4===1?.65+.35*Math.sin(t*.57)*Math.sin(t*.23):light.on?1:.3;
    if(system&&i%4===eventGroup)brightness=Math.abs(event-(i%6)*.45)<.4?1:.4;
    el.style.opacity=String(brightness);
   });
   waves.forEach(el=>{let d='';const amp=5+2*Math.sin(clock*.37)+2*Math.sin(clock*.13)**8;
    for(let i=0;i<=64;i++){const x=12+i*41/64,y=20+amp*(Math.sin(i*.23-clock*1.5)+.25*Math.sin(i*.51-clock*2.1));d+=`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`;}el.setAttribute('d',d);
   });
   originals.forEach(el=>{el.style.opacity=String(.72+.28*Math.sin(clock*.43)**2);el.setAttribute('transform',`translate(0 ${Math.sin(clock*.61)*.7})`);});
   signals.forEach((s,i)=>{
    const period=9+i%3*2.3,phase=(clock+s.offset)%period,active=phase<3||(system&&i%2===eventGroup%2);
    const progress=(system&&phase>=3?event/4.5:phase/3)%1;
    s.dot.style.opacity=active?'1':'0';s.path.style.strokeOpacity=active?'.95':'.42';
    if(active){const p=s.path.getPointAtLength(progress*s.length);s.dot.setAttribute('cx',String(p.x));s.dot.setAttribute('cy',String(p.y));}
    s.nodes.forEach((el,j)=>{el.style.opacity=active&&Math.abs(progress-j/Math.max(1,s.nodes.length-1))<.15?'1':'.45';});
   });
  }
  frame=requestAnimationFrame(draw);
  return()=>cancelAnimationFrame(frame);
 },[]);
 return root;
}
