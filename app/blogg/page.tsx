import { Box, Container, Stack, Text, Title } from "@mantine/core";

import mockData from "./mockdata.json";
import { BlogFeed } from "@/features/blog/components/BlogFeed";
import { blogPostListSchema } from "@/features/blog/schemas";

export default function BloggPage() {
  const posts = blogPostListSchema.parse(mockData);

  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap={{ base: "lg", md: "xl" }}>
          <Stack gap="sm">
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Blogg
            </Title>
            <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
              Uppdateringar, perspektiv och insikter från våra konsulter.
            </Text>
          </Stack>

          <BlogFeed posts={posts} />
        </Stack>
      </Container>
    </Box>
  );
}
