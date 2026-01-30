"use client";

import "@mantine/carousel/styles.css";

import { useEffect, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import { Carousel } from "@mantine/carousel";
import { Badge, Box, Card, Flex, Group, Image, Stack, Text, Title } from "@mantine/core";
import { useHover } from "@mantine/hooks";

import type { BlogPost } from "../types";

type BlogFeedProps = {
  posts: BlogPost[];
};

type PostImageCarouselProps = {
  images: string[];
  alt: string;
};

const PostImageCarousel = ({ images, alt }: PostImageCarouselProps) => {
  const [embla, setEmbla] = useState<EmblaCarouselType | null>(null);
  const hasMultiple = images.length > 1;
  const { hovered, ref } = useHover();
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!embla || !hasMultiple || hovered || isInteracting) return;
    const interval = window.setInterval(() => {
      embla.scrollNext();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [embla, hasMultiple, hovered, isInteracting]);

  return (
    <Carousel
      ref={ref}
      getEmblaApi={setEmbla}
      withIndicators={hasMultiple}
      withControls={hasMultiple}
      loop={hasMultiple}
      align="start"
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
      onMouseDown={() => setIsInteracting(true)}
      onMouseUp={() => setIsInteracting(false)}
      styles={{
        root: { height: "100%" },
        viewport: { height: "100%" },
        container: { height: "100%" },
        slide: { height: "100%" },
        control: {
          opacity: hovered ? 1 : 0,
          transition: "opacity 150ms ease",
          pointerEvents: hovered ? "auto" : "none",
        },
      }}
    >
      {images.map((image) => (
        <Carousel.Slide key={image}>
          <Image src={image} alt={alt} fit="cover" h="100%" />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
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
        <Flex direction={{ base: "column", sm: "row" }} gap="lg" align="flex-start">
          <Box
            w={{ base: 320, sm: 240 }}
            h={{ base: 200, sm: 180 }}
            style={{
              borderRadius: "var(--mantine-radius-md)",
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: "var(--mantine-color-grafite-7)",
            }}
          >
            <PostImageCarousel images={post.images} alt={post.title} />
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
