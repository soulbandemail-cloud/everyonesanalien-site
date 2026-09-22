import { useEffect, useRef } from 'react';

/** Own delayed work so removing an interactive surface also stops its work. */
export function useScopedLifecycle() {
  const handles = useRef({ timers: new Set<number>(), frames: new Set<number>() });
  const [lifecycle] = useRef([{
    timeout(callback: () => void, delay: number) {
      const id = window.setTimeout(() => { handles.current.timers.delete(id); callback(); }, delay);
      handles.current.timers.add(id);
      return id;
    },
    frame(callback: FrameRequestCallback) {
      const id = window.requestAnimationFrame(time => { handles.current.frames.delete(id); callback(time); });
      handles.current.frames.add(id);
      return id;
    },
    cancelFrame(id: number) {
      window.cancelAnimationFrame(id);
      handles.current.frames.delete(id);
    },
  }]).current;
  useEffect(() => {
    const owned = handles.current;
    return () => {
      owned.timers.forEach(id => window.clearTimeout(id));
      owned.frames.forEach(id => window.cancelAnimationFrame(id));
      owned.timers.clear(); owned.frames.clear();
    };
  }, []);
  return lifecycle;
}
