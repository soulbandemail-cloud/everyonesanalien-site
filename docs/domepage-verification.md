# Historical inspection record

The configuration observations below describe the earlier inspection, not the current environment. Mate membership provisioning now follows `docs/mate-entry.md`; manual Supabase account creation is no longer required.

# Domepage / Mate verification — 22 September 2026

## What is shared

The repository's sole canonical homepage implementation is `components/home/CanonicalHomepage.tsx`. `app/page.tsx` obtains verified session state and renders `MateExperience`, which always renders that component. `app/ship/page.tsx` renders the same `MateExperience` in development-preview mode. `Ship.tsx` only draws room geometry/utility controls; it has no separate homepage content.

`useDomeProjection.ts` changes placement of existing live DOM elements. It does not copy text or links. The obsolete `components/ship/DomePage.tsx` is already absent; no further duplicate implementation needed removal. A regression test now renders both modes and compares all headings and links, checks the same signup form, and verifies no head belt in cockpit view.

The cockpit-only “SOUL VIDEO” button is a presentation affordance in the canonical component: it opens the same television/video markup in a dialog because the floating public TV is not placed over the room. It is not evidence of a second source of media content.

## What the public site actually served during this inspection

Opening `https://everyonesanalien.com` redirected to `https://www.everyonesanalien.com/`. Its rendered DOM contained:

- GET YOUR THE HYPER-FIX
- Sign up to SOUL's newsletter for Mates Rate discounts on merch and tickets!
- EVERYONE'S AN ALIEN, the email field and BECOME A MATE
- UPCOMING SHOWS
- The George Tavern, LONDON, 5th Oct, linked to `https://link.dice.fm/w4a23940adca`
- MERCH / Coming soon

Those headings and the show link match the checked-out canonical component. This is observation of the currently served public site, not proof of which commit or hosting deployment produced it. No hosting/deployment history or the user's specific old preview URL was supplied. Consequently, this inspection cannot establish that the old preview was stale, or identify another intended newer homepage. No content was recreated from appearance and no homepage redesign was made. If another approved deployment/branch is intended, compare it directly before replacing content.

## Signup diagnosis

There are no `.env*` files in this checkout, and `MAILERLITE_API_TOKEN` is absent after loading the local Next environment. The previous handler would send `Bearer undefined`, map the upstream rejection to an error, and the UI would show “Mating failed, please try again.” Thus this checkout was unable to submit any email successfully, irrespective of whether it was already subscribed.

That explains the local configuration failure, but it does not prove the exact cause of a historical preview request: its environment and response logs were not available. No real newsletter subscription was submitted during this inspection.

MailerLite documents `POST /api/subscribers` as an upsert: **200** for an existing subscriber, **201** for a new subscriber. The app already distinguishes these correctly and displays “You're already a Mate, mate.” Existing-subscriber handling was not replaced. Tests cover 200, 201, missing configuration and genuine provider rejections.

Source: https://developers.mailerlite.com/api/subscribers#createupsert-subscriber

## Remaining real-test prerequisites

Neither Supabase URL/key nor Mate auth flags/origin are configured locally. A real project, working email delivery, exact callback allowlist and approved confirmed Mate account (`app_metadata.mate=true`) are needed. `docs/mate-entry.md` and `/dev/mate` describe both local and safely gated hosted-preview setup. No database migration is required. The public login flag remains off; nothing was deployed.

Cockpit geometry, camera, furniture, seated pilot, console, existing swivel code, hatch and debug controls were untouched in this pass. Login/logout transitions and their reduced-motion/interruption handling were also untouched.
