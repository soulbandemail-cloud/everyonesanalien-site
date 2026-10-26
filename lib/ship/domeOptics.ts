import {lens,radians,type DomeConfig,type Viewport} from './domeGeometry';

/** Unpolarised dielectric Fresnel reflectance, air to glass (IOR 1.5). */
export function glassReflectance(cosine:number){
 const c=Math.max(0,Math.min(1,cosine)),ct=Math.sqrt(1-(1-c*c)/2.25);
 const s=(c-1.5*ct)/(c+1.5*ct),p=(1.5*c-ct)/(1.5*c+ct);
 return (s*s+p*p)/2;
}
/** Trace the actual camera ray to the existing sphere; no radial-screen proxy. */
export function domeIncidence(config:DomeConfig,view:Viewport){
 const {focal,horizon}=lens(config,view),pitch=radians(config.pitch);
 const cp=Math.cos(pitch),sp=Math.sin(pitch);
 const ox=config.camera.x-config.centre.x,oy=config.camera.y-config.centre.y,oz=config.camera.z-config.centre.z;
 const radius=config.radius,offset=ox*ox+oy*oy+oz*oz-radius*radius;
 return (x:number,y:number)=>{
  const rx=(x-view.width/2)/focal,up=(horizon-y)/focal;
  const len=Math.hypot(rx,up,1),dx=rx/len,dy=(up*cp+sp)/len,dz=(cp-up*sp)/len;
  const dot=ox*dx+oy*dy+oz*dz,disc=dot*dot-offset;
  if(disc<0)return null;
  const t=-dot+Math.sqrt(disc);
  if(t<=0)return null;
  return Math.min(1,Math.abs(((ox+t*dx)*dx+(oy+t*dy)*dy+(oz+t*dz)*dz)/radius));
 };
}
