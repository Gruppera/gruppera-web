import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "gruppera_auth";
const DEFAULT_SESSION_DAYS = 7;

const getSecret = () => {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret) {
    throw new Error("AUTH_COOKIE_SECRET saknas");
  }
  return secret;
};

const toBase64Url = (input: Buffer) =>
  input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const sign = (value: string) => {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(value);
  return toBase64Url(hmac.digest());
};

export const createAuthCookieValue = (email: string) => {
  const maxAgeDays = Number(process.env.AUTH_SESSION_DAYS ?? DEFAULT_SESSION_DAYS);
  const expiresAt = Date.now() + maxAgeDays * 24 * 60 * 60 * 1000;
  const payload = `${email}.${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
};

export const verifyAuthCookieValue = (value: string) => {
  const [email, expiresAtRaw, signature] = value.split(".");
  if (!email || !expiresAtRaw || !signature) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  const payload = `${email}.${expiresAt}`;
  if (sign(payload) !== signature) return null;

  return { email };
};

export const getAuthSession = () => {
  const cookieValue = cookies().get(COOKIE_NAME)?.value;
  if (!cookieValue) return null;
  return verifyAuthCookieValue(cookieValue);
};

export const authCookieName = COOKIE_NAME;
