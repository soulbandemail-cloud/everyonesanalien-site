/** The mobile arcade has one portrait coordinate space, even on a landscape phone. */
export function portraitFrame(width:number,height:number,mobile:boolean) {
 return {width:mobile?Math.min(width,height):width,height:mobile?Math.max(width,height):height,rotated:mobile && width>height};
}
function frame(root:Element|null) { return root?.closest?.<HTMLElement>('[data-arcade-frame]'); }
export function arcadeSize(root:Element|null) {
 const el=frame(root);
 return el ? {width:Number(el.dataset.arcadeWidth),height:Number(el.dataset.arcadeHeight)} : {width:window.innerWidth,height:window.innerHeight};
}
export function arcadePoint(root:Element|null,point:{x:number;y:number}) {
 const el=frame(root);if(!el)return point;
 const bounds=el.getBoundingClientRect();
 return el.dataset.arcadeRotated==='true' ? {x:point.y-bounds.top,y:bounds.right-point.x} : {x:point.x-bounds.left,y:point.y-bounds.top};
}
export function arcadeRect(root:Element|null,element:Element) {
 const rect=element.getBoundingClientRect();if(!frame(root))return rect;
 const a=arcadePoint(root,{x:rect.left,y:rect.top}),b=arcadePoint(root,{x:rect.right,y:rect.bottom});
 const left=Math.min(a.x,b.x),top=Math.min(a.y,b.y),width=Math.abs(b.x-a.x),height=Math.abs(b.y-a.y);
 return {left,top,width,height,right:left+width,bottom:top+height};
}
