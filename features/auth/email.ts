import nodemailer from "nodemailer";

function getEnv(key: string): string | undefined;
function getEnv(key: string, fallback: string): string;
function getEnv(key: string, fallback?: string) {
  return process.env[key]?.trim() || fallback;
}

const getBooleanEnv = (key: string, fallback: boolean) => {
  const value = getEnv(key);
  if (!value) return fallback;
  return value.toLowerCase() === "true";
};

export const sendOtpEmail = async (to: string, code: string) => {
  const host = getEnv("SMTP_HOST");
  const port = Number(getEnv("SMTP_PORT", "587"));
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS");
  const from = getEnv("SMTP_FROM", "no-reply@gruppera.se");
  const fromName = getEnv("SMTP_FROM_NAME", "Gruppera.se Admin");
  const name = getEnv("SMTP_NAME", "gruppera.se");
  const secure = getBooleanEnv("SMTP_SECURE", false);
  const requireTLS = getBooleanEnv("SMTP_REQUIRE_TLS", port === 587 && !secure);

  if (!host) {
    throw new Error("SMTP_HOST saknas");
  }

  const transporter = nodemailer.createTransport({
    host,
    name,
    port,
    secure,
    requireTLS,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from: { name: fromName, address: from },
    to,
    subject: "Din engångskod för Gruppera",
    text: `Din engångskod är ${code}. Den gäller i 10 minuter.`,
  });
};
