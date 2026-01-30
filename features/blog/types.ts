import type { z } from "zod";

import type { blogPostSchema } from "./schemas";

export type BlogPost = z.infer<typeof blogPostSchema>;
