import {project,spherePoint,type DomeConfig,type Viewport} from './domeGeometry';
type Poster = {theta:number;latitude:number;width:number;aspect:number};
/** UV coordinates follow longitude/latitude on the inside of the actual glass.
 * Used to bound the seamless inverse-projected artwork. */
export function posterSurfacePoint(p:Poster,u:number,v:number,config:DomeConfig,view:Viewport) {
 const radius=config.radius-.08;
 return project(spherePoint(p.theta+(u-.5)*p.width/(radius*Math.cos(p.latitude)),p.latitude+(.5-v)*p.width*p.aspect/radius,{...config,radius}),config,view);
}
