/** Collection metadata stays separate from the public collection heading. */
export const CLOTHING = [{id:'soul-ringer-1',name:'SOUL Ringer Tee #1',thumbnail:'/soul-ringer-tee.png',wearable:'ringer'}] as const;
export type ClothingId=typeof CLOTHING[number]['id'];
export type Outfit=ClothingId|null;
export const CLOTHING_STORAGE='soul.charlie.clothing.v1';
export function validOutfit(value:unknown):Outfit{return CLOTHING.some(item=>item.id===value)?value as ClothingId:null;}
export function toggleOutfit(current:Outfit,id:ClothingId):Outfit{return current===id?null:id;}
export type ClothesSpin={started:number;from:Outfit;to:Outfit};
export function clothesFrame(spin:ClothesSpin|undefined,time:number,outfit:Outfit){
 const t=spin?Math.max(0,Math.min(1,(time-spin.started)/720)):1;
 const ease=t*t*(3-2*t);
 return {yaw:spin?720*ease:0,haze:spin?Math.sin(Math.PI*t)*.8:0,outfit:spin?(t<.5?spin.from:spin.to):outfit};
}
