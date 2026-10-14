import {project,type DomeConfig,type Vec3,type Viewport} from '@/lib/ship/domeGeometry';
import type {FixturePlacement} from '@/lib/ship/fixtureLayout';
import {RECORDS} from '@/lib/ship/records';
import {storage,displaySleeve,type GramophoneScene,type P} from '@/lib/ship/recordRitual';
export function gramophoneWorld(f:FixturePlacement,p:P):Vec3{
 const [x,y,z]=p;return {x:f.x+f.scale*(x*(f.widthScale??1)*Math.cos(f.yaw)+z*Math.sin(f.yaw)),y:f.y+y*f.scale,z:f.z+f.scale*(z*Math.cos(f.yaw)-x*(f.widthScale??1)*Math.sin(f.yaw))};
}
export function RecordProps({scene,fixture,config,view,layer}:{scene:GramophoneScene;fixture:FixturePlacement;config:DomeConfig;view:Viewport;layer:'storage'|'disc'|'sleeves'|'carried'}){
 const point=(p:P)=>project(gramophoneWorld(fixture,p),config,view);
 const onPlatter=scene.disc&&scene.disc.centre[2]>-.1&&scene.disc.tilt===Math.PI/2;
 const disc=()=>{
  if(!scene.disc)return null;
  const {centre,album}=scene.disc,tilt=scene.disc.tilt+(scene.disc.flip??0);
  const c=point(centre),x=point([centre[0]+.33,centre[1],centre[2]]),y=point([centre[0],centre[1]-.33*Math.cos(tilt),centre[2]-.33*Math.sin(tilt)]);
  return <g aria-label={`${album} vinyl record`} transform={`matrix(${x.x-c.x} ${x.y-c.y} ${y.x-c.x} ${y.y-c.y} ${c.x} ${c.y})`}>
   <g className="gramophone-vinyl-spin" style={{animationPlayState:scene.playing?'running':'paused'}}><circle r="1" fill="#191c21" stroke="#454348" strokeWidth=".025"/>
   {[.83,.7,.58].map(r=><circle key={r} r={r} fill="none" stroke="#36363a" strokeWidth=".012"/>)}
   <circle r=".28" fill={album==='the-magic-if'?'#6791c1':'#cecac0'}/><circle r=".055" fill="#b3a176"/><path d="M.05-.18L.17-.12" stroke="#36363a" strokeWidth=".035"/></g>
  </g>;
 }
 if(layer==='disc')return onPlatter?disc():null;
 return <>{layer==='carried'&&!onPlatter&&disc()}{[...RECORDS].reverse().map(album=>{
  const sleeve=scene.sleeves[album.id],stored=JSON.stringify(sleeve)===JSON.stringify(storage(album.id));
  const displayed=JSON.stringify(sleeve)===JSON.stringify(displaySleeve);
  if(layer==='storage'?!stored:layer==='sleeves'?!displayed:stored||displayed)return null;
  const a=point(sleeve.a),b=point(sleeve.b),c=point(sleeve.c);
  return <image key={album.id} href={album.artwork} width="100" height="100" preserveAspectRatio="none" aria-label={`${album.name} ${stored?'stored':'handled or displayed'} sleeve`} transform={`matrix(${(b.x-a.x)/100} ${(b.y-a.y)/100} ${(c.x-a.x)/100} ${(c.y-a.y)/100} ${a.x} ${a.y})`}/>;
 })}</>;
}
