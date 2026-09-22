# MATES password authentication

## Membership and sessions

MailerLite is the membership source. An eligible Mate is an active subscriber in group `189432463968175126`. Only server-side code checks membership and provisions Supabase users with `app_metadata.mate=true`. Missing, unconfirmed, unsubscribed, bounced, junk and wrong-group records cannot be provisioned by these entry points. Signup retains MailerLite's non-destructive upsert and does not force consent or subscription status.

Supabase supplies identity and sessions. Cockpit access requires `getUser()` verification, a confirmed email and admin-controlled Mate metadata. Browser-editable user metadata never grants access. Existing sessions do not call MailerLite; ongoing revocation/synchronisation remains deferred. Protected data endpoints must independently use `currentMate()`.

## SIGN UP, LOG IN and RESET PASSWORD

- **SIGN UP:** `/api/subscribe` saves MailerLite membership, then `requestMateRecovery()` rechecks eligibility, provisions an unconfirmed Supabase account if necessary, and sends a recovery email. Existing accounts and metadata are preserved. Success does not create a cockpit session. Email/provisioning failure after successful signup retains the subscription and offers retry through RESET PASSWORD. Inactive/pending memberships must complete MailerLite confirmation or reactivation first. Newsletter-only mode still works with the authentication gate off.
- **LOG IN:** `/api/mate/login` calls `signInWithPassword` with email/password and requires confirmed Mate identity. A random Supabase account cannot enter. Incorrect credentials and non-Mates get the same response; any non-Mate session created during authentication is signed out. No login email is sent. A legacy MailerLite-only Mate first uses LOG IN → RESET PASSWORD to provision their account and establish a password.
- **RESET PASSWORD:** `/api/mate/recovery` checks membership and provisions if needed, without subscribing anyone, then requests the recovery email. It uses a generic public response for eligible/ineligible addresses and provider failures. Open the link in the requesting browser. It reaches `/auth/reset-password?code=...` (the SDK may also add `sb_flow_id`). The page POSTs the code to `/api/mate/recovery/session` once, including under React Strict Mode. That route performs the only exchange and requires a recovery flow and verified Mate identity. It returns readiness, never a redirect or cockpit session. The page removes the code from its URL and shows PASSWORD and CONFIRM PASSWORD; refreshing resumes the isolated recovery session.
- **Save password:** `/api/mate/password` validates origin, matching passwords, length and the verified recovery identity before calling `updateUser`. Only after a successful update does it sign in using the new password to establish the ordinary session. Only a successful response navigates to `/?mate_entry=1`, triggering the existing cockpit transition. Update failure stays on the form. If saving succeeds but subsequent login fails, the message tells the user to use normal LOG IN.

## Recovery defect and repair

The previous browser client used the same `eaa-mate` cookie namespace as cockpit login. As soon as recovery exchanged a code, `currentMate()` could accept it as normal cockpit identity, and the homepage's focus/pageshow/poll session checks could activate the cockpit before password saving. The browser writer also conflicted with the server's HttpOnly cookie handling.

Separately, `createBrowserClient` defaults to automatic URL-code exchange, while the reset page explicitly exchanged the same single-use code. Client initialisation could therefore consume the code before the explicit call; Strict Mode added another repeated-effect risk. The form's readiness depended on that explicit call succeeding.

There was **no pre-submit redirect to `/` in the checked-in reset page**. Its only such navigation was in the successful submit handler. The proxy only matches `/` and `/ship`, refreshes cookies and does not redirect; MateExperience is not mounted on the reset page. These code defects explain premature cockpit eligibility and a missing form, but the exact navigation observed in the earlier Safari session was not captured in a browser trace. Do not claim that a nonexistent middleware redirect caused it.

Recovery is now entirely server-side, using separate `eaa-mate-recovery` HttpOnly cookies with a one-hour browser lifetime. Normal access reads only `eaa-mate`. An ordinary previously authenticated session remains independent. The unused browser Supabase client and old modal login component were removed; no browser SDK is instantiated to race the exchange. Recovery cookies are cleared after completion and on logout. Passwords/tokens are never logged or returned in API responses.

## Configuration

