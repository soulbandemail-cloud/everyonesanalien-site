import {createContext,useContext,useLayoutEffect,useRef} from 'react';
/** Keep mounted scene state, but suspend visual work behind full-screen viewers. */
export const CockpitActiveContext=createContext(true);
export function useCockpitActivity(){
 const active=useContext(CockpitActiveContext),current=useRef(active);
 useLayoutEffect(()=>{current.current=active;},[active]);
 return current;
}
