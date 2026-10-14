import {nextOnSide,songFile,type Song} from './records';
export type PlaybackUpdate={currentSong:Song|null;playing:boolean;loading:boolean;position:number;duration:number;endedSide:boolean;error:string|null};
type Voice={song:Song;node:AudioBufferSourceNode;start:number;duration:number};
/** Direct decoded MP3 playback. No filters, effects, fades or crossfades. */
export class RecordPlayback {
 private context:AudioContext|null=null;
 private generation=0;
 private voices:Voice[]=[];
 private buffers=new Map<string,Promise<AudioBuffer>>();
 private abort=new AbortController();
 private timer:ReturnType<typeof setInterval>|null=null;
 private upcoming:Promise<void>|null=null;
 private preparing=false;
 private requested:Song|null=null;
 private failedNext:Song|null=null;
 private report:PlaybackUpdate={currentSong:null,playing:false,loading:false,position:0,duration:0,endedSide:false,error:null};
 constructor(private update:(value:PlaybackUpdate)=>void,private createContext=()=>new (window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext)(),private fetchAudio:typeof fetch=(...args)=>fetch(...args)){}
 private emit(patch:Partial<PlaybackUpdate>){this.report={...this.report,...patch};this.update(this.report);}
 private ensure(){
  if(!this.context){
   this.context=this.createContext();
   this.context.onstatechange=()=>{
    if(this.voices.length&&this.context?.state!=='running')this.emit({playing:false,error:'Audio paused by your browser. Tap the selected song to retry.'});
    else if(this.voices.length)this.emit({playing:true,error:null});
   };
  }
  return this.context;
 }
 // Must run synchronously from the visitor's song click, before the ritual.
 prepare(song:Song){
  this.stop();this.requested=song;this.preparing=true;
  this.emit({currentSong:null,loading:true,endedSide:false,error:null,position:0,duration:0});
  try{
   const context=this.ensure(),token=this.generation;
   void context.resume().catch(()=>{if(token===this.generation)this.emit({error:'Tap the selected song to enable audio.'});});
   void this.load(song).catch(()=>{/* Surface load failures once the needle is down. */});
  }catch{this.emit({loading:false,error:'Audio is unavailable. Tap the selected song to retry.'});}
 }
 private load(song:Song){
  const url=songFile(song);let pending=this.buffers.get(url);
  if(!pending){
   const context=this.ensure();
   pending=this.fetchAudio(url,{signal:this.abort.signal}).then(response=>{if(!response.ok)throw new Error('missing');return response.arrayBuffer();}).then(data=>context.decodeAudioData(data));
   this.buffers.set(url,pending);
   void pending.catch(()=>{if(this.buffers.get(url)===pending)this.buffers.delete(url);});
  }
  return pending;
 }
 async start(){
  const song=this.requested;if(!song||!this.preparing)return;
  this.preparing=false;const token=this.generation;
  try{
   const buffer=await this.load(song);if(token!==this.generation)return;
   const context=this.ensure();
   if(context.state!=='running')throw new Error('blocked');
   const voice=this.schedule(song,buffer,context.currentTime,token);
   this.emit({currentSong:song,playing:true,loading:false,position:0,duration:voice.duration,error:null});
   this.timer=setInterval(()=>this.tick(token),500);this.tick(token);
  }catch(error){if(token===this.generation)this.emit({playing:false,loading:false,error:error instanceof Error&&error.message==='blocked'?'Tap the selected song to enable audio.':'Could not load this recording. Tap the selected song to retry.'});}
 }
 private schedule(song:Song,buffer:AudioBuffer,start:number,token:number){
  const context=this.ensure(),node=context.createBufferSource();node.buffer=buffer;node.connect(context.destination);
  const voice={song,node,start,duration:buffer.duration};this.voices.push(voice);
  node.onended=()=>{
   node.disconnect();if(token!==this.generation)return;
   this.voices=this.voices.filter(v=>v!==voice);this.buffers.delete(songFile(song));
   if(this.voices.length){const next=this.voices[0];this.emit({currentSong:next.song,position:0,duration:next.duration,playing:context.state==='running'});this.tick(token);}
   else if(nextOnSide(song)){
    this.emit({playing:false,loading:!this.failedNext});
    if(this.failedNext)this.emit({loading:false,error:'Could not load the next recording. Tap the selected song to retry.'});
   }else{
    if(this.timer)clearInterval(this.timer);this.timer=null;
    this.emit({playing:false,loading:false,position:voice.duration,endedSide:true,error:null});
   }
  };
  node.start(start);return voice;
 }
 private tick(token:number){
  if(token!==this.generation||!this.context)return;
  const current=this.voices.find(v=>v.start<=this.context!.currentTime)??this.voices[0];
  if(!current)return;
  const position=Math.min(current.duration,Math.max(0,this.context.currentTime-current.start));
  this.emit({currentSong:current.song,position,duration:current.duration});
  const next=nextOnSide(current.song);
  // Only the current track and its immediate successor are ever decoded.
  if(next&&current.duration-position<=45&&this.voices.length===1&&!this.upcoming&&!this.failedNext){
   this.upcoming=this.load(next).then(buffer=>{
    if(token!==this.generation)return;
    const start=Math.max(current.start+current.duration,this.context!.currentTime);
    this.schedule(next,buffer,start,token);
    if(!this.voices.includes(current))this.emit({currentSong:next,playing:this.context!.state==='running',loading:false,position:0,duration:buffer.duration});
   }).catch(()=>{if(token===this.generation){this.failedNext=next;if(!this.voices.length)this.emit({playing:false,loading:false,error:'Could not load the next recording. Tap the selected song to retry.'});}}).finally(()=>{if(token===this.generation)this.upcoming=null;});
  }
 }
 retry(){
  const song=this.failedNext??this.report.currentSong??this.requested;if(!song)return;
  this.prepare(song);const context=this.context;
  if(context)void context.resume().then(()=>this.start()).catch(()=>this.emit({loading:false,error:'Tap the selected song to enable audio.'}));
 }
 stop(){
  this.generation++;this.preparing=false;this.abort.abort();this.abort=new AbortController();
  for(const voice of this.voices){voice.node.onended=null;voice.node.stop();voice.node.disconnect();}
  this.voices=[];this.buffers.clear();this.upcoming=null;this.failedNext=null;
  if(this.timer)clearInterval(this.timer);this.timer=null;
  this.emit({playing:false,loading:false});
 }
 dispose(){this.stop();if(this.context){this.context.onstatechange=null;void this.context.close();}this.context=null;}
}
