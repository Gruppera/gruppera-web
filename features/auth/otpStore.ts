import crypto from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

type OtpRecord = {
  hash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
};

const store = new Map<string, OtpRecord>();

const hashCode = (email: string, code: string) =>
  crypto
    .createHash("sha256")
    .update(`${email.toLowerCase()}:${code}`)
    .digest("hex");

export const createOtp = (email: string) => {
  const now = Date.now();
  const existing = store.get(email);
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const seconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    throw new Error(`Vänta ${seconds} sekunder innan du begär en ny kod.`);
  }

  const code = crypto.randomInt(100000, 999999).toString();
  store.set(email, {
    hash: hashCode(email, code),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
  });

  return code;
};

export const verifyOtp = (email: string, code: string) => {
  const record = store.get(email);
  if (!record) return false;

  const now = Date.now();
  if (now > record.expiresAt) {
    store.delete(email);
    return false;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(email);
    return false;
  }

  record.attempts += 1;
  const isValid = record.hash === hashCode(email, code);
  if (isValid) {
    store.delete(email);
  } else {
    store.set(email, record);
  }

  return isValid;
};
