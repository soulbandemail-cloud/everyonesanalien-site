# Arcade extraction inventory

## Pre-edit inspection

The source is `components/home/CanonicalHomepage.tsx` (1,724 lines), with visuals and media queries in `app/globals.css`. All game state is component-local. There is no server scoring, storage or persistence. The only counters count tractor captures by alien, white skull and black skull. Physics runs every 16ms, using viewport pixels and DOM collision rectangles. The dedicated full-viewport arcade preserves that coordinate system.

The world-space cabinet is already in `Fixtures.tsx`, positioned by `fixtureLayout.ts`. Its projected screen and control deck are the entry point. No fixture coordinates, projection, camera, hull, mezzanine, console or floor dimensions need to change. `MateExperience` can mount a modal game only while the cockpit is available.

## Complete before → after map

All game rows below move from CanonicalHomepage into ArcadeGame; original CSS values/keyframes are retained. Common non-game TV positioning moves to usePortableTv. The public homepage has no game hook or game instance.

| System/dependency before | Preserved implementation after |
| --- | --- |
| Two scrolling tracks, each with 18 heads on either side of a nameplate; mint hover, pointer launch | Same arcade-only band, SVG assets, scroll/spin CSS and launch handler; nameplate restarts the game instead of reloading the website |
| FlyingAlien records: id, x/y, vx/vy, spin, skull/black/turning state, stun/catch/exit timestamps, captured/time/scale, three bounce timestamps | Same per-instance records and 16ms map/filter physics in ArcadeGame |
| Launch random angle, speed 5–9, spin ±1; launch centre from selected SVG bounds; removal 80px outside viewport | Same calculations |
| Pointer-following UFO, hidden after heart collision, respawn on next pointerdown | Same pointer listeners, position state/ref and SVG |
| Heart/ring toggles orbit; orbit disables tractor; 3s CSS path | Same planet-heart/ring assets and orbit state/ref; public wordmark keeps static visual asset |
| Tractor: mouse-left fine pointer or coarse touch, stop on up/cancel/blur, triangular beam with head-radius padding | Same contact calculation and listeners |
| Capture deduplication Set; three counters/icons; 360ms shrink with 0.3 attraction each tick | Same capture sequence and counters |
| Shooting-star catch opens wish prompt; ordinary wish makes 10-star barrier for 900ms | Same star paths, input, offsets and barrier ref |
| Forbidden wishes (kill/dead/die/death/back to life/love/more wishes) | Same trigger regexes and four rules displayed for 8000ms |
| `pong` wish: infinite five-star barrier, centre offset -67, drag clamp ±(viewport/2−40) | Same draggable paddle and collision surface |
| Wish star reflection: swept crossing, padding18, y24% mobile/34% desktop, debounce140ms | Same calculations |
| Footer-line reflection: downward swept crossing, boundary top−18, debounce140ms | Same arcade-local band/ref and collision |
| TV-body reflection: expanded bounds16, swept four faces, corner tolerance.02, residual travel, debounce100ms; disabled when expanded | Same local game TV/body ref and algorithm |
| TV antenna: rect midpoint/top+5, radius26 mobile/38 desktop, click spark500ms | Same arcade-local antenna/button and spark SVG |
| Zap traps alien at moving antenna for3000ms; first skull white; repeated skull zap turns black; six spark bursts | Same stun/blackening state and CSS |
| Recatch700ms plus mandatory exit from active spark; moving trapped head follows antenna | Same timestamp/exit gate |
| Heart radius42: ordinary alien pulse, white skull white flash, black skull blackout + WOMBO COMBO | Same branch order and effects; collision consumes head |
| Heart/ring blink420ms; four pulse copies stagger120ms; pulse cleared3000ms | Same timers and SVG assets |
| Flash cleared2800ms; wish layer hidden500ms, black return2000ms; Wombo1700ms | Same timings/classes |
| Ref dependencies: orbitRef, footerRef, tvBodyRef, antennaRef, UFO pos, tractor active, capture Set, wish barrier, spark active; timeout refs | Owned by mounted game; pending timers/drags removed on exit |
| Public portable TV: video start/expand/collapse; handle threshold18; bottom left/right, mobile breakpoint640, original margins/clamps; three placement effects | Public PortableTV and game-local TV share usePortableTv, without public spark controls |
| Stars/glints/shooting-star animations | Remain atmospheric on public page; interactive wish stars only in arcade |
| SOUL, social/event links, MatePanel, merch, useDomeProjection | Remain CanonicalHomepage; no game state/effects/handlers/footer |

## Integration and intentional differences

The cabinet screen becomes a static game attract image: no idle simulation. Click/tap or Enter/Space opens a native modal dialog containing the sole game implementation. Exit or Escape unmounts it and returns focus to the cabinet. The authenticated cockpit gate also unmounts it on loss of access. A fresh entry/restart starts a new game; there was no game persistence previously.

