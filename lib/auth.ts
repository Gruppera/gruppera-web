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

const fromBase64Url = (input: string) => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64");
};

const sign = (value: string) => {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(value);
  return toBase64Url(hmac.digest());
};

export const createAuthCookieValue = (email: string) => {
  const maxAgeDays = Number(process.env.AUTH_SESSION_DAYS ?? DEFAULT_SESSION_DAYS);
  const expiresAt = Date.now() + maxAgeDays * 24 * 60 * 60 * 1000;
  const payload = toBase64Url(
    Buffer.from(JSON.stringify({ email, expiresAt }), "utf-8"),
  );
  const signature = sign(payload);
  return `${payload}.${signature}`;
};

export const verifyAuthCookieValue = (value: string) => {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;

  try {
    const decoded = JSON.parse(fromBase64Url(payload).toString("utf-8")) as {
      email?: string;
      expiresAt?: number;
    };
    if (!decoded.email || !decoded.expiresAt) return null;
    if (Date.now() > decoded.expiresAt) return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
};

export const getAuthSession = async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookieValue) return null;
  return verifyAuthCookieValue(cookieValue);
};

export const authCookieName = COOKIE_NAME;
