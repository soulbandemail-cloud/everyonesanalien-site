# Mate entry V1 — gated implementation

## Configuration and real accounts

The app uses Supabase Auth email magic links with PKCE, via official `@supabase/ssr` / `@supabase/supabase-js`. All auth calls are server-side. Session cookies are HttpOnly, SameSite=Lax and Secure on HTTPS; no auth tokens or service-role keys are shipped to the browser. `getUser()` verifies identity and reads current admin-controlled membership. Browser state alone cannot grant a session.

Copy the variable names from `docs/mate.env.example` into your environment. `MATE_AUTH_ENABLED=true` enables configured development entry. Production additionally requires `MATE_PUBLIC_LOGIN_ENABLED=true`. Both default off. `MATE_APP_ORIGIN` is the exact origin without a trailing slash; production requires HTTPS. It is the fixed callback destination and CSRF origin allowlist. Use the project's publishable key, never a service-role key.

Before real testing:

1. Create/configure a Supabase project with email auth and SMTP. Set Site URL to the app origin and allow the exact `<origin>/auth/callback` redirect. Keep the standard magic-link email template using `{{ .ConfirmationURL }}` so the provider completes verification and returns a PKCE code. Links must open in the browser that requested them.
2. Disable open user signup. Provision existing Mate accounts deliberately through admin tools. Give confirmed, approved accounts **app_metadata** `{ "mate": true }`. User-editable `user_metadata` does not grant access. Configure provider email rate limits and abuse protection before public rollout.
3. No application database tables or migrations are required for this pass. Supabase manages the auth users/sessions. Newsletter subscribers are NOT automatically auth accounts. The existing MailerLite signup/API remain separate; no subscriber import or duplicate signup was introduced.
4. Test a real approved account: delivery, same-browser link, expired/reused/wrong-browser link, non-Mate rejection, session refresh/revocation, logout, private cookies and mobile/reduced-motion behavior on the intended HTTPS domain. Only then consider enabling the separate public flag.

No real Supabase project or email delivery is configured by this change. Local end-to-end checks use a temporary simulated provider outside the repository. That fixture is not an authentication option in the app and is not deployed. Real-provider acceptance is still required.

## Canonical content and viewpoint

`components/home/CanonicalHomepage.tsx` is the only homepage content/game implementation, extracted from `app/page.tsx`. The latter is now a server entry that supplies verified session state. Links, branding, newsletter form, signup response states, existing TV and public game code remain in the canonical component. There is no `DomePage` copy or screenshot.

`useDomeProjection` places the same live DOM content groups on the glass. Desktop uses the locked angular layout; small screens use a scrollable glass content area so links/forms remain readable. The flying-head belt and its gameplay effects are only mounted/running in the settled public view. Room objects have no new click behavior. The console is disabled and reserved for future travel.

`MateExperience` owns presentation state at `/`. Verified login changes the target view; a callback returns to `/?mate_entry=1` then cleans the URL. The actual DOM animates between public layout and glass anchors, while the room camera interpolates from the raised pilot eye backward/upward to the exact saved camera over 1.8 seconds. No second homepage is loaded for the reveal. An already signed-in reload opens the cockpit directly. Logout revokes the current session and clears its cookies BEFORE starting the inverse movement; animation completion never decides identity. Failures retain a retryable logout button rather than falsely reporting success.

Reduced motion, background tabs and resize snap the camera/DOM animations to their authoritative target. Focus, pageshow, visibility, a 60-second check and cross-tab notifications revalidate the server session. Transient session-check failures show a message without inventing a new auth state. No protected user data is loaded in this pass; future data/object endpoints must independently verify Mate access.

## Development / production isolation

`/ship` remains a clearly labelled development-only geometry preview with no Mate session. In production it redirects to `/` and cannot bypass authentication. Geometry controls render only in development. The ordinary Mate flow has LOG OUT and no view toggle. The auth API and callback are also gated server-side, not merely hidden with CSS.

## Validation

`node --test tests/mate-auth.test.mjs tests/ship-geometry.test.mjs` checks flag/identity decisions, CSRF rejection, account-enumeration behavior, no automatic signup, logout failures, session outages, camera endpoints and locked geometry. TypeScript, lint and production build cover the integration. Browser checks exercise the actual canonical homepage, local PKCE/session flow, logout and absence of cockpit head elements. No production emails or newsletter submissions are used during testing.

## Files for this pass

- `app/page.tsx`: verified session-aware canonical entry.
- `app/ship/page.tsx`: development preview only; production redirect.
- `components/home/CanonicalHomepage.tsx`: extracted real homepage, live forms/links/media, public-only head game, Mate entry control.
- `components/home/useDomeProjection.ts`: live DOM projection and reversible layout animation.
- `components/mate/MateExperience.tsx`, `MateLogin.tsx`, `mate.css`: session-aware UI, login dialog, transition coordinator, mobile glass and account messages.
- `components/ship/Ship.tsx`, `PilotMezzanine.tsx`, `ship.module.css`: room overlay, development-only debugging, logout and travel-reserved console. Removed the duplicated `components/ship/DomePage.tsx`.
- `lib/ship/cameraTransition.ts`: raised pilot-eye start and exact locked camera endpoint.
- `lib/mate/config.ts`, `server.ts`, `proxy.ts`: server gates, verified membership and cookie sessions/refresh.
- `app/api/mate/login/route.ts`, `session/route.ts`, `logout/route.ts`, `app/auth/callback/route.ts`: auth endpoints.
- `package.json`, `package-lock.json`: official Supabase dependencies.
- `tests/mate-auth.test.mjs`, `tests/ship-geometry.test.mjs`: auth/fallback/camera regression checks.
- `docs/mate-entry.md`, `docs/mate.env.example`, `lib/ship/README.md`: setup, lock and implementation notes.

The existing uncommitted final-calibration changes remain intact. Dome radius, camera endpoint, hull profile, room dimensions and fixture placements were not changed by the authentication pass. `app/api/subscribe/route.ts` is unchanged.
