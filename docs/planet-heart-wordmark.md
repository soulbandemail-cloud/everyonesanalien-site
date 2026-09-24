# Domepage planet-heart wordmark

The final layout follows the latest correction: the midpoint of the visible outer edges of **S and L** is centred. The planet is not independently centred. Both rule endpoints follow this centred wordmark with equal breathing room.

## Rendering and geometry

- The existing real planet artwork was extracted from `ExteriorSpace` into one `RealPlanetHeart` component inside the live SOUL heading. Its original mint radial shading and heart curves are retained. The rear ring, opaque heart and front ring retain their paint order.
- Both diagonal ring halves now have white strokes and the lettering's pink glow colour, blur radii and opacity values. The heart itself is not given the pink filter.
- The old independent planet placement and first-person vertical-offset helpers were removed. Exactly one real planet renders in each domepage perspective. The arcade's separate minimalist `PlanetHeart` is unchanged.
- The complete planet is uniformly sized to the letters' visible ink height. Its SVG view box derives from the stroked rotated ellipse and the heart's Bézier extrema, eliminating transparent padding from spacing calculations.
- One spacing unit, `X = 0.26 × font size`, controls S→ring, ring→U and U→L. The browser measures the actual rendered font's ink contour at quarter-CSS-pixel resolution, caches its convex hull and invalidates it after font loading. This canvas is measurement-only: the visible letters remain the original live text, never raster images, cloned text or screenshots.
- The projection solver uses the visible glyph contours and the analytic transformed ellipse support bounds. All three projected horizontal gaps share the same X, scaled through the transition. A final shared translation centres the S-to-L visible extent without changing the gaps.
- The same rule SVG follows the wordmark in both views. First-person rules are horizontal; the third-person rules use the existing upper spherical latitude. Their inner endpoints derive from S/L ink bounds plus X. The old separately rendered rule in `Dome` was removed to avoid a duplicate.
- Font size remains responsive; the header row retains its previous 96px height so the content below is not displaced. A normal flex layout provides a non-overlapping first-load fallback before ink measurement.

## Projection support and transition

`domeSurfaceFrame`, `caption` and `captionWidth` were already present in the on-disk geometry module. The current module also supplies `wordmarkHalfWidth` and the measured-edge rule helper. Fresh TypeScript checks and the production build have no unresolved projection imports/properties; the earlier reported editor diagnostics could not be reproduced from disk.

A real transition defect was found during preview: the moving physical camera starts near/behind the projected header surface, so using that camera directly could send header elements offscreen. The live header now blends its first-person layout into the final dome surface frame using the existing transition progress. The physical cockpit camera remains unchanged. Social-link colour transitions are retained, but competing CSS transform transitions are excluded from the geometric animation and measurement.

`/ship?motion=1` is a development-only replay of the existing entry animation; the route still redirects in production. No authentication behaviour was changed.

## Files touched by this wordmark work

- `app/ship/page.tsx`
- `components/home/CanonicalHomepage.tsx`
- `components/home/ExteriorSpace.tsx`
- `components/home/RealPlanetHeart.tsx` (new)
- `components/home/exterior.css`
- `components/home/useDomeProjection.ts`
- `components/home/measureWordmarkInk.ts` (new)
- `components/ship/Dome.tsx`
- `lib/ship/domePageLayout.ts`
- `lib/ship/exteriorSpace.ts`
- `lib/ship/wordmarkGeometry.ts` (new)
- `tests/canonical-homepage.test.mjs`
- `tests/exterior-space.test.mjs`
- `tests/wordmark-geometry.test.mjs` (new)
- This report.

The existing mobile camera/FOV, orientation gating, Shows/Merch tuning, hull/floor seam, opaque buttons, TV, Wishes, stars and authentication code were preserved. The arcade retains the user's 1000ms zap and both 1000ms skull-blackening animations; no arcade files or minimalist-logo files were edited by this wordmark pass.

## Verification

The tests cover one rendered planet, retained arcade separation, analytic ring extents, proportional planet height, equal projected gaps, S-to-L centring, equal rule clearance, finite/on-screen geometry across desktop/mobile dimensions, and forward/reverse transition samples. Tests for the now-removed separately positioned planet were replaced with tests for its new wordmark role; unrelated regression tests remain intact.

Desktop first-person, third-person and entry-animation previews were inspected. Mobile portrait and short landscape previews were inspected during the spacing work. The later browser viewport override stopped applying reliably, so the final centring correction is additionally covered by geometry tests at 320×568, 390×700, 667×300, 844×290 and 915×360; final physical-device inspection is still recommended.

Real iPhone/Safari testing remains for final visual centring, font rasterisation/glow, orientation changes and authenticated entry/logout. Numeric gap equality concerns the painted ink/stroke geometry; antialiasing and soft glow have no single hard outer edge.

Nothing pushed or deployed.

Final validation: **82 tests passed**, zero failures/skips; lint passed without warnings; fresh TypeScript check passed; production build passed; `git diff --check` passed.
