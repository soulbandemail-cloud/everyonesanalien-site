# Arcade orbit charge and electrical discharge

This task changes only the arcade and its tests. Earlier uncommitted domepage/Wish changes remain as they were at the start of this task. A SHA-256 comparison confirmed no new changes to public/home, shared styles, geometry, fixtures, authentication or other library files.

## Files for this task

Modified:
- `components/arcade/ArcadeGame.tsx`
- `components/arcade/arcade.css`
- `tests/arcade.test.mjs`
- `tests/helpers/interaction-harness.mjs`

Added:
- `components/arcade/discharge.ts`
- `components/arcade/useOrbitDischarge.ts`
- `tests/arcade-discharge.test.mjs`
- `docs/orbit-discharge.md`

No files deleted; nothing pushed/deployed.

## Removed arcade TV

Removed the complete local TV markup (including TikTok iframe), body/screen/handle/antennae, positioning/drag hook use, TV refs/state/listeners, antenna spark activation, body collision/reflection and TV-specific spark CSS. The shared public PortableTV, its positioning hook, player and CSS are unchanged. The arcade's independent bottom-band bounce remains.

## Charging and overload — latest correction applied

The existing CSS UFO orbit still controls movement. Each update reads the orbiting SVG's rendered centre relative to the heart anchor and normalizes it against the existing ellipse (radii 40/21, centre 56/48). `atan2` yields orbital phase. The CSS animation's completed-iteration count supplies complete turns, including across slow frames. No independent fixed-seconds charging timer is used.

`charge gained = angular movement / (5 × 2π)`

Thus one revolution supplies 20 percentage points; a quarter revolution supplies 5 points; five revolutions from empty reach the overload threshold. Charge stays unchanged while not orbiting and survives ordinary orbit exits.

At the threshold, energy resets to **zero** and the callback immediately clears both the orbit ref and orbit state. It calls the same `triggerFlashbang(..., "black")` as black-skull/heart impact. It does not award Wombo. The completed orbit identity is latched so it cannot overload repeatedly; deliberately restarting orbit creates the next charging cycle. Charge is not retained at full, per the user's correction.

## Drawing and energy

Pointer down on empty playfield with positive charge establishes A. Dragging supplies the desired endpoint. Controls, heart, heads, band and HUD are excluded. Primary mouse/touch/pen pointer events are supported; capture keeps the gesture coherent until up/cancel/blur/exit. Existing UFO and tractor controls remain in place, alongside the new empty-playfield gesture; the browser cursor remains normal.

Head width is measured from a rendered band head (same `w-8` gameplay size as a flying head), rather than treating a fixed desktop pixel length as capacity. It is frozen per stroke so resizing cannot change a stroke's energy cost.

`line capacity = charge fraction × 32 × rendered head width`

`charge spent = newly extended line length / (32 × rendered head width)`

25% therefore buys eight head widths; one width spends 3.125 percentage points. The theoretical 100% capacity is thirty-two widths, although reaching full by orbit now overloads immediately. A zero-length press spends nothing. Charge never goes negative.

Length means the actual polyline's total segment length, including zigzags. The endpoint's straight-line distance is slightly shorter than the total electrical line. The nine-point alternating zigzag mirrors every 60ms and uses a short opacity flicker adapted from the old spark/glow language. Mirroring preserves total length and both endpoints, so visual crackling never costs extra energy.

A held bolt spends charge on extension and drains an additional 75 percentage points per second while visible. Orbit generation is suspended during the stroke (the orbit itself continues); those revolutions are not banked. At depletion the bolt disappears after 120ms and releases pointer capture. Recharging can resume, but holding/moving the pointer cannot start another bolt: a fresh press is required. Shortening does not refund charge. The doubled length allowance remains unchanged.

## Collisions and skull progression

The physics loop tests the alien centre's entire swept movement against every segment of the exact live zigzag used for rendering. Segment intersections and nearest-point distance tests use half the measured head width plus half the visible bolt stroke margin. This catches middle-of-line contacts and fast crossings, not just endpoint hits.

A hit places the head at the contact point and freezes it there for the existing 3000ms stun. It no longer follows an antenna or the moving line. Original white-skull/blackening transitions, 700ms recatch cooldown and mandatory exit protection remain. Retained velocity resumes after stun. Planet-heart outcomes, black-skull Wombo, pulse/flash durations and tractor capture/counters remain unchanged.

Release/cancel/lost capture/blur removes the live bolt without refunding spent energy. Exit clears its RAF, native listeners, pointer capture and transient path; the existing game cleanup handles physics/timers. Reopening starts at zero charge with no bolt.

## Validation

- `node --test tests/*.test.mjs`: **61 passed**.
- `npm run build`: **passed**, including TypeScript and all routes.
- `git diff --check`: **passed**.
- Changed JS/TS files: targeted lint passed.
- Full `npm run lint`: still fails only on the pre-existing `react-hooks/set-state-in-effect` error at `components/home/usePortableTv.ts:87`; this explicitly out-of-scope hook remains untouched.
- Regression tests retain public TV two-position movement, domepage Wish, authentication and ship geometry coverage. New tests cover angular accumulation, overload/reset/restart, length/consumption, stable jitter, held-stroke generation lockout, timed depletion/dissipation, swept path collision, skull progression, protected UI targets, release/cancel/exit cleanup and fresh start.

## Manual gameplay inspection remaining

Browser inspection was blocked by automatic approval review because its usage limit was reached. No browser action ran and no workaround was attempted.

In Safari, enter the arcade and click the planet-heart to orbit. Check smooth meter growth; stop/restart orbit before full to check stored charge retention. Drag on empty playfield at partial charge, including across the middle of a moving head, and release. Allow a fresh empty cycle to reach five turns: expect the existing blackout, zero charge and stopped orbit, with no automatic restart. Verify white-to-black stun progression, black-skull/heart Wombo, touch dragging, and exit/reopen. Public domepage/Wish/TV behavior requires no configuration change.
