import {type ReactNode} from 'react';
import {lens,radians,type DomeConfig,type Viewport,type Vec3} from '@/lib/ship/domeGeometry';
/** Exact projective transform of a planar world-space vector asset. No raster snapshot.
 * CSS homogeneous w is the same camera depth used by project(). */
export function WorldPlane({origin,u,v,width,height,config,view,children}:{origin:Vec3;u:Vec3;v:Vec3;width:number;height:number;config:DomeConfig;view:Viewport;children:ReactNode}){
 const {focal,horizon}=lens(config,view),pitch=radians(config.pitch),sin=Math.sin(pitch),cos=Math.cos(pitch);
 const basis=(p:Vec3)=>{const depth=sin*p.y+cos*p.z,up=cos*p.y-sin*p.z;return [view.width/2*depth+focal*p.x,horizon*depth-focal*up,depth];};
 const a=basis(u),b=basis(v),c=basis({x:origin.x-config.camera.x,y:origin.y-config.camera.y,z:origin.z-config.camera.z});
 if(c[2]<=.1)return null;
 const matrix=[a[0],a[1],0,a[2],b[0],b[1],0,b[2],0,0,c[2],0,c[0],c[1],0,c[2]].map(n=>n/c[2]);
 return <foreignObject width={view.width} height={view.height} overflow="visible" pointerEvents="none"><div style={{width,height,transformOrigin:'0 0',willChange:'transform',transform:`matrix3d(${matrix.join(',')})`}}>{children}</div></foreignObject>;
}