See `docs/mate.env.example`. Required server configuration: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MAILERLITE_API_TOKEN`, and exact `MATE_APP_ORIGIN` without trailing slash. No browser Supabase environment variables are required. Never prefix server secrets with NEXT_PUBLIC_. Admin client persistence is disabled; session and recovery cookies are HttpOnly, SameSite=Lax and Secure on HTTPS.

Development entry requires `MATE_AUTH_ENABLED=true`. Vercel Preview also requires `MATE_PREVIEW_LOGIN_ENABLED=true` and cannot enable the production hostname. Production requires `MATE_PUBLIC_LOGIN_ENABLED=true`. `npm run mate:check` and `/dev/mate` report only configuration presence, not secret values. Missing provisioning credentials do not disable existing sessions.

Supabase must allow the exact `<MATE_APP_ORIGIN>/auth/reset-password` redirect. Configure the **Reset Password** email template with `{{ .ConfirmationURL }}` so Supabase verifies the token before returning the PKCE code. Email delivery must be configured. No magic-link signup setting change is required by this recovery-based implementation. Dashboard settings, environment values and deployment flags are not changed by this pass. Previously requested browser-based reset links should be replaced with a fresh request because their verifier used the old cookie namespace.

Configure hosting/provider request and email rate limits before public launch. Origin checks do not replace rate limiting. Paginated admin user lookup avoids a migration; an indexed lookup can replace it at larger scale.

Provider references: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail and https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession .

## Layout and validation

The canonical live DOM shows UPCOMING SHOWS | MATES | MERCH publicly. SIGN UP and LOG IN remain inline mode selectors; no modal login exists. In cockpit mode the entire MATES component unmounts, including title/text/forms. SHOWS retains the left grid column and negative glass longitude; MERCH retains the right column and positive longitude. The centre stays empty. No copied DOM, screenshots or geometry changes are involved.

Run `npm run lint`, `npm run build`, `npm run mate:check`, `node --test tests/*.test.mjs`, and `npx tsc --noEmit`. Tests cover recovery isolation, single exchange under repeated effects, form readiness, invalid/replayed/non-recovery codes, rejected non-Mates, CSRF, password confirmation, save-before-login ordering, failure paths, generic recovery responses, membership/provisioning, password login/logout, layout and locked geometry. Mocked provider tests send no real email. Complete a fresh Safari recovery test locally to verify provider delivery and browser-specific behaviour.

## Files changed in this repair

Application changes:
- `lib/mate/server.ts`: separate recovery cookie client and complete cookie cleanup.
- `lib/mate/recovery.ts` (new): membership-gated provisioning and recovery-email service.
- `app/api/mate/recovery/route.ts` (new): generic server-side recovery requests.
- `app/api/mate/recovery/session/route.ts` (new): isolated code exchange and form-session checks.
- `app/api/mate/password/route.ts`: validate recovery and password confirmation; save before password login.
- `app/api/subscribe/route.ts`: request setup email server-side and preserve partial signup success.
- `app/auth/reset-password/page.tsx`: one exchange, resumable form, navigation only after successful save.
- `app/dev/mate/page.tsx`: password-flow setup guidance.
- `components/mate/MatePanel.tsx` (new): inline SIGN UP/LOG IN/password-reset controls extracted from the canonical page.
- `components/home/CanonicalHomepage.tsx`: SHOWS/MATES/MERCH order and complete cockpit removal of MATES.
- `components/home/useDomeProjection.ts`: move SHOWS to left longitude and reserve centre.
- `components/mate/MateExperience.tsx`: replace obsolete login-link error wording with password-reset wording; transition/session logic unchanged.
- `components/mate/mate.css`: remove unused modal/MATES-on-glass styles.

Removed `components/mate/MateLogin.tsx` (unused email-link modal) and the untracked `lib/mate/browser.ts` (competing browser auth/cookie writer). The earlier local deletions of `app/auth/callback/route.ts` and `lib/mate/entry.ts` were retained. The password-based `app/api/mate/login/route.ts` was already present at the start of this repair and was retained. `proxy.ts`, config/admin/MailerLite eligibility, `/api/mate/session`, geometry, swivel and rendering code were inspected and preserved.

Tests/docs changed: `tests/mate-auth.test.mjs`, `tests/mate-membership.test.mjs`, `tests/newsletter.test.mjs`, `tests/canonical-homepage.test.mjs`, new `tests/mate-recovery.test.mjs`, `docs/mate-entry.md`, and `docs/domepage-verification.md`.

Verification: all 41 Node tests pass; lint, TypeScript and Mate configuration check pass. Production build passes after retrying with network access for the existing Google Font (the first sandboxed attempt failed to download it). Browser inspection verified public inline controls, the empty cockpit centre in development preview, and that an invalid reset session stays on the reset page. Real Safari email delivery/password completion still needs a fresh recovery request. No deployment, push, real emails, password changes or dashboard changes were performed.


## Recovery delivery diagnostics

The browser always receives the same generic recovery response. That response is not proof that an email was accepted or delivered. Server logs now report `supabase-accepted`, `not-eligible`, or a failure stage (`configuration`, `membership`, `provisioning`, `recovery-client`, `supabase-recovery`) with a safe numeric provider status and machine error code when available. Raw provider messages, addresses, credentials, tokens and request URLs are excluded. MailerLite/admin wrappers preserve their underlying error only for extracting this server-side diagnostic. Existing confirmed Mate accounts need no migration; being confirmed alone does not bypass the active Mate-group eligibility check for recovery.

On 22 September 2026, Supabase Auth logs confirmed that the failed recovery attempts at 17:14:50 and 17:21:06 Europe/London reached `/recover` but were rejected with HTTP 429, “email rate limit exceeded.” The project's dashboard limit was 2 authentication emails per hour across the project. Required local credentials, active Mate membership, confirmed account metadata, and the exact local reset redirect allowlist were valid. No account migration was needed. Diagnostic fields are JSON-encoded into the log line because Next's development log capture otherwise reduced an object argument to `{}`. No provider limits or dashboard settings were changed.
