import { lens, project, type DomeConfig, type Viewport } from './domeGeometry';
import { orientedFixtures } from './fixtureLayout';
import { ROOM, floorPortDiameter, deckOutline } from './roomGeometry';

export function isMobileViewport(view: Viewport, coarse: boolean, touchPoints: number) {
  return coarse && touchPoints>0 && Math.min(view.width,view.height)<=600;
}
export function viewportLandscape(view: Viewport, orientationType?: string) {
  // Device orientation survives keyboard-induced visual viewport resizing.
  if (orientationType?.startsWith('landscape')) return true;
  if (orientationType?.startsWith('portrait')) return false;
  return view.width>view.height;
}
/** Screen rotation relative to upright portrait, including Safari's legacy angle.
 * A clockwise-held iPhone (volume buttons up) reports 270 / -90 degrees. */
export function portraitScreenAngle(landscape:boolean,type?:string,angle?:number,legacy?:number) {
  if(!landscape) return type==='portrait-secondary' || Math.abs(angle ?? legacy ?? 0)===180 ? 180 : 0;
  const value=Number.isFinite(angle) ? angle! : legacy;
  if(value!==undefined && ((value%360)+360)%360===90) return 90;
  if(value!==undefined && ((value%360)+360)%360===270) return -90;
  return type==='landscape-secondary' ? 90 : -90;
}
/** One physical direction: enter anticlockwise, return clockwise. */
export function cockpitPresentation(view:Viewport,mobile:boolean,landscape:boolean,progress:number,screenAngle=landscape ? -90 : 0) {
  const p=Math.max(0,Math.min(1,progress));
  const t=mobile ? (landscape ? 1-p : p) : 0;
  return {view:t===0 ? view : {width:view.width+(view.height-view.width)*t,height:view.height+(view.width-view.height)*t},angle:mobile ? (-90*p-screenAngle || 0) : 0};
}
/** Phone-only sideways cockpit. Keep the landscape scene intact, including in a
 * landscape physical viewport where it must be fitted rather than cropped. */
export function phoneCockpitPresentation(view:Viewport,mobile:boolean,phone:boolean,landscape:boolean,progress:number,screenAngle:number) {
 const frame=cockpitPresentation(view,mobile,landscape,progress,screenAngle);
 const p=Math.max(0,Math.min(1,progress));
 if(!phone || !landscape)return {...frame,scale:1};
 const targetAngle=screenAngle>0 ? -90 : 90;
 const angle=-screenAngle+(targetAngle+screenAngle)*p;
 const target=cockpitPresentation(view,true,landscape,1,screenAngle).view;
 const fit=Math.min(1,view.width/target.height,view.height/target.width);
 return {...frame,angle,scale:(1-p)+fit*p};
}
/** Physical screen size prevents a narrow tablet window from opting into phone mode. */
export function isPhoneScreen(screen:Viewport,coarse:boolean,touches:number) {
 return coarse && touches>0 && Math.min(screen.width,screen.height)<=600;
}
/** Undo an existing browser pinch without changing the calibrated scene scale. */
export function cockpitViewport(view:Viewport,scale:number,active:boolean) {
  const zoom=active && Number.isFinite(scale) && scale>0 ? scale : 1;
  return {view:zoom===1 ? view : {width:view.width*zoom,height:view.height*zoom},scale:1/zoom};
}
/** Bounds of the existing sofa solids, transformed exactly like Fixtures.local(). */
export function sofaBounds(config: DomeConfig) {
  const f=orientedFixtures(config.centre,config.radius).sofa;
  const points=[];
  for(const x of [-1.43,1.43]) for(const y of [0,1.17]) for(const z of [-.61,.515]) points.push({
    x:f.x+f.scale*(x*Math.cos(f.yaw)+z*Math.sin(f.yaw)),
    y:f.y+y*f.scale,
    z:f.z+f.scale*(z*Math.cos(f.yaw)-x*Math.sin(f.yaw)),
  });
  return points;
}
/** Fit the authoritative sofa to a small left margin; no furniture relocation. */
export function mobileThirdCamera(config: DomeConfig, view: Viewport) {
  const points=sofaBounds(config);
  const floorBounds=[...points,...deckOutline(floorPortDiameter,floorPortDiameter,ROOM.floorY,ROOM.port.z)];
  const margin=Math.max(8,view.width*.015);
  const fit=(pitch:number)=>{
    const posed={...config,pitch};
    const extent=Math.max(...points.map(p=>{
      const q=project(p,posed,view);
      return (view.width/2-q.x)/lens(posed,view).focal;
    }));
    const focal=(view.width/2-margin)/extent;
    const fov=2*Math.atan(Math.min(view.height,view.width*1.15)/(2*focal))*180/Math.PI;
    return {...posed,fov:Math.min(config.fov,fov)};
  };
  // Retain the full hatch as well as the sofa in short Safari visual viewports.
  let low=config.pitch-30,high=config.pitch;
  for(let i=0;i<32;i++){
    const mid=(low+high)/2,camera=fit(mid);
    const bottom=Math.max(...floorBounds.map(p=>project(p,camera,view).y));
    if(bottom>view.height-8) high=mid; else low=mid;
  }
  return fit(low);
}
export function mobileSideContent(name: string) {
  return {theta:name==='live' ? -.98 : .98,scale:.6};
}
