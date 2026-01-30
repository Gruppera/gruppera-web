import type { z } from 'zod';

import type { consultantSchema } from './schemas';

export type Consultant = z.infer<typeof consultantSchema>;
