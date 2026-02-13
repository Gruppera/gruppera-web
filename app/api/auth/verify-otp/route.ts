import { NextResponse } from "next/server";

import { verifyOtp } from "@/features/auth/otpStore";
import { verifyOtpSchema } from "@/features/auth/schemas";
import { authCookieName, createAuthCookieValue } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { email, code } = verifyOtpSchema.parse(json);

    const isValid = verifyOtp(email, code);
    if (!isValid) {
      return NextResponse.json(
        { error: "Ogiltig eller utgången engångskod." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    const cookieValue = createAuthCookieValue(email);
    const maxAgeDays = Number(process.env.AUTH_SESSION_DAYS ?? 7);

    response.cookies.set({
      name: authCookieName,
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeDays * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Något gick fel";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
