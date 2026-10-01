import {project,spherePoint,type DomeConfig,type Viewport} from './domeGeometry';
type Poster = {theta:number;latitude:number;width:number;aspect:number};
/** UV coordinates follow longitude/latitude on the inside of the actual glass.
 * Triangulation warps the entire artwork, not just its outside border. */
export function posterSurfacePoint(p:Poster,u:number,v:number,config:DomeConfig,view:Viewport) {
 const radius=config.radius-.08;
 return project(spherePoint(p.theta+(u-.5)*p.width/(radius*Math.cos(p.latitude)),p.latitude+(.5-v)*p.width*p.aspect/radius,{...config,radius}),config,view);
}
export function posterMesh(p:Poster,config:DomeConfig,view:Viewport) {
 const triangles=[];
 const columns=4,rows=6;
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++) {
  const a=[x/columns,y/rows],b=[(x+1)/columns,y/rows],c=[x/columns,(y+1)/rows],d=[(x+1)/columns,(y+1)/rows];
  for(const uv of [[a,b,c],[d,c,b]]) {
   const [s,t,r]=uv,points=uv.map(([u,v])=>posterSurfacePoint(p,u,v,config,view));
   const [q,w,e]=points;
   const ax=(w.x-q.x)/(t[0]-s[0]),ay=(w.y-q.y)/(t[0]-s[0]);
   const bx=(e.x-q.x)/(r[1]-s[1]),by=(e.y-q.y)/(r[1]-s[1]);
   triangles.push({uv,points,matrix:[ax,ay,bx,by,q.x-ax*s[0]-bx*s[1],q.y-ay*s[0]-by*s[1]]});
  }
 }
 return triangles;
}
