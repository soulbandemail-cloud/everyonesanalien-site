import { memo } from 'react';
import { project, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { hullMesh, type HullConfig } from '@/lib/ship/hullGeometry';
import { polygonPath } from '@/lib/ship/roomGeometry';
import styles from './ship.module.css';

export const ExteriorHull = memo(function ExteriorHull({config,hull,view,sharedSeam=false}:{config:DomeConfig;hull:HullConfig;view:Viewport;sharedSeam?:boolean}) {
  const patches = hullMesh(config,hull,sharedSeam).map(p=>({...p,depth:p.points.reduce((sum,point)=>sum+project(point,config,view).depth,0)/4})).sort((a,b)=>b.depth-a.depth);
  return <svg className={styles.exteriorHull} width={view.width} height={view.height} role="img" aria-label="Exterior silver upper saucer hull, projected beyond the glass; the outer alien belt is hidden">
    {patches.map((patch,i)=>{
      const tone=Math.round(198-patch.radial*35);
      const colour=`rgb(${tone} ${tone+7} ${tone+15})`;
      return <path key={i} d={polygonPath(patch.points,config,view)} fill={colour} stroke={colour} strokeWidth=".6" />;
    })}
  </svg>;
});
