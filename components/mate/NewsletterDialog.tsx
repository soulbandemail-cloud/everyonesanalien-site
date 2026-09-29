'use client';
import {useEffect,useRef,type CSSProperties} from 'react';
import {portraitFrame} from '@/components/arcade/presentation';
import {restoreObjectFocus} from './objectInteraction';

export default function NewsletterDialog({onClose,viewport}:{onClose:()=>void;viewport:{view:{width:number;height:number};mobile:boolean;left:number;top:number}}) {
 const frame=portraitFrame(viewport.view.width,viewport.view.height,viewport.mobile);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const element=dialog.current;
  const previousFocus=document.activeElement;
  element?.showModal();
  return ()=>{
   element?.close();
   restoreObjectFocus(previousFocus);
  };
 },[]);
 return <dialog ref={dialog} className="newsletter-dialog" aria-label="The Hyper-Fix newsletter" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div className="newsletter-frame" data-mobile={viewport.mobile || undefined} onClick={event=>{if(event.target===event.currentTarget)onClose();}} style={viewport.mobile ? {position:"absolute",left:viewport.left,top:viewport.top,width:frame.width,height:frame.height,transformOrigin:"0 0",transform:frame.rotated?`translateX(${frame.height}px) rotate(90deg)`:"none","--newsletter-height":`${frame.height}px`} as CSSProperties : undefined}>
  <button className="newsletter-close object-back" type="button" onClick={onClose} autoFocus>BACK</button>
  <a className="newsletter-page" href="https://link.dice.fm/C83a5f037e38" target="_blank" rel="noopener noreferrer" aria-label="The Hyper-Fix — open ticket page (new tab)">
   {/* Vector rendering of the supplied PDF keeps the newsletter sharp without cropping. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src="/hyper-fix-no1.svg" alt="The Hyper-Fix, issue 1: Soul Extend the Weekend. Newsletter and ticket offer." />
  </a>
  </div>
 </dialog>;
}
