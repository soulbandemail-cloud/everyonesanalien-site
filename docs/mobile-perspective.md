## Updated orientation behaviour

The rotate-screen gate and orientation-lock request have been removed. On a portrait phone, the single live scene swivels clockwise with the existing entry progress into a landscape drawing area. Turning the phone to landscape removes that rotation automatically; the scene does not remain sideways. First person stays in the device’s natural orientation. Reduced motion follows the existing instant transition setting.

The projection hook measures in the scene’s local coordinate space. Pointer attention is converted back into those same coordinates. No duplicated scene or arcade changes are required. Real iPhone Safari rotation and address-bar behaviour still need device testing.

The historical report below describes the earlier camera/layout pass; its rotation-gate details are superseded by this update.

# Mobile perspective pass

Implemented locally; nothing pushed or deployed.

## Orientation and viewport

Touch/coarse-pointer phone-sized viewports require portrait for public first person and landscape for Mate third person. Desktop receives no gate. The browser orientation lock is attempted where available; absence/rejection is harmless. A SOUL rotation prompt hides and makes the scene inert until orientation matches, then reveals the same mounted scene without reloading.

Drawing dimensions follow `visualViewport`, falling back to the window dimensions. Resize, orientation, viewport scroll and pointer-capability events are observed and cleaned up. Device orientation, when available, prevents the keyboard's reduced viewport height from being mistaken for physical rotation.

Development-only `/ship?mobile=1` allows testing this mode without touch emulation; adding `&view=first` shows the public perspective. The existing production redirect remains in place.

## Camera and content

Only mobile landscape third person receives the fitted physical camera. Camera XYZ remains unchanged. The existing sofa's transformed world-space bounding corners determine a left margin of `max(8px, 1.5% of viewport width)`. A downward pitch is used only when necessary to keep its feet at least 8px above the bottom. No fixtures were moved or resized in world space.

| Usable viewport | Previous FOV / pitch | New FOV | New pitch | Sofa left margin |
| --- | --- | --- | --- | --- |
| 844 × 290 | 55° / 0° | 32.424° | −4.397° | 12.66px |
| 667 × 300 | 55° / 0° | 42.111° | approximately 0° | 10.005px |
| 915 × 360 | 55° / 0° | 37.008° | −2.100° | 13.725px |
| 812 × 250 | 55° / 0° | 29.129° | −6.031° | 12.18px |

The dome/content projection retains its original lens separately from the physical-room lens, preserving final SOUL/social/caption positions and the upper glowing curve. The existing transition was not reworked. Exterior-space code and planet styling are unchanged.

Shows longitude changes from −0.67 to −0.98 radians; Merch from +0.67 to +0.98. Both complete groups change from scale 0.78 to 0.60 (about 23% smaller), retaining their existing latitude, internal proportions, content and links. Existing narrow-screen edge clamping remains. This applies only to mobile landscape third person. The ticket link was confirmed to receive pointer hits in the preview.

## Hull/floor seam

The original hull inner perimeter was at Y=0 while the floor perimeter was at Y=−0.42. They also used different circular subdivisions: 128 versus 96. Their independently projected edges therefore diverged.

In mobile landscape third person, both now consume the same 128-point circle at the actual floor height. The hull surface meets that edge and interpolates back to its original outer rim. Both surfaces use the same camera and clipping/projection functions. No patch polygon, thicker band or masking cover was added. Desktop retains its original geometry path, as requested.

## Files changed in this pass

- `app/ship/page.tsx`: development-only mobile/first-person preview options.
- `components/mate/usePresentationViewport.ts` (new): usable viewport and orientation observation.
- `components/mate/MateExperience.tsx`: orientation gate and separate mobile physical camera selection.
- `components/mate/mate.css`: minimal rotation prompt styling.
- `lib/ship/mobilePresentation.ts` (new): capability/orientation helpers, sofa bounds, camera fit and side-content settings.
- `components/home/CanonicalHomepage.tsx`: forwards mobile third-person presentation mode.
- `components/home/useDomeProjection.ts`: applies complete side-group longitude/scale changes.
- `lib/ship/hullFloorSeam.ts` (new): shared circular boundary.
- `lib/ship/hullGeometry.ts`: mobile hull inner-edge geometry.
- `components/ship/CockpitFloor.tsx`: consumes the shared floor boundary.
- `components/ship/ExteriorHull.tsx`: selects the shared hull mesh.
- `components/ship/Ship.tsx`: separate dome camera, shared seam and usable mobile drawing bounds.
- `tests/mobile-presentation.test.mjs` (new): eight orientation, lifecycle, camera, content and seam tests.
- `tests/canonical-homepage.test.mjs`: supplies the new projection dependency to the existing harness.
- `docs/mobile-perspective.md`: this report.

Unrelated working-tree changes in `components/arcade/ArcadeGame.tsx` and `components/arcade/arcade.css` were not made or modified by this pass.

## Validation

- `node --test tests/*.test.mjs`: **80 passed**, zero failures/skips.
- `npm run lint`: passed, no warnings/errors.
- `npm run build`: passed, including TypeScript and prerendering.
- `git diff --check`: passed.

Browser previews inspected: portrait 390×700, short landscape 844×290, smaller landscape 667×300 and wide landscape 915×360. The landscape sofa stayed fully visible near the left edge and the hull/floor corners joined continuously. Both rotation prompts and automatic recovery after resizing were checked. A narrow desktop remained ungated. Portrait TV appeared bottom-right and dragging its handle moved it bottom-left.

Desktop camera/layout and mobile first-person content layout retain their existing branches; first-person orientation handling is the intended addition. Authentication, Wish mechanics, TV mechanics, arcade gameplay, fixture placements, exterior styling and destinations were not edited in this pass. Existing regression coverage remains intact.

Real iPhone Safari testing is still required for actual address-bar expansion/collapse, keyboard behaviour, safe-area presentation, rotation-lock restrictions, and authenticated entry/logout while rotating. Browser viewport previews and mocked API rejection cover the fallback logic but are not a real Safari device test. No reference screenshot was present in the supplied attachment directory, so the short landscape dimensions above were used as representative usable viewports.
