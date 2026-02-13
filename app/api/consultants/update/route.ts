import { NextResponse } from "next/server";

import { consultantUpdateSchema } from "@/features/consultants/schemas";
import { updateConsultant } from "@/features/consultants/api/consultantsStorage";
import { getAuthSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { photo, ...updates } = consultantUpdateSchema.parse(json);

    const updated = await updateConsultant(photo, updates);

    return NextResponse.json({ ok: true, consultant: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Något gick fel";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
