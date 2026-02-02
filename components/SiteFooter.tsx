"use client";

import { useEffect, useState } from "react";
import { Box, Container, Divider, SimpleGrid, Stack, Text } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";

export const SiteFooter = () => {
  const [footerRef, { height }] = useResizeObserver();
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("footer-sentinel");
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setIsAtBottom(entries.some((entry) => entry.isIntersecting));
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (height) {
      document.documentElement.style.setProperty(
        "--site-footer-height",
        `${Math.ceil(height)}px`
      );
    }
  }, [height]);

  return (
    <Box
      component="footer"
      bg="var(--mantine-color-body)"
      ref={footerRef}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 900,
        transition: "height 180ms ease",
      }}
    >
      <Container size="lg" py={isAtBottom ? "xl" : "sm"}>
        <Stack gap={isAtBottom ? "md" : 0}>
          {isAtBottom ? <Divider /> : null}
          <SimpleGrid
            cols={{ base: 1, sm: isAtBottom ? 2 : 1 }}
            spacing="xl"
          >
            <Stack gap={4}>
              <Text fw={600}>Gruppera Development AB</Text>
              {isAtBottom ? (
                <Text size="sm" c="dimmed">
                  Organisationsnummer: 559058-7043
                </Text>
              ) : null}
            </Stack>
            {isAtBottom ? (
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Kammakargatan 29
                </Text>
                <Text size="sm" c="dimmed">
                  111 60 Stockholm
                </Text>
              </Stack>
            ) : null}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};
