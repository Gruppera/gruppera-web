import { z } from 'zod';

export const consultantSchema = z.object({
  name: z.string(),
  about: z.string(),
  focus: z.string(),
  photo: z.string(),
});

export const consultantListSchema = z.array(consultantSchema);
