'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** Body portal + native modal: never inherits the cockpit's landscape transform. */
export default function MobileEmailOverlay({children,onClose}:{children:ReactNode;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const node=dialog.current!;
  const previous=document.activeElement as HTMLElement|null;
  const viewport=window.visualViewport;
  const fit=()=>{
   node.style.top=`${viewport?.offsetTop??0}px`;
   node.style.left=`${viewport?.offsetLeft??0}px`;
   node.style.width=`${viewport?.width??window.innerWidth}px`;
   node.style.height=`${viewport?.height??window.innerHeight}px`;
  };
  fit();node.showModal();
  // Focus a non-input control: opening the overlay must not summon the keyboard.
  node.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
  viewport?.addEventListener('resize',fit);viewport?.addEventListener('scroll',fit);
  window.addEventListener('resize',fit);
  return ()=>{
   viewport?.removeEventListener('resize',fit);viewport?.removeEventListener('scroll',fit);
   window.removeEventListener('resize',fit);node.close();previous?.focus({preventScroll:true});
   window.dispatchEvent(new Event('resize'));
  };
 },[]);
 return createPortal(<dialog ref={dialog} className="mobile-email-overlay" aria-labelledby="mobile-email-heading" onCancel={event=>{event.preventDefault();onClose();}}>
  <div className="mobile-email-card">
   <button type="button" className="mobile-email-close" aria-label="Close email signup" autoFocus onClick={onClose}>×</button>
   <h2 id="mobile-email-heading">THE MATES</h2>
   <p>Get The Hyper-Fix, SOUL’s official newsletter, for news and Mates Rate offers.</p>
   {children}
  </div>
 </dialog>,document.body);
}
