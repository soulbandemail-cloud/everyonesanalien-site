import type {Viewport} from './domeGeometry';
export type DomeMenu = 'shows' | 'merch' | 'records' | null;
export function toggleDomeMenu(current:DomeMenu,requested:Exclude<DomeMenu,null>):DomeMenu {
 return current===requested ? null : requested;
}
/** Content-only adjustments; the room's calibrated camera and sphere are untouched. */
export function domeHeaderPresentation(view:Viewport,progress:number,mobile:boolean) {
 const t=Math.max(0,Math.min(1,progress));
 return {scale:1.25-(mobile ? .39 : .53)*t,lift:mobile ? view.height*.025*t : 0,socialLift:mobile ? view.height*.01*t : 0,ruleCurvature:mobile ? .35 : .8};
}
export const UPCOMING_POSTERS = [
 {id:'extend-the-weekend-2026-10-05',src:'/extend-the-weekend-poster.png',title:'Extend The Weekend — 5 October 2026',theta:-.9,latitude:.16,width:.8,aspect:841/595},
];
