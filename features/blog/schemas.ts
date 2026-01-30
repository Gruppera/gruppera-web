import { z } from "zod";

export const blogPostSchema = z.object({
  id: z.string(),
  image: z.string(),
  date: z.string(),
  title: z.string(),
  excerpt: z.string(),
  tags: z.array(z.string()),
});

export const blogPostListSchema = z.array(blogPostSchema);
