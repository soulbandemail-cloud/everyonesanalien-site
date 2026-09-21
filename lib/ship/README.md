# Ship — geometry / architecture calibration

The canonical homepage now lives in `components/home/CanonicalHomepage.tsx`, shared by the public view and authenticated cockpit at `/`. `/ship` is a development-only geometry preview. See `docs/mate-entry.md` for the gated Supabase session foundation and transition. The silver public rim/head belt and locked cockpit architecture are preserved.

## Terminology

- **Cockpit view:** the entire inhabited saucer room.
- **Domepage view:** the canonical public homepage, conceptually the pilot-position viewpoint.
- **Pilot mezzanine:** the shallow platform, chair, seated alien and physical pilot controls.

The console is disabled and reserved for future spacecraft travel. It is not a view switch. Authentication chooses the view and LOG OUT ends the Mate session before the inverse transition.

## Shared physical model

`domeGeometry.ts` is independent of React. World axes are +Y up and +Z forward. Distances are arbitrary world units, latitude is radians, pitch and FOV are degrees. The hemisphere rises from the Y=0 base plane; its sphere centre is (0,0,0). The broad hull floor is Y=-0.42.

The manually tuned baseline is radius 9.30, camera (0,2.80,-7.00), pitch 0°, FOV 55°, top latitude 0.76 rad and lower latitude 0.085 rad. Both initial load and Reset baseline use these values. Positive pitch looks upward. Projection first rotates the camera-relative point into the pitched camera basis, then divides by forward depth. Camera height, pitch and UI latitude are independent controls.

`lens()` exposes the existing 52%-height optical centre and portrait framing. The side-profile cone uses the actual top and bottom ray angles, including these choices, rather than pretending the FOV slider alone describes the portrait viewport. Side-profile X is world Z; side-profile Y is world Y. Both axes use equal scale.

`roomGeometry.ts` fixes the pilot at X=0, Z=7.2 (14.2 units ahead of the baseline camera), tucked toward the front glass. The contained console is 4.8 units wide, with its radio on the left. The compact trapezium deck is 5.8 units wide at Z=8.55 behind the console and tapers to 3.5 units at the camera-facing edge. Three shallow steps start at Z=5.9 with 0.28-unit treads. Each rises 0.08 units (0.24 total); there is no traversal state. The dome and main floor retain their saved geometry.

The rejected wall chamber is removed. The floor port / tractor-beam airlock is a closed circular hatch at X=0, Z=2, exactly on the main floor plane. Its diameter is 1.25 × the provisional alien shoulder/body clearance (0.9 units), or 1.125 units. Six radial seams suggest retracting floor segments; no raised rim, glow, open hole or machinery is shown. It is comfortably clear of the forward steps.

Future intent only: retract the segments into the floor, reveal a recessed transport aperture, raise a blue-white beam, form a holographic outline, fill it with light, resolve colour/material, switch off the beam and settle one object or visiting alien on the floor. Physical SOUL purchases and visitor arrivals share this port. None of that animation or behaviour is implemented.

## Calibration

Open **Geometry** to compare the projected latitude/longitude grid with the live side profile. Controls expose dome radius, camera depth, camera height, camera pitch, field of view, upper latitude, outer saucer radius, hull drop and profile exponent. Reset restores the comparison baseline. The grid has a separate checkbox. The panel reports if calibration places the camera outside the sphere.

The profile shows the hemisphere, base and floor planes, sphere centre, camera, look ray, actual viewport cone, pilot position and side-on latitude circles. Radius changes the sphere and disc footprint; the pilot's world position remains fixed. Extreme diagnostic settings can intentionally move objects outside the viewport.

Only the upper rule is rendered as a sampled constant-latitude circle. The lower rule and the complete exterior head belt are absent from cockpit view. The saved lower-latitude value remains in geometry data for the existing content layout. Near-plane clipping omits hidden curve segments and clips room polygons. Rounded projection coordinates avoid cross-engine floating-point hydration differences.

