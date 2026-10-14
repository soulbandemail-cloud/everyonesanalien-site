import {EMOTES,emoteWheelLayout,type EmoteId} from '@/lib/ship/charlieEmotes';
import './emotes.css';
function Icon({kind}:{kind:string}){
 const paths:Record<string,string>={
 idea:'M8 15C0 5 18 0 18 9Q18 12 15 15V19H8ZM9 22H14M11 1V-1M2 4L0 2M21 4L23 2',
 wave:'M7 22Q2 17 2 12Q2 9 5 12L7 14V3Q8 0 10 3V10V0Q12-2 13 1V10L15 2Q18 0 18 4L17 12L20 7Q23 6 22 10L20 19Q17 25 7 22M0 1L-2 5M23 0L26 4',
 peace:'M3 23V14L0 4Q0 1 2 3L7 12L7 1Q9-2 10 1L11 14Q16 15 13 22ZM17 23V15L14 5M21 14L23 3',
 love:'M12 21C8 17 0 13 1 7C2 1 9 2 12 7C15 2 22 1 23 7C24 13 16 18 12 21ZM0 23L5 17M24 23L19 17',
 kiss:'M0 8Q5 2 9 8M2 14Q7 11 9 14L5 16ZM12 12Q8 6 13 5Q16 5 17 8Q21 3 23 7Q24 11 17 16Z',
 shuffle:'M5 3L12 5L8 13L18 14M10 8L2 12M8 13L4 23M18 14L22 23M1 24H7M20 24H25',
 disco:'M11 7L9 15L2 23M9 15L20 23M10 10L2 10L0 5M11 8L22 0M8 2H12',
 spin:'M12 6L12 15L5 22M12 15L20 22M12 9L2 6M12 9L22 5M7 1H16M1 16Q-2 24 6 25M22 17L25 21L20 23',
 guitar:'M12 12L20 1L23 3L15 15L19 24L10 19L1 22L7 11ZM10 16L20 3',
 laugh:'M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12M5 9L8 7L10 9M14 9L17 7L20 9M6 13Q12 25 19 13Z',
 confused:'M5 6C5-2 21-2 20 7Q20 11 12 13V17M12 22V23',
 sleepy:'M0 3H10L0 13H10M13 9H22L13 18H22M17-2H24L17 4H24',
 };
 return <svg viewBox="-4 -4 32 32" aria-hidden="true"><path d={paths[kind]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export function EmoteWheel({x,y,width,height,scale,onSelect}:{x:number;y:number;width:number;height:number;scale:number;onSelect:(id:EmoteId)=>void}){
 const layout=emoteWheelLayout(x,y,width,height,scale);
 return <div className="charlie-emote-wheel" data-charlie-emote-ui role="group" aria-label="Charlie's emotes" onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
 {EMOTES.map((item,i)=>{const angle=i*Math.PI/6;return <button key={item.id} type="button" className="charlie-emote-icon" aria-label={item.label} title={item.label} onClick={()=>onSelect(item.id)} style={{left:layout.x+Math.sin(angle)*layout.radius,top:layout.y-Math.cos(angle)*layout.radius,width:layout.button,height:layout.button}}><Icon kind={item.icon}/></button>;})}
 </div>;
}
