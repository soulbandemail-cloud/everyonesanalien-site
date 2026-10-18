/** Velocities retain the game's original pixels-per-16ms units. */
type Point={x:number;y:number};
export type TractorBody=Point&{vx:number;vy:number;tractorScale?:number};
export function beamDimensions(width:number,height:number){return {width:Math.min(47.5,Math.max(30,width*.0375))*1.25,height:Math.min(85,height*.105)*1.5};}
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function beamInfluence(body:Point,ufo:Point,size:{width:number;height:number}){
 const y=body.y-ufo.y-8,progress=Math.max(0,Math.min(1,y/size.height));
 const half=size.width*(.06+.44*progress);
 // Broad, nearly uniform core; only the edge feathers. No captured state.
 return smooth((half+12-Math.abs(body.x-ufo.x))/12)*smooth((y+12)/12)*smooth((size.height+12-y)/12);
}
export function steerInBeam<T extends TractorBody>(body:T,ufo:Point,size:{width:number;height:number},active:boolean,dt:number):T{
 const influence=active?beamInfluence(body,ufo,size):0;
 // Midpoint horizontal integration keeps the stronger pull stable across frame rates.
 const pull=1.12*influence,k=pull/18;
 const ax=Math.max(-pull,Math.min(pull,k*(ufo.x-body.x-body.vx*dt/2)/(1+k*dt*dt/4))),ay=-.44*influence;
 const desired=1-.3*influence;
 let scale=desired+((body.tractorScale??1)-desired)*Math.exp(-dt*.22);
 if(!influence&&scale>.995)scale=1;
 let vx=body.vx+ax*dt,vy=body.vy+ay*dt;
 // Strong steering should not accelerate heads into an unmanageable slingshot.
 const speed=Math.hypot(vx,vy);
 if(influence&&speed>4.5){vx*=4.5/speed;vy*=4.5/speed;}
 return {...body,x:body.x+(body.vx+vx)*dt/2,y:body.y+(body.vy+vy)*dt/2,vx,vy,tractorScale:scale};
}
/** Swept contact, independent of visual shrinking, prevents fast heads tunnelling. */
export function crossesEllipse(a:Point,b:Point,centre:Point,rx:number,ry=rx){
 const x=(a.x-centre.x)/rx,y=(a.y-centre.y)/ry,dx=(b.x-a.x)/rx,dy=(b.y-a.y)/ry;
 const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));
 return (x+t*dx)**2+(y+t*dy)**2<1;
}
