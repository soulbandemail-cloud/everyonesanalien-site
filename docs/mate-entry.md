# Mate entry — MailerLite membership, Supabase authentication

## Configuration

The existing Supabase SSR/PKCE flow, HttpOnly cookies, callback, session verification, logout and cockpit transition are unchanged. Copy variable names from `docs/mate.env.example`; never commit credentials. `SUPABASE_PUBLISHABLE_KEY` remains the session client's key. The separate `SUPABASE_SERVICE_ROLE_KEY` is used only by the server-only admin module, with session persistence disabled. `MAILERLITE_API_TOKEN` is also server-only.

`MATE_APP_ORIGIN` must be the exact origin without trailing slash (HTTPS in production). Development requires `MATE_AUTH_ENABLED=true`. Vercel Preview also requires `MATE_PREVIEW_LOGIN_ENABLED=true`; production requires `MATE_PUBLIC_LOGIN_ENABLED=true`. Preview cannot enable the real production hostname. Existing flags and origins are not changed by this implementation.

`npm run mate:check` and `/dev/mate` report configuration presence only. Provisioning readiness is separate from the session gate: missing MailerLite/admin credentials must not disable existing authenticated sessions. No environment files or dashboard settings are modified by the implementation.

## Entry flows

LOG IN normalises and validates email, checks the request origin, and reads the subscriber from MailerLite. Eligibility in this version means **active** status and membership in group **189432463968175126**. Missing, wrong-group, unconfirmed, unsubscribed, bounced and junk subscribers are ineligible. Login never writes to MailerLite and never provisions or emails an ineligible address.

For eligible subscribers the server finds the Supabase account using paginated admin listing, or creates an unconfirmed account. It sets `app_metadata.mate=true` while preserving other metadata, handles concurrent creation, and never resets passwords or marks email ownership confirmed. Existing authorised accounts are reused. This listing approach avoids a database migration; a dedicated indexed lookup can replace it as account volume grows.

The existing cookie-bound client then calls `signInWithOtp` with `shouldCreateUser:false` and the fixed `/auth/callback` redirect. All valid login submissions receive identical public status/message, including provider failures. Server logs contain generic failure notices, not submitted emails, provider bodies, credentials or tokens. Provider failures do not grant access. Configure provider/hosting request and email rate limits before enabling public login; origin checks are not abuse-rate limiting.

BECOME A MATE performs the existing non-destructive MailerLite upsert into the Mate group. It does not force subscription status, resubscribe suppressed addresses, or fabricate consent. When the returned subscriber is active and eligible and entry is enabled, the shared entry service rechecks membership and starts authentication. A successful MailerLite write followed by authentication failure returns a retry state: membership is retained and LOG IN can retry. Pending/inactive membership does not trigger provisioning or email. With authentication disabled, newsletter signup continues independently.

If MailerLite API double opt-in is enabled, an unconfirmed member must complete MailerLite's confirmation first and then use LOG IN. This version does not add webhooks or automate that second step. No API success alone establishes a browser session.

## Supabase email setting — manual verification required

Keep email confirmation enabled, SMTP working, and the exact app callback allowlisted. Use the standard `{{ .ConfirmationURL }}` template for both confirmation and magic-link email so verification returns the existing PKCE code. Open links in the browser that requested them.

Supabase's magic-link flow for an unconfirmed account uses its signup-confirmation path. If the dashboard globally disables new signups, first-time accounts can therefore fail to receive their confirmation email even though admin creation succeeded. The earlier recommendation to disable all signups is incompatible with this first-time flow. Verify that setting manually before real first-time testing; no dashboard setting has been changed here. Allowing provider signup does not grant Mate authorisation: direct browser-created accounts cannot set `app_metadata.mate`, and the confirmed-email plus metadata check remains mandatory.

References: https://supabase.com/docs/reference/javascript/auth-admin-createuser and https://github.com/supabase/auth/blob/master/internal/api/magic_link.go .

## Ongoing sessions

`currentMate()` and the callback still require a Supabase-verified user, confirmed email and admin-controlled `app_metadata.mate === true`. They do not call MailerLite. A MailerLite outage cannot interrupt an existing Mate session. Membership revocation/synchronisation is explicitly deferred: removing someone from MailerLite does not yet revoke an existing Supabase grant. Future protected data endpoints must use the same server-side access checks.

No cockpit geometry, links, projection, rendering, swivel, transition, logout or cookie-refresh code is changed for membership provisioning. `/ship` remains development-only preview, not a session bypass in production.

## Validation

Run `node --test tests/*.test.mjs`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Tests mock external providers and send no emails. Coverage includes eligibility, non-Mate side-effect prevention, provider outages, metadata preservation, pagination, concurrent provisioning, unconfirmed creation, first-stage signup failure and partial success, generic login responses, session independence, callback/logout security and the existing canonical-content/geometry regressions.

Real delivery and first-time confirmation still require manual testing after secrets and dashboard configuration are ready. Test an active existing MailerLite-only Mate, a new signup, an ineligible address, returning sessions and logout. No bulk import or database migration is required.
