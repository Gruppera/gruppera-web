"use client";

import { useEffect } from "react";
import { Box, Container, Divider, SimpleGrid, Stack, Text } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";

export const SiteFooter = () => {
  const { ref, height } = useResizeObserver();

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
      bg="dark.9"
      ref={ref}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 900,
      }}
    >
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Divider color="dark.6" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            <Stack gap={4}>
              <Text fw={600}>Gruppera Development AB</Text>
              <Text size="sm" c="cloud.0">
                Organisationsnummer: 559058-7043
              </Text>
            </Stack>
            <Stack gap={4}>
              <Text size="sm" c="cloud.0">
                Kammakargatan 29
              </Text>
              <Text size="sm" c="cloud.0">
                111 60 Stockholm
              </Text>
            </Stack>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};
