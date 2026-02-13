import { NextResponse } from "next/server";

import { createOtp } from "@/features/auth/otpStore";
import { sendOtpEmail } from "@/features/auth/email";
import { requestOtpSchema } from "@/features/auth/schemas";

const getAllowedDomains = () => {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS ?? "gruppera.se";
  return raw
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
};

const isAllowedEmail = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return getAllowedDomains().includes(domain);
};

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { email } = requestOtpSchema.parse(json);

    if (!isAllowedEmail(email)) {
      return NextResponse.json(
        { error: "Endast adresser på godkänd domän får logga in." },
        { status: 403 },
      );
    }

    const code = createOtp(email);
    await sendOtpEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Något gick fel";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
