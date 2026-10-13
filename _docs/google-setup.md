# Google sign-in setup from zero

1. Create a project in Google Cloud Console. Open Google Auth Platform, configure app branding, support contact, audience and requested basic identity scopes. For testing, add your own Google account as a test user where required.
2. Create an OAuth client with application type Web application. Set Authorized JavaScript origins to http://localhost:5173 and http://127.0.0.1:5173 for development, and your exact HTTPS application origin for production.
3. Put the public client ID in server `.env` as GOOGLE_CLIENT_ID. GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI are not needed by this GIS ID-token integration. Set ORGANIZER_EMAILS to a comma-separated list of preassigned organizer Google emails. No user can self-assign organizer status through Google login.
4. Frontend GIS obtains a signed Google ID token with the server-issued nonce. POST /api/auth/google validates signature, issuer, audience and token expiry using Google's official google-auth-library, then checks verified email and nonce. The nonce is single-use, expires after ten minutes and is bound to an HttpOnly cookie. Server sessions expire after eight hours. Mutations use the returned CSRF token in X-CSRF-Token.
5. Production needs HTTPS and NODE_ENV=production. Cookies are HttpOnly, Secure and SameSite=Lax. Keep database on a durable volume. Real secrets and student data must not enter git.

Live provider sign-in has not been exercised: the Google Cloud page was unavailable and no client ID was provisioned. Tests inject a verifier only for unit testing; they are not evidence of provider authentication. The Google sign-in button will be wired in the frontend task.

Optional local fictional accounts: set DEMO_MODE=true in development. /api/auth/demo is unavailable in production even when this flag is set. Demo accounts are explicit and do not demonstrate Google authentication.
