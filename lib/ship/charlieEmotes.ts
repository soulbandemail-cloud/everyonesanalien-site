export const EMOTES=[
 {id:'idea',label:'Idea',icon:'idea'}, {id:'wave',label:'Wave',icon:'wave'},
 {id:'peace',label:'Peace',icon:'peace'}, {id:'love',label:'Love',icon:'love'},
 {id:'kiss',label:'Kiss',icon:'kiss'}, {id:'dance-1',label:'Dance 1',icon:'shuffle'},
 {id:'dance-2',label:'Dance 2',icon:'disco'}, {id:'dance-3',label:'Dance 3',icon:'spin'},
 {id:'guitar',label:'Guitar',icon:'guitar'}, {id:'laugh',label:'Laugh',icon:'laugh'},
 {id:'confused',label:'Confused',icon:'confused'}, {id:'sleepy',label:'Sleepy',icon:'sleepy'},
] as const;
export type EmotePose={raise:number;sweep:number;lean:number};
export type EmoteCommand={kind:'wave'|'recover';started:number;from:EmotePose};
export type EmoteControl={command:EmoteCommand|null};
export const neutralEmote:EmotePose={raise:0,sweep:0,lean:0};
const ease=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const mix=(a:EmotePose,b:EmotePose,t:number):EmotePose=>({raise:a.raise+(b.raise-a.raise)*t,sweep:a.sweep+(b.sweep-a.sweep)*t,lean:a.lean+(b.lean-a.lean)*t});
export function emotePose(command:EmoteCommand|null,now:number,reduced=false):EmotePose{
 if(!command)return neutralEmote;
 const t=Math.max(0,(now-command.started)/1000);
 if(command.kind==='recover')return mix(command.from,neutralEmote,ease(t/.18));
 const strength=reduced?.4:1;
 const left={raise:1,sweep:-1,lean:.17*strength};
 if(t<.4)return mix(command.from,left,ease(t/.4));
 if(t<1.5){const u=(t-.4)/1.1,sweep=-Math.cos(u*Math.PI*3);return {raise:1,sweep,lean:-sweep*.17*strength};}
 return mix({raise:1,sweep:1,lean:-.17*strength},neutralEmote,ease((t-1.5)/.5));
}
export function canEmote(state:{mode:string;phase:unknown;engagement:unknown;moving:number},scripted:boolean){return state.mode==='standing'&&!state.phase&&!state.engagement&&state.moving<.02&&!scripted;}
/** Uniform clock spacing; reserve touch-sized targets before clamping the centre. */
export function emoteWheelLayout(x:number,y:number,width:number,height:number,scale=1){
 const button= Math.max(32,38/Math.max(.1,scale)),margin=button/2+4;
 const minimum=(button+3)/(2*Math.sin(Math.PI/12));
 const preferred=Math.max(minimum,100/Math.max(.1,scale));
 const room=Math.min(x-margin,width-x-margin,y-margin,height-y-margin);
 const radius=Math.min(preferred,Math.max(minimum,room),Math.max(0,Math.min(width,height)/2-margin));
 return {x:Math.max(radius+margin,Math.min(width-radius-margin,x)),y:Math.max(radius+margin,Math.min(height-radius-margin,y)),radius,button};
}
