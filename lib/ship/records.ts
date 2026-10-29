export const RECORDS = [
 {id:'the-magic-if',name:'THE MAGIC IF',artwork:'/records/the-magic-if.jpg',tracks:['Inside Out','What They Call Love','Daisy Blue','CLOUDS','Angel','Upside Down',"You're So Fine",'Oh! Sweet Serendipity','Merry Go Round']},
 {id:'experiencing-the-role',name:'EXPERIENCING THE ROLE',artwork:'/records/experiencing-the-role.png',tracks:['Charlie','Brother','Bruno','Half-Noise','Any Day Now','Cheese']},
] as const;
export type AlbumId=typeof RECORDS[number]['id'];
export type RecordState={selectedAlbum:AlbumId|null;selectedSong:{album:AlbumId;index:number}|null;loadedAlbum:AlbumId|null;playing:boolean};
export const INITIAL_RECORD_STATE:RecordState={selectedAlbum:null,selectedSong:null,loadedAlbum:null,playing:false};
// Browsing never changes the physical platter or transport state.
export function selectRecordSong(state:RecordState,album:AlbumId,index:number):RecordState {
 const record=RECORDS.find(item=>item.id===album);
 if(!record || !Number.isInteger(index) || index<0 || index>=record.tracks.length || !songAvailable({album,index}))return state;
 return {...state,selectedAlbum:album,selectedSong:{album,index}};
}
/** Local turntable coordinates; rotate around the front-mounted axle (local Z axis). */
export const CRANK_PIVOT=[-.72,1.325,-.325] as const;
export function crankPoint(x:number,y:number,z:number,angle=0):number[]{
 return [CRANK_PIVOT[0]+x*Math.cos(angle)-y*Math.sin(angle),CRANK_PIVOT[1]+x*Math.sin(angle)+y*Math.cos(angle),CRANK_PIVOT[2]+z];
}

export type RecordSide='A'|'B';
export type Song={album:AlbumId;index:number};
export const sideSplit=(album:AlbumId)=>album==='the-magic-if'?5:3;
export const recordSide=(index:number,album:AlbumId='experiencing-the-role'):RecordSide=>index<sideSplit(album)?'A':'B';
export const songAvailable=(song:Song)=>!(song.album==='the-magic-if'&&(song.index===3||song.index===4));
export function nextOnSide(song:Song):Song|null{
 const count=RECORDS.find(a=>a.id===song.album)!.tracks.length;
 return song.index+1<count&&songAvailable({...song,index:song.index+1})&&recordSide(song.index+1,song.album)===recordSide(song.index,song.album)?{...song,index:song.index+1}:null;
}
export function songFile(song:Song){
 const name=RECORDS.find(a=>a.id===song.album)!.tracks[song.index];
 return `/records/audio/${name.toLowerCase().replaceAll(' ','-')}-gramophone.mp3`;
}
export function trackTone(song:Song){
 const split=sideSplit(song.album),start=song.index<split?0:split;
 const count=start===0?split:RECORDS.find(a=>a.id===song.album)!.tracks.length-split;
 return .43+.35*(song.index-start)/Math.max(1,count-1);
}
