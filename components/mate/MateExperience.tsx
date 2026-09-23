'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import './mate.css';
import CanonicalHomepage from '@/components/home/CanonicalHomepage';
import Ship from '@/components/ship/Ship';
import dynamic from 'next/dynamic';
import { DEFAULT_DOME } from '@/lib/ship/domeGeometry';
import { DEFAULT_HULL } from '@/lib/ship/hullGeometry';
import { cameraDuration, transitionCamera } from '@/lib/ship/cameraTransition';

const ArcadeDialog = dynamic(() => import('@/components/arcade/ArcadeDialog'), { ssr: false });

export default function MateExperience({ initialAuthenticated = false, loginEnabled = false, entry = false, error = false, development = false, preview = false }: {
  initialAuthenticated?: boolean; loginEnabled?: boolean; entry?: boolean; error?: boolean; development?: boolean; preview?: boolean;
}) {
  const [arcadeOpen,setArcadeOpen] = useState(false);
  const [authenticated,setAuthenticated] = useState(initialAuthenticated);
  const [entryReady,setEntryReady] = useState(!entry);
  const cockpit = preview || (authenticated && entryReady);
  // Losing access must also discard the open game before any later login.
  if (!cockpit && arcadeOpen) setArcadeOpen(false);
  const [progress,setProgress] = useState(cockpit && !entry ? 1 : 0);
  const progressRef = useRef(progress);
  const [view,setView] = useState({width:1440,height:900});
  const [config,setConfig] = useState(DEFAULT_DOME);
  const [hull,setHull] = useState(DEFAULT_HULL);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState(error ? 'That password reset link could not be used. Request a fresh RESET PASSWORD email and open it in the same browser.' : '');
  const requestVersion = useRef(0);
  const logoutBusy = useRef(false);
  const focusTarget = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const resize=()=>{
      const width=window.innerWidth,height=window.innerHeight;
      setView(current=>current.width===width && current.height===height ? current : {width,height});
      setEntryReady(true);
    };
    const observer=new ResizeObserver(resize);
    observer.observe(document.documentElement);
    window.addEventListener('resize',resize);
    if (entry || error) window.history.replaceState(window.history.state,'','/');
    return ()=>{observer.disconnect();window.removeEventListener('resize',resize);};
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
  return <div className={`mate-experience ${cockpit ? 'mate-cockpit' : ''}`} ref={focusTarget} tabIndex={-1}>
    <CanonicalHomepage animateEntry={entry} cockpit={cockpit} loginEnabled={loginEnabled && !preview} config={config} camera={camera} progress={progress} view={view} />
    {(cockpit || progress>0) && <Ship config={camera} baseline={config} onConfigChange={setConfig} hull={hull} onHullChange={setHull} view={view} reveal={progress} development={development} preview={preview} logout={authenticated ? logout : undefined} busy={busy} onArcade={cockpit && progress===1 ? () => setArcadeOpen(true) : undefined} />}
    {cockpit && arcadeOpen && <ArcadeDialog onExit={() => setArcadeOpen(false)} />}
    {notice && <div role="status" className="mate-notice">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
  </div>;
}
