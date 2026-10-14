import type {CSSProperties} from 'react';
import './gramophoneNotes.css';

// Fixed, staggered variations avoid new random trajectories on playback updates.
const flights=[
 [-135,-110,4.7,0,0,1,0],[-180,-35,5.4,.65,1,-1,18],
 [-75,-155,5.1,1.3,2,1,-15],[-155,-80,4.9,2,0,-1,180],
 [-110,-185,5.8,2.7,1,1,165],[-200,-65,5.6,3.4,2,-1,8],
 [-45,-145,4.6,4.1,0,1,195],[-170,-140,6.1,4.8,1,-1,-20],
];
export function GramophoneNotes(){
 return <g className="gramophone-notes" transform="translate(-58 -63)" aria-hidden="true" pointerEvents="none" stroke="none">
  {flights.map(([x,y,duration,delay,kind,mirror,angle],i)=><g key={i} className="gramophone-note-flight" style={{
   '--x1':`${x*.28}px`,'--y1':`${y*.15+12}px`,'--x2':`${x*.64}px`,'--y2':`${y*.6-14}px`,
   '--x3':`${x}px`,'--y3':`${y}px`,'--flight':`${duration}s`,'--delay':`${delay}s`,
  } as CSSProperties}>
   <g className="gramophone-note-glyph"><g transform={`rotate(${angle}) scale(${mirror*(.85+i%3*.1)} ${.85+i%3*.1})`} fill="#fff" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="-4" cy="5" rx="3.6" ry="2.5" transform="rotate(-20 -4 5)" stroke="none"/>
    <path d="M-1 4V-10" fill="none"/>
    {kind===1&&<path d="M-1-10Q8-6 3 0Q5-6-1-6Z" stroke="none"/>}
    {kind===2&&<><path d="M-1-10L10-12V2M-1-7L10-9" fill="none"/><ellipse cx="7" cy="3" rx="3.6" ry="2.5" transform="rotate(-20 7 3)" stroke="none"/></>}
   </g></g>
   <g className="gramophone-note-pop" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round">
    {Array.from({length:7},(_,j)=><path key={j} d="M0-9V-13" transform={`rotate(${j*360/7})`}/>)}
   </g>
  </g>)}
 </g>;
}
