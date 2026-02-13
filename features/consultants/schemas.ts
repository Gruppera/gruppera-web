import { z } from 'zod';

export const consultantSchema = z.object({
  name: z.string(),
  about: z.string(),
  focus: z.string(),
  photo: z.string(),
});

export const consultantListSchema = z.array(consultantSchema);

export const consultantUpdateSchema = z
  .object({
    photo: z.string(),
    name: z.string().optional(),
    about: z.string().optional(),
    focus: z.string().optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.about !== undefined || value.focus !== undefined,
    { message: "Inga ändringar att spara." },
  );
