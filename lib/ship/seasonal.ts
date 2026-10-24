/** Annual ranges use the visitor's local calendar, including ranges crossing New Year. */
export type SeasonalDecoration={key:string;start:readonly [number,number];end:readonly [number,number]};
export const HALLOWEEN:SeasonalDecoration={key:'soul-halloween-pumpkin-light',start:[10,24],end:[10,31]};
export function inSeason(date:Date,season:SeasonalDecoration){
 const day=(date.getMonth()+1)*100+date.getDate(),start=season.start[0]*100+season.start[1],end=season.end[0]*100+season.end[1];
 return start<=end?day>=start&&day<=end:day>=start||day<=end;
}
export function untilLocalMidnight(date:Date){
 return new Date(date.getFullYear(),date.getMonth(),date.getDate()+1).getTime()-date.getTime()+50;
}
export function savedSeasonalLight(value:string|null){return value!=='off';}
