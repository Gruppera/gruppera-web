"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, Burger, Container, Drawer, Group, Image, Stack, Text } from "@mantine/core";
import { useDisclosure, useWindowScroll } from "@mantine/hooks";

const EXPANDED_HEIGHT = 88;
const COMPACT_HEIGHT = 64;

export const SiteHeader = () => {
  const [{ y }] = useWindowScroll();
  const [isCompact, setIsCompact] = useState(false);
  const pathname = usePathname();
  const [opened, { close, toggle }] = useDisclosure(false);

  const links = [
    { label: "Gruppera", href: "/" },
    { label: "Vilka är vi", href: "/vilka-ar-vi" },
    { label: "Blogg", href: "/blogg" },
    { label: "Hitta till oss", href: "/hitta-till-oss" },
  ];

  useEffect(() => {
    const compactThreshold = 48;
    const expandThreshold = 16;
    setIsCompact((prev) => {
      if (!prev && y > compactThreshold) return true;
      if (prev && y < expandThreshold) return false;
      return prev;
    });
  }, [y]);

  return (
    <Box
      component="header"
      pos="fixed"
      top={0}
      left={0}
      right={0}
      style={{ zIndex: 1000 }}
    >
      <Box
        bg="var(--mantine-color-body)"
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
          <Group gap="sm" align="center" justify="space-between" w="100%">
            <Box
              component={Link}
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Image
                src="/gruppera-logo-sprout-white.svg"
                alt="Gruppera logo"
                w={{ base: 120, sm: 160 }}
                h="auto"
                style={{
                  transform: `scale(${isCompact ? 0.875 : 1})`,
                  transformOrigin: "left center",
                  transition: "transform 180ms ease",
                  willChange: "transform",
                }}
              />
            </Box>
            <Group gap="md" wrap="wrap" visibleFrom="sm">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Group key={link.href} gap={6} align="center">
                    <Box
                      w={10}
                      style={{
                        opacity: isActive ? 1 : 0,
                        transition: "opacity 180ms ease",
                      }}
                    >
                      <Text c="sprout.4" fw={600}>
                        &gt;
                      </Text>
                    </Box>
                    <Text
                      component={Link}
                      href={link.href}
                      c={isActive ? "var(--mantine-color-text)" : "dimmed"}
                      fw={isActive ? 600 : 500}
                      size="sm"
                    >
                      {link.label}
                    </Text>
                  </Group>
                );
              })}
            </Group>
            <Group gap="xs" hiddenFrom="sm">
              <Burger
                opened={opened}
                onClick={toggle}
                aria-label={opened ? "Close menu" : "Open menu"}
              />
            </Group>
          </Group>
        </Container>
      </Box>
      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        padding="lg"
        size="xs"
        title="Meny"
        withCloseButton
        styles={{
          content: {
            backgroundColor: "var(--mantine-color-grafite-7)",
          },
          header: {
            backgroundColor: "var(--mantine-color-grafite-7)",
          },
          body: {
            paddingTop: "var(--mantine-spacing-lg)",
          },
          close: {
            color: "var(--mantine-color-chamonix-0)",
          },
          title: {
            color: "var(--mantine-color-chamonix-0)",
          },
        }}
        overlayProps={{ opacity: 0.4, blur: 4 }}
        hiddenFrom="sm"
      >
        <Stack gap="md" pt="sm">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Group key={link.href} gap={8} align="center">
                <Box
                  w={10}
                  style={{
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 180ms ease",
                  }}
                >
                  <Text c="sprout.4" fw={600}>
                    &gt;
                  </Text>
                </Box>
                <Text
                  component={Link}
                  href={link.href}
                  onClick={close}
                  c={isActive ? "var(--mantine-color-text)" : "dimmed"}
                  fw={isActive ? 600 : 500}
                  size="md"
                >
                  {link.label}
                </Text>
              </Group>
            );
          })}
        </Stack>
      </Drawer>
    </Box>
  );
};
