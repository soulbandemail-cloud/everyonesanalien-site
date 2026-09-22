# Wish / arcade separation

## Source of truth

Read `52deffb^` (`ecd91d7`), the parent of the arcade migration, for both `components/home/CanonicalHomepage.tsx` and `app/globals.css`. The restored handlers, markup, offsets, movement keyframes, validation regexes and timings come from those files, not an approximation of the temporary MAKE A WISH button.

Original behaviour:
- Eleven CSS-animated shooting stars, with the original trajectories/delays/durations and pointer-down catch targets.
- Catching a star clears previous wish feedback/Pong and opens the focused inline MAKE A WISH input. There was no permanent Wish button.
- Enter/form submission closes the input and trims/lowercases the wish.
- Ordinary wishes show ten mint stars for 900ms and define the corresponding temporary barrier.
- Forbidden wishes (killing/death/resurrection/love/additional wishes) create no barrier and show the four rules for 8000ms. The rules were never initial page content.
- `pong` creates a persistent five-star paddle. Dragging moves it horizontally with the original viewport clamp, offsets and mobile/desktop vertical positions. Catching another star resets it.
- The original swept rebound helper had a 140ms cooldown and 18px padding, reflecting crossing bodies and retaining residual horizontal travel.

**Original dependency:** there was no standalone Pong ball or independent Wish projectile simulation. Flying alien heads supplied every body passed into the Wish reflection helper. Those heads must not return to the public page. The original paddle/barrier and rebound helper are preserved under home, and the helper is tested with supplied bodies, but there is deliberately no alien or invented ball simulation on the domepage. Thus the paddle is usable, but presently has no live body to rebound. Wish fading caused by alien flashbangs is likewise no longer connected across the separated systems.

## Ownership and changed files

Modified:
- `components/home/CanonicalHomepage.tsx`: mounts DomeWishes only in public first person, below the unchanged wordmark, at the original Wish position. Removes decorative-only duplicate shooting-star markup and permanent rules box.
- `components/arcade/ArcadeGame.tsx`: removes the entire Wish state/handlers/UI, Pong/paddle/barrier/reflection call and Wish-only flash timers. Alien game and independent TV/footer collisions remain.
- `components/arcade/arcade.css`: removes Wish/Pong styles; alien, skull, UFO, tractor, zap, heart, flash/Wombo and arcade controls remain.
- `app/globals.css`: public antenna remains noninteractive; removes the shooting-star pointer-events override. Existing atmosphere trajectories/keyframes are unchanged.
- `tests/arcade.test.mjs`: keeps alien/heart/tractor/zap/cleanup coverage and asserts no Wish/Pong source or UI; verifies a new mount starts fresh. Wish assertions moved to home tests.
- `tests/canonical-homepage.test.mjs`: initial rules/input absent, public atmosphere retained, cockpit has no Wish mount, site content/auth forms/links/projection still tested.

Added (including files still uncommitted from the preceding correction):
- `components/home/DomeWishes.tsx`: original catch/input/rules/ordinary/Pong state and handlers. Scoped timeout and drag cleanup. No interval or alien runtime.
- `components/home/WishRules.tsx`: original conditional four-line presentation.
- `components/home/wishes.css`: original Wish UI/barrier/Pong styles and animations. Standard browser cursor on catchable stars.
- `components/home/wishPhysics.ts`: original reflection maths expressed as a pure body/barrier/viewport function; no owned moving entities.
- `tests/dome-wishes.test.mjs`: catch/input/conditional rules, all forbidden triggers, ordinary barrier expiry, Pong persistence/drag/reflection, stale-timeout protection and cleanup.
- `tests/helpers/interaction-harness.mjs`: shared deterministic harness executing the actual home/arcade components, avoiding a copied implementation in tests.
- `docs/wish-arcade-separation.md`: this report.

No tracked files deleted. No changes to TV hooks/positioning/player, geometry, fixtures, swivel, camera transition, authentication, provider settings or planet-heart/wordmark assets. Nothing pushed/deployed.

## Validation

- `node --test tests/*.test.mjs`: 53 passed.
- `npm run build`: passed (network access for the existing Google font).
- `git diff --check`: passed.
- Changed JS/TS files: lint passed.
- `npm run lint`: fails only on the pre-existing `react-hooks/set-state-in-effect` error at `components/home/usePortableTv.ts:87`. That hook matches the committed version and remains untouched per the explicit TV constraint.
- Desktop browser: initial public page has atmosphere and no rules/input; catching a star opens the input; forbidden input displays the original conditional rules; `pong` displays the paddle.
- Phone viewport (390×844): original five-star paddle position and horizontal dragging inspected; site atmosphere/content/TV remain.
- Arcade source and tests confirm no Wish/Pong declarations, UI, effects, collision calls or CSS remain. Alien launch, skull progression, heart outcomes, tractor captures, antenna stun/recatch, Wombo and exit cleanup pass regression tests.

Before committing, inspect the restored catch interaction in Safari and the arcade's familiar zap/black-skull combinations. A future decision is required if the public Pong paddle should have a new non-alien ball; this job does not invent one.
