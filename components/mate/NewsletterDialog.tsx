'use client';
import {useEffect,useRef} from 'react';

export default function NewsletterDialog({onClose}:{onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const element=dialog.current;
  const previousFocus=document.activeElement;
  element?.showModal();
  return ()=>{
   element?.close();
   if(previousFocus instanceof HTMLElement || previousFocus instanceof SVGElement) previousFocus.focus();
  };
 },[]);
 return <dialog ref={dialog} className="newsletter-dialog" aria-label="The Hyper-Fix newsletter" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <button className="newsletter-close" type="button" onClick={onClose} autoFocus>CLOSE NEWSLETTER</button>
  <a className="newsletter-page" href="https://link.dice.fm/C83a5f037e38" target="_blank" rel="noopener noreferrer" aria-label="The Hyper-Fix — open ticket page (new tab)">
   {/* Native image preserves the complete supplied newsletter without cropping. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src="/hyper-fix-no1.png" alt="The Hyper-Fix, issue 1: Soul Extend the Weekend. Newsletter and ticket offer." />
  </a>
 </dialog>;
}
