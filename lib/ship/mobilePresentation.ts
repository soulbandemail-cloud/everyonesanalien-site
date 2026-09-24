import { lens, project, type DomeConfig, type Viewport } from './domeGeometry';
import { orientedFixtures } from './fixtureLayout';

export function isMobileViewport(view: Viewport, coarse: boolean, touchPoints: number) {
  return coarse && touchPoints>0 && Math.min(view.width,view.height)<=600;
}
export function viewportLandscape(view: Viewport, orientationType?: string) {
  // Device orientation survives keyboard-induced visual viewport resizing.
  if (orientationType?.startsWith('landscape')) return true;
  if (orientationType?.startsWith('portrait')) return false;
  return view.width>view.height;
}
/** Turn the same live scene sideways; no orientation permission or blocking screen. */
export function cockpitPresentation(view:Viewport,mobile:boolean,landscape:boolean,progress:number) {
  const t=mobile && !landscape ? Math.max(0,Math.min(1,progress)) : 0;
  return {view:t===0 ? view : {width:view.width+(view.height-view.width)*t,height:view.height+(view.width-view.height)*t},angle:90*t};
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
  // Short Safari viewports also need a slight downward look to retain the sofa's feet.
  let low=config.pitch-30,high=config.pitch;
  for(let i=0;i<32;i++){
    const mid=(low+high)/2,camera=fit(mid);
    const bottom=Math.max(...points.map(p=>project(p,camera,view).y));
    if(bottom>view.height-8) high=mid; else low=mid;
  }
  return fit(low);
}
export function mobileSideContent(name: string) {
  return {theta:name==='live' ? -.98 : .98,scale:.6};
}
