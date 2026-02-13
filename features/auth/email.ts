import nodemailer from "nodemailer";

const getEnv = (key: string, fallback?: string) =>
  process.env[key] ?? fallback;

export const sendOtpEmail = async (to: string, code: string) => {
  const host = getEnv("SMTP_HOST");
  const port = Number(getEnv("SMTP_PORT", "587"));
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS");
  const from = getEnv("SMTP_FROM", "no-reply@gruppera.se");
  const secure = getEnv("SMTP_SECURE", "false") === "true";

  if (!host) {
    throw new Error("SMTP_HOST saknas");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to,
    subject: "Din engångskod för Gruppera",
    text: `Din engångskod är ${code}. Den gäller i 10 minuter.`,
  });
};
