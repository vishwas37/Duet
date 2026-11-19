import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithCustomToken,
  signInWithEmailLink,
} from 'firebase/auth';
import { auth } from './firebase';
import { isValidEmail, isValidSixDigitOtp } from '../utils/matching';

export type OtpDeliveryMode = 'production-endpoint' | 'firebase-email-link' | 'dev-inbox-preview';

export interface DevOtpPreviewMessage {
  email: string;
  code: string;
  issuedAt: number;
  expiresAt: number;
}

export interface SendOtpResult {
  mode: OtpDeliveryMode;
  expiresInSeconds: number;
  devPreview?: DevOtpPreviewMessage;
}

export interface VerifyOtpResult {
  uid: string;
  email: string;
  mode: OtpDeliveryMode;
  firebaseSynced: boolean;
}

interface StoredDevOtp {
  email: string;
  codeHash: string;
  attempts: number;
  lastSentAt: number;
  expiresAt: number;
}

const DEV_OTP_STORAGE_KEY = 'duet_dev_otp_pending';
const EMAIL_LINK_STORAGE_KEY = 'duet_email_link_address';
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getOtpEndpoint(): string | null {
  const endpoint = import.meta.env.VITE_EMAIL_OTP_ENDPOINT?.trim();
  return endpoint && endpoint.length > 0 ? endpoint : null;
}

function isEmailLinkFallbackEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_EMAIL_LINK_FALLBACK === 'true';
}

export function getActiveOtpMode(): OtpDeliveryMode {
  if (getOtpEndpoint()) return 'production-endpoint';
  if (isEmailLinkFallbackEnabled() && auth) return 'firebase-email-link';
  return 'dev-inbox-preview';
}

async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic hash for non-HTTPS test environments
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function generateSixDigitCode(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(arr[0] % 1_000_000).padStart(6, '0');
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function deriveLocalUidFromEmail(email: string): Promise<string> {
  const hash = await sha256Hex(`duet_member:${email.trim().toLowerCase()}`);
  return `otp_${hash.slice(0, 20)}`;
}

export async function sendEmailOtp(rawEmail: string): Promise<SendOtpResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  const endpoint = getOtpEndpoint();
  if (endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', email }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Could not send verification email. Please try again.');
    }
    return {
      mode: 'production-endpoint',
      expiresInSeconds: payload.expiresInSeconds ?? 600,
    };
  }

  if (isEmailLinkFallbackEnabled() && auth) {
    await sendSignInLinkToEmail(auth, email, {
      url: window.location.origin,
      handleCodeInApp: true,
    });
    window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
    return {
      mode: 'firebase-email-link',
      expiresInSeconds: 600,
    };
  }

  // Seamless Dev Email Inbox Preview fallback
  const code = generateSixDigitCode();
  const now = Date.now();
  const expiresAt = now + OTP_TTL_MS;
  const codeHash = await sha256Hex(`${email}:${code}`);

  const record: StoredDevOtp = {
    email,
    codeHash,
    attempts: 0,
    lastSentAt: now,
    expiresAt,
  };
  window.sessionStorage.setItem(DEV_OTP_STORAGE_KEY, JSON.stringify(record));

  return {
    mode: 'dev-inbox-preview',
    expiresInSeconds: OTP_TTL_MS / 1000,
    devPreview: {
      email,
      code,
      issuedAt: now,
      expiresAt,
    },
  };
}

export async function verifyEmailOtp(rawEmail: string, rawCode: string): Promise<VerifyOtpResult> {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.trim();

  if (!isValidEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!isValidSixDigitOtp(code)) {
    throw new Error('Please enter the complete 6-digit verification code.');
  }

  const endpoint = getOtpEndpoint();
  if (endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', email, code }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Verification failed. Please check the code and try again.');
    }

    let firebaseSynced = false;
    if (payload.customToken && auth) {
      await signInWithCustomToken(auth, payload.customToken);
      firebaseSynced = true;
    }

    return {
      uid: payload.uid || (await deriveLocalUidFromEmail(email)),
      email,
      mode: 'production-endpoint',
      firebaseSynced,
    };
  }

  const rawStored = window.sessionStorage.getItem(DEV_OTP_STORAGE_KEY);
  if (!rawStored) {
    throw new Error('No active verification code found. Request a fresh code.');
  }

  const record = JSON.parse(rawStored) as StoredDevOtp;
  if (record.email !== email) {
    throw new Error('This code was issued for a different email address.');
  }
  if (Date.now() > record.expiresAt) {
    window.sessionStorage.removeItem(DEV_OTP_STORAGE_KEY);
    throw new Error('This verification code has expired. Please request a new one.');
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    window.sessionStorage.removeItem(DEV_OTP_STORAGE_KEY);
    throw new Error('Too many incorrect attempts. Please request a fresh code.');
  }

  const candidateHash = await sha256Hex(`${email}:${code}`);
  if (candidateHash !== record.codeHash) {
    record.attempts += 1;
    window.sessionStorage.setItem(DEV_OTP_STORAGE_KEY, JSON.stringify(record));
    throw new Error('Incorrect verification code. Please check your inbox preview and try again.');
  }

  window.sessionStorage.removeItem(DEV_OTP_STORAGE_KEY);
  const uid = await deriveLocalUidFromEmail(email);

  return {
    uid,
    email,
    mode: 'dev-inbox-preview',
    firebaseSynced: false,
  };
}

export async function completePendingEmailLinkSignIn(): Promise<VerifyOtpResult | null> {
  if (!auth || !isSignInWithEmailLink(auth, window.location.href)) {
    return null;
  }
  const savedEmail = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
  if (!savedEmail) return null;

  const credential = await signInWithEmailLink(auth, savedEmail, window.location.href);
  window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
  window.history.replaceState({}, document.title, window.location.pathname);

  return {
    uid: credential.user.uid,
    email: credential.user.email || savedEmail,
    mode: 'firebase-email-link',
    firebaseSynced: true,
  };
}
