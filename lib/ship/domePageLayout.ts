import { domePoint, type DomeConfig, type Viewport } from './domeGeometry';

/** Angular layout zones reserve untouched glass below all website content. */
export function domePageLayout(config: DomeConfig) {
  const span = config.topLatitude - config.lowerLatitude;
  return {
    socials: config.topLatitude + .24,
    brand: config.topLatitude,
    caption: config.topLatitude + .12,
    captionWidth: .52,
    information: config.lowerLatitude + span * .66,
    merch: config.lowerLatitude + span * .46,
    posterBottom: config.lowerLatitude + .045,
    posterTop: config.lowerLatitude + span * .32,
    wordmarkHalfWidth: .54,
    wordmarkGap: .65,
  };
}
/** Same latitude circle, with an angular gap centred on the forward axis. */
export function upperRulePath(config: DomeConfig, view: Viewport) {
  const gap = domePageLayout(config).wordmarkGap;
  let d = '', drawing = false;
  for (let i = 0; i <= 720; i++) {
    const theta = -Math.PI + i / 720 * Math.PI * 2;
    const p = domePoint(theta, config.topLatitude, config, view);
    if (Math.abs(theta) < gap || !p.visible) { drawing = false; continue; }
    d += `${drawing ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    drawing = true;
  }
  return d;
}

/** Three spherical samples define a local live-DOM surface patch, not a guessed CSS tilt. */
export function domeSurfaceFrame(theta: number, phi: number, angularWidth: number, width: number, height: number, config: DomeConfig, view: Viewport) {
  const angularHeight=angularWidth*height/width*Math.cos(phi);
  const a=domePoint(theta-angularWidth/2,phi+angularHeight/2,config,view);
  const b=domePoint(theta+angularWidth/2,phi+angularHeight/2,config,view);
  const c=domePoint(theta-angularWidth/2,phi-angularHeight/2,config,view);
  return [(b.x-a.x)/width,(b.y-a.y)/width,(c.x-a.x)/height,(c.y-a.y)/height,a.x,a.y];
}

/** The same upper latitude, clipped at the live wordmark's measured ink boundaries. */
export function wordmarkRulePath(config:DomeConfig,view:Viewport,edges:{left:number;right:number},flatY:number,progress:number,frontArcOnly=false) {
 const t=Math.max(0,Math.min(1,progress));
 if(t===0)return `M0 ${flatY}H${edges.left} M${edges.right} ${flatY}H${view.width}`;
 let path='',last:{x:number;y:number}|null=null;
 for(let i=0;i<=720;i++) {
  const p=domePoint(-Math.PI+i/720*Math.PI*2,config.topLatitude,config,view);
  const next=p.visible ? {x:p.x,y:flatY+(p.y-flatY)*t} : null;
  if(last && next) for(const [min,max] of [[0,edges.left],[edges.right,view.width]]) {
   const dx=next.x-last.x;
   // The forward arc runs left-to-right. The returning back arc lies above
   // the viewport at rest, but would sweep visibly upward when flattened.
   if((frontArcOnly ? dx<=1e-9 : Math.abs(dx)<1e-9) || max<=min)continue;
   const a=(min-last.x)/dx,b=(max-last.x)/dx;
   const lo=Math.max(0,Math.min(a,b)),hi=Math.min(1,Math.max(a,b));
   if(lo<=hi)path+=`M${last.x+dx*lo} ${last.y+(next.y-last.y)*lo}L${last.x+dx*hi} ${last.y+(next.y-last.y)*hi} `;
  }
  last=next;
 }
 return path;
}