The physical console and alien are provisional SVG billboards anchored and scaled in world space; they are not finished 3D models. HTML domepage blocks also remain readable anchored billboards, not surface-warped artwork. This pass does not redesign them.

## Validation

`node --test tests/ship-geometry.test.mjs` checks spherical membership, constant-latitude planes, the tuned baseline, perspective scale, pitched look-axis projection, actual viewport cone rays, independent height/pitch, common centreline, shallow rise, port clearance and finite near-plane clipping on desktop and portrait viewports.

Out of scope: final art, inventory, manifestation, walking, multiplayer and spacecraft travel.

The pilot controls now have a continuous opaque curved fascia down to their projected mezzanine-floor footprint; there are no legs or under-console gaps. The console anchor is Y=-0.45 (another 0.75 units lower), and the chair / alien remains raised 0.18 units, with its base remaining on the platform. The radio follows the console vertically.


## Current floor-plan blocking

`fixtureLayout.ts` places sofa, cabinet and rail against the circular perimeter using their rear-corner clearance, with 0.55 units of wall clearance. Their local fronts face radially inward and their long axes follow the local tangent. The rail is farther around the right side and nearer the camera than the cabinet, leaving them as separated neighbours. The larger cabinet retains exactly its previous compact world width while increasing height and depth. The sofa is sized for 2–3 aliens and the rail grows to alien clothing scale.

The low circular coffee table is placed 1.79 units inward of the sofa, leaving a short reachable gap. Its current Hyper-Fix lies on the tabletop and follows the surface perspective. Sofa, cabinet and rail remain on the main floor, beside the compact pilot footprint. The hatch and camera remain fixed; pilot adjustments are vertical only.

The cabinet contains only permanent shelves, a gramophone with an empty platter, and an empty sleeve support. There are no records, sleeves, clothes, hangers, plush, posters, memorabilia or purchased items, nor interactions or playback.

## Domepage and reserved glass

`domePageLayout.ts` defines angular content zones. Socials sit above the upper latitude; SOUL is anchored at that latitude. `upperRulePath()` samples the same spherical circle but skips a central longitude interval for the wordmark. The lower rule and head ring are removed.

Information and merch sit above a reserved poster band (approximately latitude 0.13–0.301 at the saved baseline). This glass is deliberately empty: no poster wall or placeholders. The content hierarchy is defined in spherical coordinates so later personal-display work has an explicit zone below website content and above the exterior hull.

Side-art faces are depth-sorted. Tabletop artwork follows its projected horizontal plane; small upright details follow the fixture's vertical plane. All remain simple 2.5D blocking.


## Exterior upper hull

`hullGeometry.ts` defines a surface of revolution outside the glass footprint, sharing its vertical axis. For normalized radial distance t from dome radius to outer rim, Y = centreY − drop × t^profile. Defaults: outer radius 14.5, drop 1.8, exponent 2. The dome radius and locked camera are unchanged. `ExteriorHull` projects sampled quads through the same camera with near-plane clipping and depth ordering. The dark inhabited floor renders separately in front of this exterior surface. The belt beneath the rim is intentionally not rendered. The side profile shows the upper surface, rim and symbolic hidden belt.


## Approved geometry lock — 21 September 2026

The dome/camera, upper hull, interior boundary, pilot deck/steps, console, raised pilot/chair, floor port and all fixture positions/scales are now locked. Change these only on explicit user instruction. Debug controls remain diagnostic; initial load and Reset baseline use DEFAULT_DOME / DEFAULT_HULL and the fixed ROOM / fixtureLayout values. No local-storage override is used.

Final calibration lowers the control surface to the seated pilot's hand area while recalculating its solid fascia to the unchanged platform floor. The radio uses the console anchor plus its existing 1.05-unit surface offset. All perimeter furniture moves inward 0.48 units with unchanged angles/scales. The table follows the sofa by the same displacement, preserving the 1.79-unit lounge spacing. No new interactions are added.
