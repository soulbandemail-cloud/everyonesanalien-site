# Layer 18 camera rendering checkpoint

## Implemented

- Sofa upholstery and curved poster use immutable world-space meshes. Camera changes update projection uniforms and canvas placement synchronously; they no longer launch PNG generation or asynchronous camera-specific image loads.
- One shared offscreen WebGL renderer caches geometry buffers and source textures. Canvas allocations grow in buckets. A CPU fallback handles unavailable WebGL.
- Exterior hull tessellation is cached; the rug's original vector artwork is cached and moved with an exact projective plane transform.
- Chair outlines, instrument modules, fixture artwork and Planet Heart avoid unnecessary reconciliation.
- Domepage layout measurements are cached separately from camera-dependent curvature transforms. Glass keeps its camera-dependent optical calculations and reuses its pixel buffer.
- Navigation uses the resting room configuration rather than restarting with every camera frame. Cursor tracking retains one animation loop and reads the latest camera.
- Interior readiness gates wait for the cockpit, fonts, images and first canvas renders. The existing starfield and exact Planet Heart stay mounted while interior assets load.

## Developer test

Open `/ship?camera-test=1` on localhost in development and press **Run camera sweep**. The test measures two seconds at rest, then moves out and back over eight seconds, returning exactly to the resting configuration.

For a local production benchmark, build with `NEXT_PUBLIC_CAMERA_RENDER_TEST=1 npm run build -- --webpack`, then run a local production server. The test is restricted to localhost/127.0.0.1, even with this build flag. Ordinary production builds do not expose it.

## Validation, 30 October 2026

- Production build and TypeScript pass.
- 59 focused tests pass: rendering cache, readiness, projection, room geometry, mobile presentation and navigation.
- Poster still opens its maximised viewer after the rendering change.
- At 1280 × 720 in the in-app browser, final production sweep: idle median 33.4 ms; moving median 66.7 ms; p95 100.7 ms; maximum 134.2 ms; 104 frames over the sweep. Zero new geometry uploads, zero new texture uploads; cached surface draws about 0.3 ms per frame.
- These results prove that camera-dependent asset regeneration is removed, **not** that full-scene camera animation is sufficiently smooth. Production still runs at roughly 15 fps during movement in this environment. Physical mobile and uncached frame-by-frame cold-start validation remain outstanding.

## Remaining before arrival

1. Profile and reduce the remaining full-scene SVG projection/reconciliation/paint cost. The scene is a custom SVG/canvas renderer, not a shared Three.js scene. Cached surface drawing is no longer the dominant measured cost.
2. Validate camera motion on mobile hardware and capture cold-load frames. Current browser reload checks are not a cleared-cache cold-load recording.
3. Handle near-plane crossings for planar SVG artwork during the much larger exterior-to-interior path (the current rug plane rejects an origin behind the near plane).
4. Integrate the exterior and continuous entry only after the camera test meets the performance target. Preserve the exact Planet Heart screen position with explicit compensation during arrival, and apply the requested portrait rotation.

The UFO intro has deliberately not been re-enabled. No fades, screenshots, animation extensions or removals of ambient effects were used to conceal the remaining rendering limitation.

## Occlusion correction

The embedded `foreignObject` canvases introduced a compositing regression: they could paint above neighbouring SVG furniture and parapet details. The rim is again rendered as native SVG paths, with its cached world geometry sorted by current camera depth, followed by the unchanged panels and lights. Cached world surfaces now publish their pixels as native SVG images with matching projection coordinates in the same layout update. This restores the pre-refactor SVG painter stack for sofa/plant/table overlap and avoids asynchronous stale-position publication.

No furniture, camera, loading gate or arrival settings changed. TypeScript, targeted lint and 22 rendering/readiness/geometry tests pass. Resting and camera-sweep screenshots were inspected. Native SVG image publication adds encoding/decoding cost during camera motion; the earlier performance numbers above do not describe this corrected implementation. Correctness takes priority in this regression-only pass; camera performance remains unfinished.

## Revised arrival approach

The full-scene fly-through has been abandoned for Layer 18. `UfoArrival` is an isolated lightweight SVG exterior, animated with the Web Animations API. It never changes scene cameras or regenerates furniture. The existing background remains mounted. Interior preparation completes behind the starfield before the one-second flight starts; the ready cockpit is revealed at 900 ms and the exterior is removed at 1000 ms. No fade-to-black or loading overlay is used.

Normal visits run once per session and reduced-motion visits skip. Portrait presentation starts the exterior upright via a +90-degree local counter-rotation, then turns it anticlockwise to the existing -90-degree presentation before reveal. The rotation reminder starts afterwards. Development-only `/ship?arrival-test=1` replays it for inspection; `/ship?camera-test=1` bypasses arrival.

Nine targeted arrival/readiness/projection tests and TypeScript pass. Browser frames confirm a changing saucer size and stationary Planet Heart through flight/reveal. Physical phone validation remains outstanding. Prior camera performance findings remain relevant only to future camera work, not this isolated arrival.
