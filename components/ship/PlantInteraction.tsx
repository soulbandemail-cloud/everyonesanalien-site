import {useId,useState,type ReactNode,type CSSProperties} from 'react';
/** The same SVG contour, enlargement and pointer/keyboard feedback as furniture. */
export function PlantInteraction({onClick,label,children,tooltip='Water Plant',selected}:{onClick?:()=>void;label:string;children:ReactNode;tooltip?:string;selected?:boolean}){
 const id=useId(),[pressed,setPressed]=useState(false);
 return <g role="button" aria-label={label} aria-pressed={selected} aria-disabled={!onClick} tabIndex={onClick?0:-1} className="cockpit-interactive-fixture" style={{pointerEvents:'auto','--fixture-hover-filter':`url(#${id})`} as CSSProperties} data-pressed={!!onClick&&pressed||undefined} onClick={onClick}
 onPointerDown={e=>{if(onClick&&e.button===0){e.currentTarget.setPointerCapture(e.pointerId);setPressed(true);}}} onPointerUp={()=>setPressed(false)} onPointerCancel={()=>setPressed(false)} onPointerLeave={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))setPressed(false);}} onBlur={()=>setPressed(false)}
 onKeyDown={e=>{if(onClick&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setPressed(true);}}} onKeyUp={e=>{if(onClick&&pressed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setPressed(false);onClick();}}}>
 <defs><filter id={id} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="soft"/><feComponentTransfer in="soft" result="expanded"><feFuncA type="linear" slope="12" intercept="-1.5"/></feComponentTransfer><feComposite in="expanded" in2="SourceAlpha" operator="out" result="edge"/><feFlood floodColor="#6ee7b7" result="mint"/><feComposite in="mint" in2="edge" operator="in" result="outline"/><feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
 {onClick&&<title>{tooltip}</title>}{children}</g>;
}
