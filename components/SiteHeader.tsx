"use client";

import { Box, Container, Group, Image } from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";

const EXPANDED_HEIGHT = 88;
const COMPACT_HEIGHT = 64;

export const SiteHeader = () => {
  const [{ y }] = useWindowScroll();
  const isCompact = y > 32;

  return (
    <Box
      component="header"
      pos="sticky"
      top={0}
      style={{ zIndex: 1000 }}
    >
      <Box
        bg="grafite.7"
        style={{
          height: isCompact ? COMPACT_HEIGHT : EXPANDED_HEIGHT,
          transition: "height 180ms ease",
        }}
      >
        <Container
          size="lg"
          h="100%"
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Group gap="sm" align="center">
            <Image
              src="/gruppera-logo-sprout-white.svg"
              alt="Gruppera logo"
              w={{ base: 120, sm: isCompact ? 140 : 160 }}
              h="auto"
              style={{
                transition: "width 180ms ease",
              }}
            />
          </Group>
        </Container>
      </Box>
    </Box>
  );
};
