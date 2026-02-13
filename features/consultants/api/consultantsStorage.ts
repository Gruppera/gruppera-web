import { promises as fs } from "fs";
import path from "path";

import type { Consultant } from "../types";
import { consultantListSchema } from "../schemas";

const dataPath = path.join(process.cwd(), "app", "mockdata.json");

type ConsultantUpdates = Partial<Pick<Consultant, "name" | "about" | "focus">>;

export const readConsultants = async () => {
  const raw = await fs.readFile(dataPath, "utf-8");
  const json = JSON.parse(raw);
  return consultantListSchema.parse(json);
};

export const updateConsultant = async (photo: string, updates: ConsultantUpdates) => {
  const consultants = await readConsultants();
  const index = consultants.findIndex((item) => item.photo === photo);
  if (index === -1) {
    throw new Error("Kunde inte hitta profilen.");
  }

  const updated = { ...consultants[index], ...updates };
  consultants[index] = updated;

  await fs.writeFile(dataPath, JSON.stringify(consultants, null, 2) + "\n", "utf-8");

  return updated;
};
