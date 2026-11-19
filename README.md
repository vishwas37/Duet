# Duet — Intentionally Childfree, Feminist & Queer-Friendly Dating

Duet is an editorial, minimalist dating web application built exclusively for the intentionally childfree community, combining Hinge-style photo & prompt depth with consent-first feminist safety controls and passwordless Email OTP verification (zero phone numbers).

## Architecture Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, `lucide-react`, `motion`.
- **Firebase v11 Modular SDK** (`src/lib/firebase.ts`):
  - `firebase/auth` — Persistent sessions (Google Sign-In + Custom Token / Email Link OTP).
  - `firebase/firestore` — Split PII-isolated collections (`profiles`, `userPrivate`, `likes`, `matches`, `matches/{matchId}/messages`, `reports`, and server-only `email_otps`).
  - `firebase/storage` — Client-side compressed (`<= 1080px`, JPEG `0.82`) photo uploads to `users/{uid}/photos/{photoId}.jpg` with real-time progress tracking and delete cleanup.
- **Passwordless Email OTP** (`src/lib/emailOtpService.ts` + `functions/src/emailOtp.ts`):
  1. **Production Cloud Function Mode**: Set `VITE_EMAIL_OTP_ENDPOINT` to your deployed `emailOtp` HTTPS Cloud Function (using Resend + SHA-256 salted OTP hashes + 10-minute expiration + rate limiting + `admin.auth().createCustomToken`).
  2. **Firebase Email Link Fallback**: Optional `VITE_ENABLE_EMAIL_LINK_FALLBACK="true"`.
  3. **Dev Email Inbox Preview Mode**: Active automatically when no external endpoint is configured so you can test the complete 6-digit OTP flow immediately.

## Deploying the Production Email OTP Cloud Function

1. Create a Resend API key at [resend.com](https://resend.com) and verify your sending domain.
2. Initialize Firebase Functions (Blaze plan) and copy `functions/src/emailOtp.ts` into your functions project.
3. Configure secrets:
   ```bash
   firebase functions:secrets:set RESEND_API_KEY
   firebase functions:secrets:set OTP_PEPPER_SECRET
   ```
4. Deploy functions and security rules:
   ```bash
   firebase deploy --only functions,firestore:rules,storage
   ```
5. Set `VITE_EMAIL_OTP_ENDPOINT="https://<region>-<project-id>.cloudfunctions.net/emailOtp"` in your environment.

## Security Rules

Review and harden `firestore.rules` and `storage.rules` (also mirrored in `firebase-rules/`) before launching broadly.
