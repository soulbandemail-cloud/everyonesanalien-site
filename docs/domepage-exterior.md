# Continuous domepage exterior and projected header

The domepage remains the content/space seen through the same cockpit dome. First person is the alien occupant's public POV; third person is the Mate camera pulled backward inside that cockpit.

## Files

Added:
- `components/home/ExteriorSpace.tsx`: persistent four-point starfield and independent celestial planet-heart.
- `components/home/exterior.css`: exterior stacking and inactive third-person shooting-star hit targets.
- `lib/ship/exteriorSpace.ts`: one distant plane and one world-space planet definition.
- `tests/exterior-space.test.mjs`: exterior continuity, parallax, ring ordering and dome patch tests.
- `docs/domepage-exterior.md`: this report.

Changed:
- `components/home/CanonicalHomepage.tsx`: mounts the shared exterior and persistent shooting-star/Wish component; passes the live camera; separates U/L for individual projection; adds social accessible labels.
- `components/home/DomeWishes.tsx`: accepts exterior projection and an interaction flag. Stars remain mounted in both views; catching and Wish UI remain first-person-only. Wish validation/Pong/barrier code is unchanged.
- `components/home/useDomeProjection.ts`: projects individual letters, the original logo O, the caption and social links; keeps existing information-panel transition separate from per-frame header projection.
- `components/mate/MateExperience.tsx`: passes its existing interpolated camera/progress to the canonical domepage. No authentication or transition algorithm changes.
- `components/mate/mate.css`: removes the small mobile clipping window so it cannot clip the shared exterior; maintains readable information panels below the projected header.
- `components/ship/Ship.tsx`: removes the old static star layer.
- `components/ship/ship.module.css`: removes that layer's styling.
- `lib/ship/domePageLayout.ts`: adds a reusable spherical surface-patch sampling function.
- `tests/canonical-homepage.test.mjs`: verifies the updated shared atmosphere contract and existing canonical links/Wish visibility.

## Exterior continuity

The old third-person approximation was 75 tiny static elements with arithmetic percentage positions and glow. It is removed. Both views now show the original `.stars` implementation: the same five four-point stars plus two pseudo-element stars, with the existing distributions, glows and twinkle animations.

The exterior component and the eleven existing shooting-star elements stay mounted when the mode changes. No mode-dependent keys, random reseeding, replacement backgrounds or concealment flashes are used. CSS animation timelines keep running. The original shooting-star trajectories, timing and hit targets remain; third person disables catching and hides Wish UI, while first person retains ordinary/forbidden/Pong wishes and conditional rules.

A distant plane at 10,000 world units uses the existing lens, world projection and interpolated camera. Its first-person projection matches the existing star arrangement. Cockpit-scale camera translation causes a tiny, continuous shift rather than a background swap. The existing camera pullback duration and endpoints are unchanged.

## Real planet-heart

`PLANET_HEART` defines one world position (0, 500, 10000) and radius 1300. Both views project that same object through `project()` using the same live camera as the ship. Tests measure less than one pixel of parallax and less than 0.2% scale change across the cockpit pullback at desktop/mobile sizes.

The provisional SVG has a shaded opaque heart body, a rear ring arc painted before the body and a front ring arc painted afterward. The ring tilt belongs to the celestial object's presentation, not to dome/header projection. There are no textures or continents. Its styling is deliberately replaceable.

The original minimalist `PlanetHeart` asset is unchanged and still occupies the O in SOUL. The celestial planet is a separate, noninteractive world object.

## Occlusion and header

Exterior content sits inside the canonical domepage stacking context, below the ship's existing higher stacking context. Existing opaque hull, floor, console, alien and furniture silhouettes cover it; transparent glass exposes it. The removed mobile clipping box no longer imposes an artificial rectangular boundary on the universe.

The header retains the canonical live DOM. Each S/O/U/L element and each individual social link receives its own three-point spherical surface patch from `domePoint()`. The resulting local affine matrix represents the actual dome slopes/perspective at that location. This is a piecewise surface approximation, not a single flat rotated header. Each patch remains a live accessible DOM element with its original SVG asset and link target.

“A band called...” is included above SOUL with a separate sampled patch for every character. Its angular width is 0.52 radians, slightly smaller than the original 0.6-radian caption. Social icons sit at the brand latitude plus 0.24 radians to provide more clearance; their projection responds to the higher dome curvature. Header patches blend from the unchanged first-person layout using the existing camera progress. The upper rule retains its existing spherical latitude/gap. No screenshot, canvas copy, content clone or duplicate link tree was introduced.

On small screens, information panels are kept within the viewport below the header; the camera and physical fixtures are not moved.

## Validation

- `node --test tests/*.test.mjs`: 72 passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Existing Wish, PortableTV, arcade, authentication and locked camera/geometry regression tests pass.
- No changes to arcade files, PortableTV/hook, original PlanetHeart asset, authentication services/routes, cameraTransition, domeGeometry or roomGeometry.
- Inspected first-person and third-person in the local browser, including a 390×844 mobile viewport. Exercised the existing authenticated camera-entry route. Confirmed visible four-point stars, shooting stars, the separate planet, live social labels, caption projection and ship layering. Temporary viewport override was reset.

A final human review of transition pacing, small-screen text size and the provisional planet's placement/style is still recommended. The browser checks were visual endpoint/entry inspections, not a recorded frame-by-frame transition analysis. No push or deployment was performed.

## Planet placement follow-up

The real planet radius is doubled and its single fixed world position is centred/raised to (0, 500, 10000). The attempted compact first-person layout was rejected and removed: original header spacing, full-size minimalist logo, stacked form fields and mobile content order are restored. Third-person planet placement remains unchanged. With the original first-person layout restored, an expanded login panel can occupy the planet's screen area; the earlier below-form clearance result no longer applies.

The subsequent instruction explicitly allows a first-person-only placement adjustment. The planet now measures the public TV handle and aligns its centre to that height. A presentation offset blends out with the existing camera progress, retaining the approved third-person world projection. The TV component and positioning hook are unchanged. Original first-person typography, logo proportions and form layout remain restored.

Latest placement correction: first-person planet is now anchored 12px below the SIGN UP / LOG IN row (using the full SVG bounds), replacing TV-handle alignment. Third-person placement remains unchanged.

Login-mode refinement: first-person placement also measures ENTER and lifts the planet as needed to leave 12px between its full SVG bounds and that button. Third person is unaffected.

Final spacing refinement: in login mode the planet centre is halfway between the bottom of SIGN UP / LOG IN and the top of ENTER. This balances the visible artwork's clearance instead of using the larger SVG padding box, which had pushed the artwork into the selector row.

The final first-person anchor is fixed 60px below the selector row. Selecting SIGN UP or LOG IN no longer changes planet position; third-person projection is unchanged.

Fixed celestial framing supersedes content anchoring: first-person centre is at 60% of viewport height; third person retains its approved world projection. No DOM observers, form measurements or TV measurements remain. Camera progress only interpolates between these two view placements.
