/**
 * Production Reference: Passwordless Email OTP Firebase Cloud Function (v2 HTTPS)
 *
 * Uses Resend (https://resend.com) for email delivery, SHA-256 salted OTP hashing,
 * 10-minute expiration, per-email rate limiting, and Firebase Admin custom tokens.
 *
 * Deploy separately in a Blaze-tier Firebase project:
 *   cd functions && npm install firebase-functions firebase-admin resend
 *   firebase functions:secrets:set RESEND_API_KEY OTP_PEPPER_SECRET
 *   firebase deploy --only functions
 */

import * as crypto from 'node:crypto';
import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const OTP_PEPPER_SECRET = defineSecret('OTP_PEPPER_SECRET');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashValue(input: string, pepper: string): string {
  return crypto.createHash('sha256').update(`${pepper}:${input}`).digest('hex');
}

function generateSixDigitOtp(): string {
  const num = crypto.randomInt(0, 1_000_000);
  return String(num).padStart(6, '0');
}

export const emailOtp = onRequest(
  {
    cors: true,
    secrets: [RESEND_API_KEY, OTP_PEPPER_SECRET],
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const pepper = OTP_PEPPER_SECRET.value();
    const resendKey = RESEND_API_KEY.value();
    const { action, email, code } = (req.body ?? {}) as {
      action?: 'send' | 'verify';
      email?: string;
      code?: string;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    const normalized = normalizeEmail(email);
    const emailHash = hashValue(normalized, pepper);
    const otpRef = db.collection('email_otps').doc(emailHash);

    if (action === 'send') {
      const existing = await otpRef.get();
      const now = Date.now();

      if (existing.exists) {
        const data = existing.data()!;
        if (now - (data.lastSentAt ?? 0) < RESEND_COOLDOWN_MS) {
          res.status(429).json({ error: 'Please wait 60 seconds before requesting another code.' });
          return;
        }
      }

      const otp = generateSixDigitOtp();
      const otpHash = hashValue(`${normalized}:${otp}`, pepper);

      await otpRef.set({
        emailHash,
        otpHash,
        attempts: 0,
        lastSentAt: now,
        expiresAt: now + OTP_TTL_MS,
      });

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Duet <verify@duet.community>',
          to: [normalized],
          subject: `${otp} is your Duet verification code`,
          html: `
            <div style="font-family: Georgia, serif; background: #FAF9F6; padding: 40px 24px; color: #18181B;">
              <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 20px; padding: 32px;">
                <h1 style="font-size: 28px; margin: 0 0 12px; font-weight: 400;">Duet</h1>
                <p style="font-family: Inter, sans-serif; font-size: 15px; line-height: 1.6; color: #52525B;">
                  Enter this 6-digit verification code to continue without sharing a phone number. It expires in 10 minutes.
                </p>
                <div style="font-family: monospace; font-size: 32px; letter-spacing: 8px; padding: 20px; margin: 24px 0; text-align: center; background: #EEF3F0; color: #3F6251; border-radius: 12px;">
                  ${otp}
                </div>
                <p style="font-family: Inter, sans-serif; font-size: 12px; color: #71717A;">
                  If you did not request this code, you can safely ignore this message.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const detail = await emailRes.text();
        res.status(502).json({ error: 'Unable to send verification email.', detail });
        return;
      }

      res.status(200).json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });
      return;
    }

    if (action === 'verify') {
      if (!code || !/^\d{6}$/.test(code.trim())) {
        res.status(400).json({ error: 'Please enter a valid 6-digit code.' });
        return;
      }

      const snap = await otpRef.get();
      if (!snap.exists) {
        res.status(400).json({ error: 'No active verification code found. Request a new code.' });
        return;
      }

      const record = snap.data()!;
      if (Date.now() > record.expiresAt) {
        await otpRef.delete();
        res.status(400).json({ error: 'This verification code has expired.' });
        return;
      }

      if ((record.attempts ?? 0) >= MAX_ATTEMPTS) {
        await otpRef.delete();
        res.status(429).json({ error: 'Too many incorrect attempts. Please request a fresh code.' });
        return;
      }

      const expectedHash = hashValue(`${normalized}:${code.trim()}`, pepper);
      if (!crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(record.otpHash))) {
        await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
        res.status(401).json({ error: 'Incorrect verification code. Please try again.' });
        return;
      }

      await otpRef.delete();

      let userRecord: admin.auth.UserRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(normalized);
        if (!userRecord.emailVerified) {
          userRecord = await admin.auth().updateUser(userRecord.uid, { emailVerified: true });
        }
      } catch {
        userRecord = await admin.auth().createUser({
          email: normalized,
          emailVerified: true,
        });
      }

      const customToken = await admin.auth().createCustomToken(userRecord.uid, {
        email: normalized,
        email_verified: true,
      });

      res.status(200).json({
        ok: true,
        uid: userRecord.uid,
        email: normalized,
        customToken,
      });
      return;
    }

    res.status(400).json({ error: 'Unsupported action. Expected "send" or "verify".' });
  }
);
