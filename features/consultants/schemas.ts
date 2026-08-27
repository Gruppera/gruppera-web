import { z } from 'zod';

export const consultantSchema = z.object({
  name: z.string(),
  slug: z.string(),
  about: z.string(),
  focus: z.string(),
  photo: z.string(),
});

export const consultantListSchema = z
  .array(consultantSchema)
  .refine(
    (consultants) =>
      new Set(consultants.map((consultant) => consultant.slug)).size ===
      consultants.length,
    { message: 'Consultant slugs must be unique' },
  );
