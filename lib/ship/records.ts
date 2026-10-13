export const RECORDS = [
 {id:'the-magic-if',name:'THE MAGIC IF',artwork:'/records/the-magic-if.jpg',tracks:['Merry Go Round','Inside Out','What They Call Love','Daisy Blue','CLOUDS']},
 {id:'experiencing-the-role',name:'EXPERIENCING THE ROLE',artwork:'/records/experiencing-the-role.png',tracks:['Charlie','Brother','Bruno','Half-Noise','Any Day Now','Cheese']},
] as const;
export type AlbumId=typeof RECORDS[number]['id'];
export type RecordState={selectedAlbum:AlbumId|null;selectedSong:{album:AlbumId;index:number}|null;loadedAlbum:AlbumId|null;playing:boolean};
export const INITIAL_RECORD_STATE:RecordState={selectedAlbum:null,selectedSong:null,loadedAlbum:null,playing:false};
// Browsing never changes the physical platter or transport state.
export function selectRecordSong(state:RecordState,album:AlbumId,index:number):RecordState {
 const record=RECORDS.find(item=>item.id===album);
 if(!record || !Number.isInteger(index) || index<0 || index>=record.tracks.length)return state;
 return {...state,selectedAlbum:album,selectedSong:{album,index}};
}
/** Local turntable coordinates; rotate around the front-mounted axle (local Z axis). */
export const CRANK_PIVOT=[-.72,1.325,-.325] as const;
export function crankPoint(x:number,y:number,z:number,angle=0):number[]{
 return [CRANK_PIVOT[0]+x*Math.cos(angle)-y*Math.sin(angle),CRANK_PIVOT[1]+x*Math.sin(angle)+y*Math.cos(angle),CRANK_PIVOT[2]+z];
}
