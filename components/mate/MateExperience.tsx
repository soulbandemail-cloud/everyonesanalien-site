'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './mate.css';
import { useCockpitZoomGuard } from './useCockpitZoomGuard';
import { consoleTvScreen } from '@/lib/ship/fixtureLayout';
import NewsletterDialog from './NewsletterDialog';
import PortableTV, { type TvController } from '@/components/home/PortableTV';
import CanonicalHomepage from '@/components/home/CanonicalHomepage';
import { usePresentationViewport } from './usePresentationViewport';
import { mobileThirdCamera, cockpitPresentation, cockpitViewport } from '@/lib/ship/mobilePresentation';
import Ship from '@/components/ship/Ship';
import dynamic from 'next/dynamic';
import { DEFAULT_DOME } from '@/lib/ship/domeGeometry';
import { DEFAULT_HULL } from '@/lib/ship/hullGeometry';
import { cameraDuration, transitionCamera } from '@/lib/ship/cameraTransition';

const ArcadeDialog = dynamic(() => import('@/components/arcade/ArcadeDialog'), { ssr: false });

export default function MateExperience({ initialAuthenticated = false, loginEnabled = false, entry = false, error = false, development = false, preview = false, mobilePreview = false }: {
  initialAuthenticated?: boolean; loginEnabled?: boolean; entry?: boolean; error?: boolean; development?: boolean; preview?: boolean; mobilePreview?: boolean;
}) {
  const tvController=useRef<TvController>(null);
  const [newsletterOpen,setNewsletterOpen]=useState(false);
  const [arcadeOpen,setArcadeOpen] = useState(false);
  const [authenticated,setAuthenticated] = useState(initialAuthenticated);
  const [entryReady,setEntryReady] = useState(!entry);
  const [previewCockpit,setPreviewCockpit]=useState(preview);
  const cockpit = (preview && previewCockpit) || (authenticated && entryReady);
  // Losing access must also discard the open game before any later login.
  if (!cockpit && newsletterOpen) setNewsletterOpen(false);
  if (!cockpit && arcadeOpen) setArcadeOpen(false);
  const [progress,setProgress] = useState(cockpit && !entry ? 1 : 0);
  const progressRef = useRef(progress);
  const viewport=usePresentationViewport(setEntryReady,mobilePreview);
  const {mobile}=viewport;
  const thirdActive=cockpit || progress>0;
  useCockpitZoomGuard(thirdActive && !arcadeOpen);
  const sceneViewport=useMemo(()=>cockpitViewport(viewport.view,viewport.scale,thirdActive),[viewport.view,viewport.scale,thirdActive]);
  const presentation=useMemo(()=>cockpitPresentation(sceneViewport.view,mobile,viewport.landscape,progress,viewport.screenAngle),[sceneViewport.view,mobile,viewport.landscape,progress,viewport.screenAngle]);
  const view=presentation.view;
  const portraitFirst=mobile && viewport.landscape && (!cockpit || progress<1);
  const mobileThird=mobile && (cockpit || progress>0);
  const [config,setConfig] = useState(DEFAULT_DOME);
  const [hull,setHull] = useState(DEFAULT_HULL);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState(error ? 'That password reset link could not be used. Request a fresh RESET PASSWORD email and open it in the same browser.' : '');
  const requestVersion = useRef(0);
  const logoutBusy = useRef(false);
  const focusTarget = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if (entry || error) window.history.replaceState(window.history.state,'','/');
  },[entry,error]);

  useEffect(()=>{
    const target=cockpit ? 1 : 0;
    const from=progressRef.current;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0;
    const finish=()=>{cancelAnimationFrame(frame);progressRef.current=target;setProgress(target);};
    const duration=cameraDuration(reduced.matches,document.hidden);
    const start=performance.now();
    const tick=(now:number)=>{
      const t=Math.min(1,(now-start)/duration);
      const eased=t*t*(3-2*t);
      progressRef.current=from+(target-from)*eased;setProgress(progressRef.current);
      if(t<1) frame=requestAnimationFrame(tick);
    };
    if (!duration || from===target) finish(); else frame=requestAnimationFrame(tick);
    const visibility=()=>{if(document.hidden) finish();};
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('resize',finish);
    reduced.addEventListener('change',finish);
    return ()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',finish);reduced.removeEventListener('change',finish);};
  },[cockpit]);

  const checkSession=useCallback(async()=>{
    if (!loginEnabled || preview || logoutBusy.current) return;
    const version=++requestVersion.current;
    try {
      const response=await fetch('/api/mate/session',{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok) throw new Error('unavailable');
      const data=await response.json();
      if(version===requestVersion.current) {setAuthenticated(data.authenticated===true);setNotice(current=>current.startsWith('Unable to check your session.') ? '' : current);}
    } catch { if(version===requestVersion.current) setNotice('Unable to check your session. Reconnect to continue; you can retry by returning to this tab.'); }
  },[loginEnabled,preview]);
  useEffect(()=>{
    if(!loginEnabled || preview) return;
    const check=()=>{if(!document.hidden) void checkSession();};
    const channel=typeof BroadcastChannel!=='undefined' ? new BroadcastChannel('eaa-mate-session') : null;
    if(entry) channel?.postMessage('changed');
    if(channel) channel.onmessage=check;
    window.addEventListener('focus',check);window.addEventListener('pageshow',check);document.addEventListener('visibilitychange',check);
    const timer=window.setInterval(check,60000);
    check();
    const invalidate=()=>{requestVersion.current++;};
    return ()=>{invalidate();channel?.close();clearInterval(timer);window.removeEventListener('focus',check);window.removeEventListener('pageshow',check);document.removeEventListener('visibilitychange',check);};
  },[checkSession,loginEnabled,preview,entry]);

  async function logout() {
    if(logoutBusy.current) return;
    logoutBusy.current=true;requestVersion.current++;setBusy(true);setNotice('');
    try {
      const response=await fetch('/api/mate/logout',{method:'POST',signal:AbortSignal.timeout(15000)});
      if(!response.ok) throw new Error('logout');
      // Session ends first. Motion is cosmetic and can never hold a session open.
      setArcadeOpen(false);
      setAuthenticated(false);
      const channel=typeof BroadcastChannel!=='undefined' ? new BroadcastChannel('eaa-mate-session') : null;
      channel?.postMessage('changed');channel?.close();
      focusTarget.current?.focus();
    } catch {setNotice('Could not confirm logout. Please retry.');}
    finally {logoutBusy.current=false;setBusy(false);}
  }

  const camera=transitionCamera(config,progress);
  const roomCamera=transitionCamera(mobileThird ? mobileThirdCamera(config,view) : config,progress);
  const tvDock=thirdActive ? consoleTvScreen(roomCamera,view) : undefined;
  const tvVisible=(!cockpit && progress===0) || (cockpit && progress===1 && tvDock?.visible);
  return <div className={`mate-experience ${cockpit ? 'mate-cockpit' : ''}`} ref={focusTarget} tabIndex={-1} data-mobile={mobile || undefined} data-cockpit-active={thirdActive && !arcadeOpen || undefined}>
    <div data-cockpit-presentation data-presentation-angle={presentation.angle} data-presentation-scale={sceneViewport.scale} data-portrait-first={portraitFirst || undefined} data-portrait-settled={portraitFirst && progress===0 || undefined} style={mobileThird || (mobile && viewport.screenAngle!==0) || sceneViewport.scale!==1 ? {
      '--portrait-width':`${view.width}px`,'--portrait-height':`${view.height}px`,
      position:'fixed',left:0,top:0,width:view.width,height:view.height,transformOrigin:'0 0',
      transform:`translate(${viewport.left+viewport.view.width/2}px,${viewport.top+viewport.view.height/2}px) scale(${sceneViewport.scale}) rotate(${presentation.angle}deg) translate(${-view.width/2}px,${-view.height/2}px)`,
    } as React.CSSProperties : undefined}>
    <CanonicalHomepage animateEntry={entry} cockpit={cockpit} loginEnabled={loginEnabled && !preview} config={config} camera={camera} progress={progress} view={view} mobileThird={mobileThird} publicFrame={mobile ? presentation : undefined} />
    {(cockpit || progress>0) && <Ship onNewsletter={cockpit && progress===1 ? ()=>setNewsletterOpen(true) : undefined} onTV={cockpit && progress===1 ? ()=>tvController.current?.open() : undefined} liveTv={!!tvVisible} config={roomCamera} domeConfig={camera} sharedSeam={mobileThird} baseline={config} onConfigChange={setConfig} hull={hull} onHullChange={setHull} view={view} reveal={progress} development={development} preview={preview} logout={authenticated ? logout : undefined} busy={busy} onArcade={cockpit && progress===1 ? () => setArcadeOpen(true) : undefined} />}
    {cockpit && newsletterOpen && <NewsletterDialog viewport={viewport} onClose={()=>setNewsletterOpen(false)} />}
    {cockpit && arcadeOpen && <ArcadeDialog viewport={viewport} onExit={() => setArcadeOpen(false)} />}
    </div>
    <div className="public-tv-frame site-atmosphere" data-tv-visible={!!tvVisible} data-mobile={mobile || undefined} style={thirdActive ? {
      '--tv-frame-width':`${view.width}px`,'--tv-frame-height':`${view.height}px`,
      left:0,top:0,width:view.width,height:view.height,transformOrigin:'0 0',
      transform:`translate(${viewport.left+viewport.view.width/2}px,${viewport.top+viewport.view.height/2}px) scale(${sceneViewport.scale}) rotate(${presentation.angle}deg) translate(${-view.width/2}px,${-view.height/2}px)`,
    } as React.CSSProperties : {'--tv-turn':`${-viewport.screenAngle}deg`} as React.CSSProperties} data-portrait-first={!thirdActive && mobile && viewport.landscape || undefined}>
      <PortableTV dock={tvDock} controllerRef={tvController} />
    </div>
    {development && preview && <button type="button" onClick={()=>setPreviewCockpit(value=>!value)} style={{position:'fixed',bottom:8,right:8,zIndex:30001,background:'#00082d',color:'white',border:'1px solid white',padding:8}}>Preview {cockpit ? '1st' : '3rd'} person</button>}
    {notice && <div role="status" className="mate-notice">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
  </div>;
}
