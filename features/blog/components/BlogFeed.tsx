"use client";

import { Badge, Box, Card, Flex, Group, Image, Stack, Text, Title } from "@mantine/core";

import type { BlogPost } from "../types";

type BlogFeedProps = {
  posts: BlogPost[];
};

export const BlogFeed = ({ posts }: BlogFeedProps) => (
  <Stack gap="xl">
    {posts.map((post) => (
      <Card
        key={post.id}
        radius="md"
        p={{ base: "lg", md: "xl" }}
        style={{ backgroundColor: "var(--mantine-color-body)" }}
      >
        <Flex direction={{ base: "column", md: "row" }} gap="lg" align="flex-start">
          <Box
            w={{ base: 320, md: 240 }}
            h={{ base: 200, md: 180 }}
            style={{
              borderRadius: "var(--mantine-radius-md)",
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: "var(--mantine-color-grafite-7)",
            }}
          >
            <Image src={post.image} alt={post.title} fit="cover" h="100%" />
          </Box>
          <Stack gap="md" style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">
              {post.date}
            </Text>

            <Stack gap="xs">
              <Title order={4}>{post.title}</Title>
              <Text c="dimmed" size="sm">
                {post.excerpt}
              </Text>
            </Stack>

            <Group gap="xs">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="light" color="sprout">
                  {tag}
                </Badge>
              ))}
            </Group>
          </Stack>
        </Flex>
      </Card>
    ))}
  </Stack>
);
