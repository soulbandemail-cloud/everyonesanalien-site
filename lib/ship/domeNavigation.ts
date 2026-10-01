import type {Viewport} from './domeGeometry';
export type DomeMenu = 'shows' | 'merch' | null;
export function toggleDomeMenu(current:DomeMenu,requested:Exclude<DomeMenu,null>):DomeMenu {
 return current===requested ? null : requested;
}
/** Content-only adjustments; the room's calibrated camera and sphere are untouched. */
export function domeHeaderPresentation(view:Viewport,progress:number,mobile:boolean) {
 const t=Math.max(0,Math.min(1,progress));
 return {scale:1.25-.53*t,lift:mobile ? view.height*.045*t : 0,socialLift:mobile ? view.height*.01*t : 0,ruleCurvature:mobile ? .35 : 1};
}
export const UPCOMING_POSTERS = [
 {id:'extend-the-weekend-2026-10-05',src:'/extend-the-weekend-poster.png',title:'Extend The Weekend — 5 October 2026',theta:-1.04,latitude:.38,width:1.35,aspect:841/595},
];