The game's TV is an arcade-local equivalent, retaining video expansion, slide, body collision and zap antenna. It does not control the physical cockpit TV. Site links/forms are not copied into the game. Their former top-row space is retained for the planet-heart's placement. The public SOUL O keeps its appearance but no longer toggles the game UFO. No distant planet is added.

The viewport-sized playfield preserves existing window-coordinate physics and responsive breakpoints. CSS game animations are relocated intact; shared space/TV/wordmark styles remain shared. New dialog controls are outside game pointer handling. Timers and in-progress drags now clean up on unmount so exit never leaves invisible game processing.

## Exact file changes

Modified:
- `components/home/CanonicalHomepage.tsx`: reduced from 1,724 to 151 lines; owns public content/projection/atmosphere only. Removed the unreachable legacy cockpit video dialog (it had no launcher).
- `app/globals.css`: relocated game-only rules intact; retained shared TV, wordmark, starfield and all 11 shooting-star paths. Public antenna/stars no longer receive game input.
- `components/mate/MateExperience.tsx`: lazy arcade dialog state and cockpit-only mounting; closing/losing cockpit access discards it. Removed obsolete homepage game-enable prop. Authentication/session calls and camera calculations unchanged.
- `components/ship/Ship.tsx`: passes arcade entry callback through to Fixtures. Swivel/attention code unchanged.
- `components/ship/Fixtures.tsx`: cabinet-only pointer/keyboard entry, accessible group semantics, static screen attract image. No geometry or placement changes.
- `tests/canonical-homepage.test.mjs`: renders the extracted public visual components; asserts the newly required absence of game/footer while retaining content/link/form/projection checks.

Added:
- `components/arcade/ArcadeGame.tsx`: original game state, handlers, physics and presentation.
- `components/arcade/ArcadeDialog.tsx`: modal lifetime, Exit/Escape, restart and focus restoration.
- `components/arcade/arcade.css`: original game CSS/keyframes plus modal/exit controls.
- `components/home/PlanetHeart.tsx`: shared original SVG heart/ring asset, unique SVG filter IDs; optional arcade handlers/state.
- `components/home/PortableTV.tsx`: public video TV without spark controls.
- `components/home/usePortableTv.ts`: shared original two-position movement and sizing.
- `components/home/useScopedLifecycle.ts`: cancels owned timeouts/animation frames on unmount.
- `tests/arcade.test.mjs`: deterministic tests executing actual extracted handlers and physics, with fake clock/DOM bounds; desktop and phone cases; cleanup during active drags.
- `docs/arcade-migration.md`: this inventory and verification record.

No files deleted. No dependencies, environment variables, authentication routes/providers, MailerLite/Supabase settings or geometry constants changed. Nothing pushed/deployed.

## Validation

- `node --test tests/*.test.mjs`: **49 passed**, including existing authentication, isolated password recovery, membership and geometry regression tests.
- `npm run lint`: **passed, no warnings**.
- `npm run build`: **passed** including TypeScript and all routes. First sandboxed attempt could not fetch the existing Google font; rerunning the same build with network access passed. No source/config change was made to work around that network limitation.
- `git diff --check`: passed.
- Extraction audit against the saved pre-edit source: 13 core handler/collision functions unchanged except timeout ownership calls; **every original CSS rule/keyframe retained** across shared and arcade styles.
- Browser checks: cabinet entry from `/ship` and an existing authenticated `/` session; keyboard Enter, Exit and Escape; focus returns to cabinet. Desktop and 390×844 playfield inspection. Original 72-head band, local TV/zap and heart visible inside the arcade.
- Public view checked at separate local origin `localhost:3000` so the user's authenticated `127.0.0.1` session stayed intact. Shooting stars visible; no alien band/grey footer/game; normal `auto` browser cursor; public TV slides left/right and expands/collapses with its original video URL/start flag. TikTok iframe playback itself could not be confirmed in the test browser (embedded frame reported about:blank); no video URL/player redesign was made.
- External signup/password/email sends were not repeated. Their existing regression tests pass; authenticated cockpit entry was checked using the existing session. Camera transition code, projection and geometry files are unchanged and their tests pass.

## Manual inspection before committing

In Safari, open the cockpit cabinet and exercise the familiar game combinations, particularly moving the antenna while a skull is trapped, recatching to black skull, black-heart Wombo and Pong through a flash. Exit and verify the cockpit links/swivel. On a phone, inspect cabinet tapping and the original paddle/TV drag gestures. On the logged-out domepage, confirm shooting stars, uninterrupted lower space and actual TikTok playback. Authentication needs no configuration change for this migration.
